
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const getSecret = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, getSecret('JWT_SECRET'), {
    expiresIn: process.env.JWT_EXPIRES_IN || '30m',
    algorithm: 'HS256',
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, getSecret('JWT_REFRESH_SECRET'), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256',
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, getSecret('JWT_SECRET'), { algorithms: ['HS256'] });
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, getSecret('JWT_REFRESH_SECRET'), { algorithms: ['HS256'] });
};

export const decodeToken = (token) => {
  return jwt.decode(token, { complete: true });
};



export const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};



export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};
