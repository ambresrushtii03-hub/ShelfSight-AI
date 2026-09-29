export const errorMiddleware = (error, req, res, next) => {
  const databaseUnavailable = ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', '28P01', '3D000', '57P03'].includes(error.code);
  const statusCode = error.statusCode || (databaseUnavailable ? 503 : 500);
  const message = databaseUnavailable
    ? 'Database unavailable. Configure backend/.env and ensure PostgreSQL is running.'
    : statusCode === 500 ? 'Internal server error.' : error.message;

  console.error('[API ERROR]', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { details: error.details || error.stack }),
  });
};
