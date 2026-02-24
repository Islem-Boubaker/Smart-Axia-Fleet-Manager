// ─────────────────────────────────────────────────────────────
//  Authentication & authorisation middleware
//
//  Token resolution order:
//    1. `accessToken` HTTP-only cookie  (preferred — secure)
//    2. `Authorization: Bearer <token>` header (mobile / Postman fallback)
// ─────────────────────────────────────────────────────────────
import { StatusCodes } from 'http-status-codes';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.js';

/**
 * authenticate — verifies the access token and attaches `req.user`.
 */
export const authenticate = (req, res, next) => {
  try {
    // 1. Prefer the HTTP-only cookie
    let token = req.cookies?.accessToken;

    // 2. Fallback to Authorization header (e.g. for mobile apps)
    if (!token) {
      token = extractTokenFromHeader(req.headers.authorization);
    }

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required — no token provided',
      });
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded; // { id, role, email, iat, exp }
    next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'Access token expired'
        : 'Invalid access token';
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message,
    });
  }
};

/**
 * authorizeRoles — restricts access to the given role(s).
 * Must be used AFTER `authenticate`.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Access denied: insufficient permissions',
      });
    }
    next();
  };
};
