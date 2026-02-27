
import crypto from 'crypto';
import { StatusCodes } from 'http-status-codes';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getHeaderToken(req) {
  // Express lowercases header keys, but req.get is already case-insensitive.
  return (
    req.get('x-csrf-token') ||
    req.get('x-xsrf-token') ||
    req.get('csrf-token') ||
    null
  );
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * verifyCsrf
 *
 * Implements the “double-submit cookie” pattern.
 *
 * IMPORTANT: CSRF protection is only needed when authentication is done via
 * cookies (because browsers automatically attach cookies cross-site).
 * If the request is authenticated via `Authorization: Bearer ...`, CSRF is not
 * applicable and we skip it.
 */
export const verifyCsrf = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const hasCookieAuth = Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);
  const hasBearerAuth = Boolean(req.get('authorization'));

  // Bearer-token requests are not subject to CSRF (attackers can't set Authorization headers cross-site).
  if (!hasCookieAuth && hasBearerAuth) return next();

  const cookieToken = req.cookies?.['csrf-token'] || req.cookies?.['XSRF-TOKEN'];
  const headerToken = getHeaderToken(req);

  if (!cookieToken || !headerToken || !timingSafeEqual(cookieToken, headerToken)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: 'CSRF token validation failed',
    });
  }

  return next();
};
