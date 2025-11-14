// Lightweight Cloudinary helper - requires CLOUDINARY_URL env var
const cloudinary = require('cloudinary').v2;

if (process.env.CLOUDINARY_URL) cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });

async function uploadImageFromUrl(url, options = {}) {
    if (!process.env.CLOUDINARY_URL) throw new Error('CLOUDINARY_URL not configured');
    return await cloudinary.uploader.upload(url, options);
}

module.exports = { uploadImageFromUrl };
