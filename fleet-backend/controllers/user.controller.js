import * as userService from '../services/user.service.js';
import { StatusCodes } from 'http-status-codes';
import { COOKIE_OPTIONS } from '../config/security.js';
import { generateCsrfToken } from '../utils/jwt.js';
import { uploadUserAvatar } from '../middlewares/upload.js';
import cacheMiddleware from '../middlewares/cache.middleware.js';

const invalidateUserCache = async (id) => {
  await cacheMiddleware.invalidatePattern('users:index:*');
  await cacheMiddleware.invalidatePattern('users:me:*');
  await cacheMiddleware.invalidatePattern('users:notificationSettings:*');
  if (id) {
    await cacheMiddleware.invalidatePattern(`users:show:id=${id}*`);
  }
};

export const createUser = [
  uploadUserAvatar.single('avatar'),
  async (req, res, next) => {
    try {
      const user = await userService.createUserSvc(req.body, req.file);
      await invalidateUserCache(user?.id);
      res.status(StatusCodes.CREATED).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },
];

export const updateUserAvatar = [
  uploadUserAvatar.single('avatar'),
  async (req, res, next) => {
    try {
      const user = await userService.updateUserPhotoSvc(req.params.id, req.file);
      await invalidateUserCache(req.params.id);
      res.status(StatusCodes.OK).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },
];

export const updateMyAvatar = [
  uploadUserAvatar.single('avatar'),
  async (req, res, next) => {
    try {
      const user = await userService.updateUserPhotoSvc(req.user.id, req.file);
      await invalidateUserCache(req.user.id);
      res.status(StatusCodes.OK).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },
];

export const getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsersSvc(req.query, req.cacheKey);
    const payload = { success: true, ...result };
    if (req.cacheSet) await req.cacheSet(payload);
    res.status(StatusCodes.OK).json(payload);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserByIdSvc(req.params.id, req.cacheKey);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
    }
    const payload = { success: true, data: user };
    if (req.cacheSet) await req.cacheSet(payload);
    res.status(StatusCodes.OK).json(payload);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUserSvc(req.params.id, req.body);
    if (!updatedUser) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
    }
    await invalidateUserCache(req.params.id);
    res.status(StatusCodes.OK).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    console.log('[updateMe] req.body:', req.body);
    const updatedUser = await userService.updateUserSvc(req.user.id, req.body);
    if (!updatedUser) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
    }
    await invalidateUserCache(req.user.id);
    res.status(StatusCodes.OK).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const deleted = await userService.deleteUserSvc(req.params.id);
    if (!deleted) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
    }
    await invalidateUserCache(req.params.id);
    res.sendStatus(StatusCodes.NO_CONTENT);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const { accessToken, refreshToken, user } = await userService.loginUserSvc(email, password);

    // If rememberMe is false, we omit the maxAge for the refresh token
    const refreshCookieOptions = rememberMe 
      ? COOKIE_OPTIONS.refreshToken 
      : { ...COOKIE_OPTIONS.refreshToken, maxAge: undefined };

    res.cookie('accessToken', accessToken, COOKIE_OPTIONS.accessToken);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    const csrfToken = generateCsrfToken();
    res.cookie('csrf-token', csrfToken, COOKIE_OPTIONS.csrfToken);

    // ✅ Return tokens in response body for mobile clients (in addition to cookies)
    res.status(StatusCodes.OK).json({
      success: true,
      data: { 
        user, 
        csrfToken,
        accessToken,    // ← Mobile app needs this!
        refreshToken,   // ← Useful for mobile refresh flow
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      });
    }

    await userService.forgotPasswordSvc(email);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'If that email exists, the new password has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    await userService.changePasswordSvc(req.user.id, currentPassword, newPassword);
    await invalidateUserCache(req.user.id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Refresh token missing',
      });
    }

    const { accessToken } = await userService.refreshTokenSvc(token);

    res.cookie('accessToken', accessToken, COOKIE_OPTIONS.accessToken);

    const csrfToken = generateCsrfToken();
    res.cookie('csrf-token', csrfToken, COOKIE_OPTIONS.csrfToken);

    res.status(StatusCodes.OK).json({ success: true, message: 'Token refreshed', csrfToken });
  } catch (error) {
    res.clearCookie('accessToken', { path: COOKIE_OPTIONS.accessToken.path });
    res.clearCookie('refreshToken', { path: COOKIE_OPTIONS.refreshToken.path });
    res.clearCookie('csrf-token', { path: COOKIE_OPTIONS.csrfToken.path });
    next(error);
  }
};

export const logout = async (_req, res) => {
  res.clearCookie('accessToken', { path: COOKIE_OPTIONS.accessToken.path });
  res.clearCookie('refreshToken', { path: COOKIE_OPTIONS.refreshToken.path });
  res.clearCookie('csrf-token', { path: COOKIE_OPTIONS.csrfToken.path });

  res.status(StatusCodes.OK).json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserByIdSvc(req.user.id, req.cacheKey);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
    }
    const payload = { success: true, data: user };
    if (req.cacheSet) await req.cacheSet(payload);
    res.status(StatusCodes.OK).json(payload);
  } catch (error) {
    next(error);
  }
};

export const getMyNotificationSettings = async (req, res, next) => {
  try {
    const settings = await userService.getMyNotificationSettingsSvc(req.user.id, req.cacheKey);
    if (!settings) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
    }

    const payload = { success: true, data: settings };
    if (req.cacheSet) await req.cacheSet(payload);
    res.status(StatusCodes.OK).json(payload);
  } catch (error) {
    next(error);
  }
};

export const updateMyNotificationSettings = async (req, res, next) => {
  try {
    const settings = await userService.updateMyNotificationSettingsSvc(req.user.id, req.body);
    if (!settings) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
    }

    await invalidateUserCache(req.user.id);

    res.status(StatusCodes.OK).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateMyPushToken = async (req, res, next) => {
  try {
    const payload = await userService.updateMyPushTokenSvc(req.user.id, req.body?.expoPushToken);
    if (!payload) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
    }

    await invalidateUserCache(req.user.id);

    res.status(StatusCodes.OK).json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
};

export const getDriverLeaderboard = async (req, res, next) => {
  try {
    const limit = Number(req.query?.limit || 10);
    const leaderboard = await userService.getDriverLeaderboardSvc(limit);
    res.status(StatusCodes.OK).json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};

export const getMyDriverRanking = async (req, res, next) => {
  try {
    const ranking = await userService.getMyDriverRankingSvc(req.user.id);
    if (!ranking) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Driver ranking not found' });
    }
    res.status(StatusCodes.OK).json({ success: true, data: ranking });
  } catch (error) {
    next(error);
  }
};

// // Backward-compatible aliases
// export const createUser = createUser;
// export const updateUserAvatar = updateUserAvatar;
// export const uploadUserPhoto = updateUserAvatar;
