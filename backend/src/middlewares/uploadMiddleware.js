import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${Math.random().toString(16).slice(2)}${path.extname(file.originalname)}`;
    cb(null, safeName);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const extensionAllowed = /\.(jpe?g|png|webp)$/i;

    if (allowed.includes(file.mimetype) && extensionAllowed.test(file.originalname)) {
      return cb(null, true);
    }

    return cb(new Error('Unsupported file type. Only JPEG, JPG, PNG, and WebP images are allowed.'));
  },
});
