import dotenv from 'dotenv';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const nodeEnv = process.env.NODE_ENV || 'development';
const databaseUrl = process.env.DATABASE_URL?.trim() || '';
const defaultEmbeddedDatabaseDir = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, 'ShelfSight AI', 'database')
  : path.join(os.homedir(), '.local', 'share', 'shelfsight-ai', 'database');
const useEmbeddedDatabase = nodeEnv !== 'production'
  && process.env.USE_EMBEDDED_DATABASE !== 'false'
  && (process.env.USE_EMBEDDED_DATABASE === 'true' || !databaseUrl);

export const env = {
  NODE_ENV: nodeEnv,
  PORT: Number(process.env.PORT || 5000),
  DATABASE_URL: databaseUrl || null,
  USE_EMBEDDED_DATABASE: useEmbeddedDatabase,
  EMBEDDED_DATABASE_PORT: Number(process.env.EMBEDDED_DATABASE_PORT || 55432),
  EMBEDDED_DATABASE_DIR: process.env.EMBEDDED_DATABASE_DIR || defaultEmbeddedDatabaseDir,
  JWT_SECRET: process.env.JWT_SECRET || 'development-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE_BYTES: Number(process.env.MAX_FILE_SIZE_BYTES || 10485760),
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  AUTH_RATE_LIMIT_MAX_REQUESTS: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 10),
  AI_RATE_LIMIT_MAX_REQUESTS: Number(process.env.AI_RATE_LIMIT_MAX_REQUESTS || 10),
};
