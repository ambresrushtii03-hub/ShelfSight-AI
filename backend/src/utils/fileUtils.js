import fs from 'fs';
import path from 'path';

export function safeFilename(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function deleteFileIfExists(filePath) {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch {
    // no-op
  }
}

export function ensureUploadDirectory(uploadDir) {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}
