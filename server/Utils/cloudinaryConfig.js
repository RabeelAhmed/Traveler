const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config();

// Centralized Cloudinary configuration
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file buffer to Cloudinary using upload_stream.
 * Automatically handles optimization for images.
 */
const uploadToCloudinary = (fileBuffer, folder, mimeType) => {
  return new Promise((resolve, reject) => {
    const isVideo = mimeType.startsWith('video');
    const uploadOptions = {
      folder: folder,
      resource_type: isVideo ? 'video' : 'image',
    };
    
    if (!isVideo) {
      uploadOptions.transformation = [
        { quality: 'auto', fetch_format: 'auto' }
      ];
    }
    
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type === 'video' ? 'video' : 'image'
        });
      }
    );
    stream.end(fileBuffer);
  });
};

/**
 * Validates file extension, mime type, and file size.
 * Throws an error if invalid, otherwise returns resource type ('image' | 'video').
 */
const validateFile = (file) => {
  if (!file || !file.originalname) {
    throw new Error('Invalid file provided.');
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype || '';
  const size = file.size || 0;

  const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp'];
  const allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedVideoExts = ['.mp4', '.mov', '.webm'];
  const allowedVideoMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

  const isImage = allowedImageExts.includes(ext) || allowedImageMimeTypes.includes(mime);
  const isVideo = allowedVideoExts.includes(ext) || allowedVideoMimeTypes.includes(mime);

  if (!isImage && !isVideo) {
    throw new Error(`Unsupported file type: ${file.originalname}. Supported formats: Images (jpg, jpeg, png, webp), Videos (mp4, mov, webm)`);
  }

  if (isImage) {
    if (size > 10 * 1024 * 1024) {
      throw new Error(`Image ${file.originalname} exceeds the 10 MB limit.`);
    }
    return 'image';
  } else {
    if (size > 100 * 1024 * 1024) {
      throw new Error(`Video ${file.originalname} exceeds the 100 MB limit.`);
    }
    return 'video';
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  validateFile
};