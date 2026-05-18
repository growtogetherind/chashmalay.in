const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const uploadEndpoint = (cloudName) => `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

export const transformCloudinaryUrl = (url, { width = 800, crop = 'scale' } = {}) => {
  if (!url || !url.includes('/upload/')) return url || '';

  const transform = ['f_auto', 'q_auto', `c_${crop}`, `w_${width}`].join(',');
  return url.replace('/upload/', `/upload/${transform}/`);
};

export const getCloudinarySrcSet = (url, widths = [320, 480, 640, 800, 1200, 1600]) => (
  widths
    .map((width) => `${transformCloudinaryUrl(url, { width })} ${width}w`)
    .join(', ')
);

const validateImageFile = (file, maxBytes) => {
  if (!file) return "No file provided";
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Only JPG, PNG, WEBP, AVIF, or GIF images can be uploaded.";
  if (file.size > maxBytes) return `Image must be smaller than ${Math.round(maxBytes / 1024 / 1024)}MB.`;
  return null;
};

const uploadWithXhr = ({ endpoint, formData, onProgress, timeout = 6000 }) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', endpoint);

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable && onProgress) {
      onProgress(Math.round((event.loaded / event.total) * 100));
    }
  };

  xhr.onload = () => {
    let data = {};
    try {
      data = JSON.parse(xhr.responseText || '{}');
    } catch {
      reject(new Error('Cloudinary returned an invalid response.'));
      return;
    }

    if (xhr.status < 200 || xhr.status >= 300 || data.error) {
      reject(new Error(data.error?.message || `Cloudinary upload failed with status ${xhr.status}`));
      return;
    }

    resolve(data);
  };

  xhr.onerror = () => reject(new Error('Network error while uploading to Cloudinary.'));
  xhr.ontimeout = () => reject(new Error('Cloudinary upload timed out.'));
  xhr.timeout = timeout;
  xhr.send(formData);
});

/**
 * Compresses an image in the browser using HTML5 Canvas and converts it to a Base64 data URL
 * to avoid exceeding Firestore's 1MB document size limit when storing offline uploads.
 */
const compressAndConvertToBase64 = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not get 2D canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Uploads an image to Cloudinary and returns an optimized URL ready to store.
 * If Cloudinary is offline or DNS is unresolved (e.g. net::ERR_NAME_NOT_RESOLVED), 
 * it automatically falls back to a high-quality locally compressed Base64 data URL.
 */
export const uploadImage = async (file, folder = 'products', options = {}) => {
  const { onProgress, retries = 0, maxBytes = MAX_IMAGE_UPLOAD_BYTES, timeout = 6000 } = options;
  const validationError = validateImageFile(file, maxBytes);
  if (validationError) return { url: null, error: validationError };

  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) throw new Error("Cloudinary Cloud Name is missing from environment variables.");
    if (!uploadPreset) throw new Error("Cloudinary upload preset is missing from environment variables.");

    let data = null;
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        if (folder) formData.append('folder', folder);

        data = await uploadWithXhr({
          endpoint: uploadEndpoint(cloudName),
          formData,
          onProgress,
          timeout,
        });
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) throw lastError;
    if (!data?.secure_url) throw new Error("Cloudinary did not return a secure URL.");

    return {
      url: transformCloudinaryUrl(data.secure_url),
      secureUrl: data.secure_url,
      publicId: data.public_id,
      resourceType: data.resource_type,
      format: data.format,
      error: null
    };
  } catch (error) {
    console.warn("Cloudinary upload failed (possibly offline or DNS block). Falling back to local compressed Base64 data URL:", error);
    try {
      const base64Url = await compressAndConvertToBase64(file);
      return {
        url: base64Url,
        secureUrl: base64Url,
        publicId: `fallback-${Date.now()}`,
        resourceType: 'image',
        format: file.type.split('/')[1] || 'jpeg',
        error: null
      };
    } catch (fallbackError) {
      return { url: null, error: `Upload failed: ${error.message || error}. Fallback also failed: ${fallbackError.message || fallbackError}` };
    }
  }
};
