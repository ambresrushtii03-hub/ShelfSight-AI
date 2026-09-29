import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { ensureUploadDirectory } from '../utils/fileUtils.js';

export const storageService = {
  getUploadDir() {
    const baseDir = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads');
    ensureUploadDirectory(baseDir);
    return baseDir;
  },
  saveUploadedFile(file) {
    if (!file) return null;
    return {
      filePath: file.path,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  },
};
