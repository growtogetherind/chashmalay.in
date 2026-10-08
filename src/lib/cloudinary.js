const MAX_IMAGE_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const uploadEndpoint = (cloudName) => `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

export const transformCloudinaryUrl = (url, { width = 800, crop = 'scale' } = {}) => {
  if (!url || typeof url !== 'string' || !url.includes('/upload/')) return url || '';

  const transform = `f_auto,q_auto,c_${crop},w_${width}`;
  return url.replace(/\/upload\/(?:(?:[a-z]_[a-z0-9_]+,?)+[\\/])?/, `/upload/${transform}/`);
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
  const ext = extMatch ? extMatch[1].toLowerCase() : "";
  const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'heic', 'heif', 'jfif']);
  
  if (ext && !allowedExtensions.has(ext)) {
    return "Only JPG, JPEG, PNG, WEBP, AVIF, HEIC, or GIF images are allowed.";
  }

  if (file.type && !ALLOWED_IMAGE_TYPES.has(file.type) && !allowedExtensions.has(ext)) {
    return "Only JPG, PNG, WEBP, AVIF, HEIC, or GIF images can be uploaded.";
  }
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

  xhr.onerror = () => {
    const isBlocked = xhr.status === 0;
    reject(new Error(
      isBlocked
        ? 'Network error while uploading to Cloudinary (request blocked or unreachable).'
        : `Network error while uploading to Cloudinary (status ${xhr.status}).`
    ));
  };
  xhr.ontimeout = () => reject(new Error('Cloudinary upload timed out.'));
  xhr.timeout = timeout;
  xhr.send(formData);
});

const uploadWithFetch = async ({ endpoint, formData, timeout = 60000 }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);
    let data = {};
    try {
      data = await res.json();
    } catch {
      throw new Error('Cloudinary returned an invalid response.');
    }
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `Cloudinary upload failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

/**
 * Compresses an image in the browser using HTML5 Canvas and converts it to a highly optimized WebP Base64 data URL.
 */
export const compressToWebP = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided for image compression."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
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
            reject(new Error("Could not initialize 2D canvas context for compression."));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve(dataUrl);
        } catch (canvasErr) {
          reject(new Error("Canvas compression failed: " + (canvasErr?.message || canvasErr)));
        }
      };
      img.onerror = () => reject(new Error("Browser failed to decode image. File may be corrupted or in an unsupported format."));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error(reader.error?.message || "Browser FileReader failed to read file from disk."));
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a base64 data string back to a Blob object for uploading.
 */
export const base64ToBlob = (base64Data, contentType = 'image/webp') => {
  if (!base64Data) return new Blob([], { type: contentType });
  const base64 = base64Data.split(',')[1] || base64Data;
  const byteCharacters = atob(base64);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([byteArray], { type: contentType });
};

/**
 * Sanitizes a filename for SEO-friendly Cloudinary public_ids.
 * Converts to lowercase, replaces spaces/special chars with dashes.
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName) return `product-${Date.now().toString(36)}`;
  const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  const clean = nameWithoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with dashes
    .replace(/-+/g, '-')        // Collapse multiple dashes
    .replace(/^-|-$/g, '');     // Trim dashes from start/end
  return clean || `product-${Date.now().toString(36)}`;
};

export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  if (!file) {
    reject(new Error("No file provided to convert to base64."));
    return;
  }
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error(reader.error?.message || "Browser FileReader failed to read image file."));
  reader.readAsDataURL(file);
});

const uploadWithServerProxy = async ({ base64Data, folder, tags, publicId, timeout = 60000 }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64Data,
        folder,
        tags,
        public_id: publicId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    let data = {};
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Upload proxy endpoint returned HTTP ${res.status}: ${text.slice(0, 100)}`);
    }

    if (!res.ok || data.error) {
      const errMsg = typeof data.error === 'object' ? data.error?.message : data.error;
      throw new Error(errMsg || `Upload proxy failed with status ${res.status}`);
    }

    return data;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

/**
 * Uploads an image to Cloudinary and returns an optimized URL ready to store.
 * Automatically retries and falls back to server proxy if client is blocked by ad-blocker or CORS.
 */
export const uploadImage = async (file, folder = 'products', options = {}) => {
  const { 
    onProgress, 
    retries = 1, 
    maxBytes = MAX_IMAGE_UPLOAD_BYTES, 
    timeout = 60000, 
    tags = [],
    base64: precomputedBase64 = null 
  } = options;

  const validationError = validateImageFile(file, maxBytes);
  if (validationError) return { url: null, error: validationError };

  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dpv40ou2c';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'g65f7lye';

    if (!cloudName) throw new Error("Cloudinary Cloud Name is missing.");
    if (!uploadPreset) throw new Error("Cloudinary upload preset is missing.");

    // Compress the image before uploading to make the upload ultra-fast and smooth!
    let uploadFile = file;
    let base64DataForProxy = precomputedBase64;

    try {
      if (!base64DataForProxy && file && (file instanceof Blob || (file.type && file.type.startsWith('image/')))) {
        const compressedBase64 = await compressToWebP(file, 1200, 1200, 0.75);
        base64DataForProxy = compressedBase64;
        const mimeType = 'image/webp';
        const blob = base64ToBlob(compressedBase64, mimeType);
        uploadFile = new File([blob], file.name ? file.name.replace(/\.[^/.]+$/, "") + ".webp" : 'image.webp', { type: mimeType });
      } else if (base64DataForProxy && (!(file instanceof Blob) || file.size === 0)) {
        const blob = base64ToBlob(base64DataForProxy, 'image/webp');
        uploadFile = new File([blob], (file?.name ? file.name.replace(/\.[^/.]+$/, "") : 'image') + ".webp", { type: 'image/webp' });
      }
    } catch (compressionErr) {
      console.warn("Client-side image compression fallback notice. Using original file:", compressionErr?.message || compressionErr);
    }

    let data = null;
    let lastError = null;

    // Auto-generate tags from folder if none provided (e.g. 'products/colors' -> ['products', 'colors'])
    const uploadTags = tags.length ? tags : (folder ? folder.split('/') : []);
    const uniqueSuffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const publicId = uploadFile.name
      ? `${sanitizeFileName(uploadFile.name)}-${uniqueSuffix}`
      : `product-${uniqueSuffix}`;

    // Helper to generate a fresh FormData for every network attempt (preventing consumed stream reuse)
    const createFormData = () => {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('upload_preset', uploadPreset);
      if (folder) fd.append('folder', folder);
      if (uploadTags.length > 0) fd.append('tags', uploadTags.join(','));
      if (publicId) fd.append('public_id', publicId);
      return fd;
    };

    // 1. Direct browser upload to Cloudinary (with retries and XHR/Fetch fallbacks)
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      if (attempt > 0) {
        // Short pause between retries
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }

      try {
        // Try XHR first for progress feedback
        try {
          data = await uploadWithXhr({
            endpoint: uploadEndpoint(cloudName),
            formData: createFormData(),
            onProgress,
            timeout,
          });
        } catch (xhrErr) {
          // If XHR failed (e.g. aborted by browser or network error), attempt fetch as a direct retry with a fresh FormData
          data = await uploadWithFetch({
            endpoint: uploadEndpoint(cloudName),
            formData: createFormData(),
            timeout,
          });
        }

        lastError = null;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    // 2. If direct browser upload failed (usually ad-blockers like Brave Shields/uBlock, corporate firewall, or client network issues), fall back to server proxy
    if (!data) {
      try {
        console.warn("Direct Cloudinary upload failed. Attempting fallback via server upload proxy (/api/upload-image)...", lastError);
        const base64Payload = base64DataForProxy || (await fileToBase64(uploadFile));
        data = await uploadWithServerProxy({
          base64Data: base64Payload,
          folder,
          tags: uploadTags,
          publicId,
          timeout,
        });
        lastError = null;
        console.info("Image uploaded successfully via server upload proxy fallback!");
      } catch (proxyError) {
        console.error("Server proxy upload fallback also failed:", proxyError);
        const directMsg = (lastError instanceof Error ? lastError.message : String(lastError || '')) || 'Direct upload blocked';
        const proxyMsg = (proxyError instanceof Error ? proxyError.message : String(proxyError || '')) || 'Server proxy upload failed';
        lastError = new Error(`${proxyMsg} (Direct: ${directMsg})`);
      }
    }

    if (lastError) {
      const isLikelyNetworkOrBlocked = lastError.message?.toLowerCase().includes('network error') ||
        lastError.message?.toLowerCase().includes('blocked') ||
        lastError.message?.toLowerCase().includes('failed to fetch');

      if (isLikelyNetworkOrBlocked) {
        throw new Error(
          `${lastError.message} (Please check your internet connection or disable ad-blockers/Brave shields for this site)`
        );
      }
      throw lastError;
    }

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
