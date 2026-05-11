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

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.error) {
      console.error("Cloudinary API Error:", data.error.message);
      throw new Error(data.error.message);
    }

    // Use the SDK to generate an optimized URL from the public_id
    const myImage = cld.image(data.public_id);

    // Apply optimizations: auto quality, auto format, and scale to 800px width (default)
    myImage
      .delivery(quality(autoQuality()))
      .delivery(format(autoFormat()))
      .resize(scale().width(800));

    return { url: myImage.toURL(), error: null };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return { url: null, error: error.message || "Failed to upload to Cloudinary" };
  }
};
