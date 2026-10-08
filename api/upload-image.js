// api/upload-image.js — Vercel Serverless Function & Vite dev proxy
// Uploads images to Cloudinary server-side to bypass browser ad-blockers,
// strict privacy extensions (Brave Shields, uBlock Origin), and client network restrictions.

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
  maxDuration: 60,
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { file, folder = 'products', tags = [], public_id, upload_preset } = request.body || {};

  if (!file) {
    return response.status(400).json({ error: 'No image data provided' });
  }

  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'dpv40ou2c';
  const uploadPreset = upload_preset || process.env.VITE_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET || 'g65f7lye';

  if (!cloudName || !uploadPreset) {
    return response.status(500).json({ error: 'Cloudinary configuration missing on server.' });
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    if (folder) formData.append('folder', folder);
    if (tags && tags.length > 0) {
      formData.append('tags', Array.isArray(tags) ? tags.join(',') : tags);
    }
    if (public_id && typeof public_id === 'string' && public_id.trim().length > 0) {
      formData.append('public_id', public_id.trim());
    }

    const cldResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    let data = {};
    const text = await cldResponse.text();
    try {
      data = JSON.parse(text);
    } catch {
      return response.status(502).json({
        error: `Cloudinary returned an unparseable response: ${text.slice(0, 100)}`,
      });
    }

    if (!cldResponse.ok || data.error) {
      return response.status(cldResponse.status || 400).json({
        error: data.error?.message || `Cloudinary upload failed with status ${cldResponse.status}`,
      });
    }

    return response.status(200).json(data);
  } catch (error) {
    console.error('Server-side Cloudinary upload error:', error);
    return response.status(500).json({
      error: error.message || 'Server-side upload to Cloudinary failed.',
    });
  }
}

