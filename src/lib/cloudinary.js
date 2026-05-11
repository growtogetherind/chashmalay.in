import { Cloudinary } from "@cloudinary/url-gen";
import { quality, format } from "@cloudinary/url-gen/actions/delivery";
import { scale } from "@cloudinary/url-gen/actions/resize";
import { auto as autoQuality } from "@cloudinary/url-gen/qualifiers/quality";
import { auto as autoFormat } from "@cloudinary/url-gen/qualifiers/format";

const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  }
});



/**
 * Uploads an image to Cloudinary and returns an optimized URL using the SDK.
 */
export const uploadImage = async (file, folder = 'products') => {
  if (!file) return { url: null, error: "No file provided" };
  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) throw new Error("Cloudinary Cloud Name is missing from environment variables.");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.error) {
      console.error("Cloudinary API Error:", data.error.message);
      throw new Error(data.error.message);
    }

    // Use the secure_url and inject transformations for reliability
    // Replace '/upload/' with '/upload/q_auto/f_auto/c_scale,w_800/'
    const optimizedUrl = data.secure_url.replace('/upload/', '/upload/q_auto/f_auto/c_scale,w_800/');

    return { url: optimizedUrl, error: null };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return { url: null, error: error.message || "Failed to upload to Cloudinary" };
  }
};
