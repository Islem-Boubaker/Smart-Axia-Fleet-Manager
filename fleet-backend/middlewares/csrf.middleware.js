
import { StatusCodes } from 'http-status-codes';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const verifyCsrf = (req, res, next) => {
  // Safe (read-only) methods are exempt
  if (SAFE_METHODS.has(req.method)) return next();
    
  const cookieToken = req.cookies?.['csrf-token'];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: 'CSRF token validation failed',
    });
  }

  next();
};
