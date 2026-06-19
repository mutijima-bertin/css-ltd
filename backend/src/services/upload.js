import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const galleryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'css-ltd/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi'],
    resource_type: 'auto',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

const demoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'css-ltd/demos',
    allowed_formats: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'mp4', 'mov', 'avi', 'mkv', 'jpg', 'jpeg', 'png', 'gif', 'pdf'],
    resource_type: 'auto',
  },
});

export const uploadGallery = multer({
  storage: galleryStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

export const uploadDemo = multer({
  storage: demoStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});
