import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiRateLimiter } from './middlewares/rateLimitMiddleware.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import shelfRoutes from './routes/shelfRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import findingRoutes from './routes/findingRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api', shelfRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/findings', findingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', analyticsRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use(errorMiddleware);

export default app;
