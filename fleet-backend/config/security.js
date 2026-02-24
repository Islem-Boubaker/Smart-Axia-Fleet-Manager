
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// ── Cookie settings ──────────────────────────────────────────
export const COOKIE_OPTIONS = {
  /** Short-lived access token cookie */
  accessToken: {
    httpOnly: true,                       // JS can NEVER read it
    secure: isProduction,                 // HTTPS only in prod
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000,              // 15 minutes
  },

  /** Long-lived refresh token cookie */
  refreshToken: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/user/refresh-token',          // only sent to refresh endpoint
    maxAge: 7 * 24 * 60 * 60 * 1000,     // 7 days
  },

  /** CSRF token cookie — readable by JS (NOT httpOnly) */
  csrfToken: {
    httpOnly: false,                      // frontend must read this
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

// ── CORS settings ────────────────────────────────────────────
export const CORS_OPTIONS = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CLIENT_URL)
      .split(',')
      .map(o => o.trim());

    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,                      // required for cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',                       // our CSRF header
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
