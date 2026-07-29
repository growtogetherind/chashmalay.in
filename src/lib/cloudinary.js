const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
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
  
  // Extension whitelist pre-check
  const fileName = file.name || "";
  const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
  if (!extMatch) return "File has no valid extension.";
  const ext = extMatch[1].toLowerCase();
  const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif']);
  if (!allowedExtensions.has(ext)) {
    return "Only JPG, JPEG, PNG, WEBP, AVIF, or GIF images are allowed.";
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Only JPG, PNG, WEBP, AVIF, or GIF images can be uploaded.";
  if (file.size > maxBytes) return `Image must be smaller than ${Math.round(maxBytes / 1024 / 1024)}MB.`;
  return null;
};

const uploadWithXhr = ({ endpoint, formData, onProgress, timeout = 60000 }) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', endpoint);

  let lastUpdate = 0;
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable && onProgress) {
      const percent = Math.round((event.loaded / event.total) * 100);
      const now = Date.now();
      // Throttle updates: call onProgress only if 250ms elapsed, or if percent changed, or at 100%
      if (percent === 100 || now - lastUpdate > 250) {
        onProgress(percent);
        lastUpdate = now;
      }
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
 * Compresses an image in the browser using HTML5 Canvas and converts it to a highly optimized WebP Base64 data URL.
 */
export const compressToWebP = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) => {
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

        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Converts a base64 data string back to a Blob object for uploading.
 */
export const base64ToBlob = (base64Data, contentType = 'image/webp') => {
  const base64 = base64Data.split(',')[1] || base64Data;
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};



/**
 * Sanitizes a filename for SEO-friendly Cloudinary public_ids.
 * Converts to lowercase, replaces spaces/special chars with dashes.
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName) return `upload-${Date.now()}`;
  const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  return nameWithoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with dashes
    .replace(/-+/g, '-')        // Collapse multiple dashes
    .replace(/^-|-$/g, '');     // Trim dashes from start/end
};

/**
 * Uploads an image to Cloudinary and returns an optimized URL ready to store.
 */
export const uploadImage = async (file, folder = 'products', options = {}) => {
  const { onProgress, retries = 0, maxBytes = MAX_IMAGE_UPLOAD_BYTES, timeout = 60000, tags = [] } = options;
  const validationError = validateImageFile(file, maxBytes);
  if (validationError) return { url: null, error: validationError };

  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) throw new Error("Cloudinary Cloud Name is missing from environment variables.");
    if (!uploadPreset) throw new Error("Cloudinary upload preset is missing from environment variables.");

    // Compress the image before uploading to make the upload ultra-fast and smooth!
    let uploadFile = file;
    try {
      if (file.type && file.type.startsWith('image/')) {
        const compressedBase64 = await compressToWebP(file, 1200, 1200, 0.75);
        const mimeType = 'image/webp';
        const blob = base64ToBlob(compressedBase64, mimeType);
        uploadFile = new File([blob], file.name ? file.name.replace(/\.[^/.]+$/, "") + ".webp" : 'image.webp', { type: mimeType });
      }
    } catch (compressionErr) {
      console.warn("Client-side image compression failed. Uploading original file:", compressionErr);
    }

    let data = null;
    let lastError = null;

    // Auto-generate tags from folder if none provided (e.g. 'products/colors' -> ['products', 'colors'])
    const uploadTags = tags.length ? tags : (folder ? folder.split('/') : []);

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('upload_preset', uploadPreset);
        if (folder) formData.append('folder', folder);
        if (uploadTags.length > 0) formData.append('tags', uploadTags.join(','));
        if (uploadFile.name) formData.append('public_id', sanitizeFileName(uploadFile.name));

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
    console.error("Cloudinary upload failed:", error);
    return { url: null, error: error.message || String(error) };
  }
};
