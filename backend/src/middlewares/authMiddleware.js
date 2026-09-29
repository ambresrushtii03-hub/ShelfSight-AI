import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, 'Authentication required.'));
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role,
      email: payload.email,
      fullName: payload.fullName,
    };
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token.'));
  }
};
