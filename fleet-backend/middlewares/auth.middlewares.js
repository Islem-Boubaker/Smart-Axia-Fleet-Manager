

import dotenv from 'dotenv';
import { verifyAccessToken } from "../utils/jwt.js";
dotenv.config();

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: insufficient permissions",
      });
    }

    next();
  };
};

export const authenticate = (req, res, next) => {



  try {
    
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'No token provided'
      });
    }
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: error.message || 'Invalid token'
    });
  }
};
