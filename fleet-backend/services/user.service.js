import User from '../models/user.model.js';
import Reclamation from '../models/reclamation.model.js';
import * as Token from '../utils/jwt.js';
import { getPagination, getPagingData } from '../utils/pagination.js';
import cloudinary from '../config/cloudinary.js';

const extractCloudinaryPublicIdFromUrl = (url) => {
  try {
    const cleanUrl = url.split('?')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    const lastTwoSegments = segments.slice(-2);
    if (lastTwoSegments.length < 2) return null;
    return lastTwoSegments.join('/').replace(/\.[^.]+$/, '');
  } catch {
    return null;
  }
};

export const updateUserPhotoSvc = async (id, file) => {
  if (!file) throw Object.assign(new Error('No file uploaded'), { statusCode: 400 });

  const user = await User.findByPk(id);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  // Delete old Cloudinary image if exists
  if (user.avatar) {
    try {
      const publicId = extractCloudinaryPublicIdFromUrl(user.avatar);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (e) {
      console.warn('[Cloudinary] Failed to delete old photo:', e.message);
    }
  }

  await user.update({ avatar: file.path }); // file.path = Cloudinary URL

  const { password, ...safeUser } = user.toJSON();
  return safeUser;
};
export const createUserSvc = async (userData, file = null) => {
  // If a file was uploaded, attach the Cloudinary URL
  if (file?.path) {
    userData.avatar = file.path;
  }

  const user = await User.create(userData);
  const { password, ...safeUser } = user.toJSON();
  return safeUser;
};

export const getAllUsersSvc = async (query = {}) => {
  const { page, limit, offset } = getPagination(query);
  const { count, rows } = await User.findAndCountAll({
    attributes: { exclude: ['password'] },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
  return getPagingData(count, rows, page, limit);
};

export const getUserByIdSvc = async (id) => {
  return await User.findByPk(id, { attributes: { exclude: ['password'] } });
};
export const updateUserSvc = async (id, updateData) => {
  const user = await User.findByPk(id);
  if (!user) return null;

  let normalizedUpdate = updateData;

  // Some clients/middleware can deliver JSON bodies as strings.
  if (typeof normalizedUpdate === 'string') {
    try {
      normalizedUpdate = JSON.parse(normalizedUpdate);
    } catch {
      normalizedUpdate = {};
    }
  }

  if (!normalizedUpdate || typeof normalizedUpdate !== 'object') {
    normalizedUpdate = {};
  }

  const sanitizedUpdate = { ...normalizedUpdate };

  if (!sanitizedUpdate.password || sanitizedUpdate.password.trim() === '') {
    delete sanitizedUpdate.password;
  }

  await user.update(sanitizedUpdate);

  const { password, ...safeUser } = user.toJSON();
  return safeUser;
};

export const deleteUserSvc = async (id) => {
  return await User.destroy({ where: { id } });
};




export const loginUserSvc = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const payload = {
    id: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone
  };

  // Générer les deux tokens
  const accessToken = Token.generateAccessToken(payload);
  const refreshToken = Token.generateRefreshToken(payload);

  const { password: _, ...userWithoutPassword } = user.toJSON();

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword
  };
};

export const refreshTokenSvc = async (refreshToken) => {
  try {
    const decoded = Token.verifyRefreshToken(refreshToken);

    // Vérifier si l'utilisateur existe toujours
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      const err = new Error('User not found or inactive');
      err.statusCode = 401;
      throw err;
    }

    const payload = {
      id: user.id,
      role: user.role,
      email: user.email
    };

    const newAccessToken = Token.generateAccessToken(payload);

    return { accessToken: newAccessToken };
  } catch (error) {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }
};




