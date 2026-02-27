
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const COOKIE_OPTIONS = {
  accessToken: {
    httpOnly: true,
    secure: isProduction,                
    sameSite: isProduction ? 'none' : 'lax',  
    path: '/',
    maxAge: 15 * 60 * 1000,
  },

  refreshToken: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',  
    path: '/user/refresh-token',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },

  csrfToken: {
    httpOnly: false,                          // JS must read this cookie
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',  // cross-origin in prod
    path: '/',
    maxAge: 15 * 60 * 1000,                  // match access token lifetime
  },
};
// ── CORS settings ────────────────────────────────────────────
export const CORS_OPTIONS = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const raw = process.env.CLIENT_URL || '';
    const allowedOrigins = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/\/+$/, ''));

    const normalizedOrigin = String(origin).replace(/\/+$/, '');

    if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,                      // required for cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',                       // our CSRF header
    'X-XSRF-Token',                       // axios / common convention
    'CSRF-Token',                         // some clients use this
    'X-Requested-With',
  ],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 600,                            // preflight cache 10 min
};

// ── Rate-limiter presets ─────────────────────────────────────
export const RATE_LIMIT = {
  login: {
    windowMs: 15 * 60 * 1000,            // 15-minute window
    max: 10,                              // 10 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.',
    },
  },
  api: {
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests. Please slow down.',
    },
  },
};


export const HELMET_OPTIONS = {
  contentSecurityPolicy: isProduction ? undefined : false,   // disable CSP in dev
  crossOriginEmbedderPolicy: false,                          // allow cross-origin loads
  hsts: isProduction
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
};
