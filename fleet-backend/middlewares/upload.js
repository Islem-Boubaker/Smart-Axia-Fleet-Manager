import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const createUploader = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 800, crop: 'limit', quality: 'auto' }],
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        const err = Object.assign(new Error('Only jpg, jpeg, png and webp files are allowed'), {
          statusCode: 400,
        });
        return cb(err);
      }
      return cb(null, true);
    },
  });
};

// One uploader per resource type
export const uploadUserAvatar = createUploader('smartaxia/users');
export const uploadReclamationImages = createUploader('smartaxia/reclamations');
export const uploadVehiclePhotos = createUploader('smartaxia/vehicles');