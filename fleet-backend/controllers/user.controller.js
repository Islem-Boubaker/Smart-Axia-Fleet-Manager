// ─────────────────────────────────────────────────────────────
//  User controller — CRUD + secure cookie-based auth
// ─────────────────────────────────────────────────────────────
import * as userService from '../services/user.service.js';
import { StatusCodes } from 'http-status-codes';
import { COOKIE_OPTIONS } from '../config/security.js';
import { generateCsrfToken } from '../utils/jwt.js';

// ── CRUD ─────────────────────────────────────────────────────

export const createUser = async (req, res, next) => {
  try {
    const newUser = await userService.createUserSvc(req.body);
    res.status(StatusCodes.CREATED).json({ success: true, data: newUser });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsersSvc();
    res.status(StatusCodes.OK).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserByIdSvc(req.params.id);
    if (!user)
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
    res.status(StatusCodes.OK).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUserSvc(req.params.id, req.body);
    if (!updatedUser)
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
    res.status(StatusCodes.OK).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const deleted = await userService.deleteUserSvc(req.params.id);
    if (!deleted)
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
    res.sendStatus(StatusCodes.NO_CONTENT);
  } catch (error) {
    next(error);
  }
};

// ── Authentication ───────────────────────────────────────────

/**
 * POST /user/login
 *
 * Sets three cookies:
 *   - accessToken  (httpOnly, 15 min)
 *   - refreshToken (httpOnly, 7 days, scoped to /user/refresh-token)
 *   - csrf-token   (readable by JS, mirrors SameSite policy)
 *
 * Returns user profile in the JSON body — the token itself is
 * NEVER exposed to JavaScript.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const { accessToken, refreshToken, user } = await userService.loginUserSvc(email, password);

    // 1. Set HTTP-only access token cookie
    res.cookie('accessToken', accessToken, COOKIE_OPTIONS.accessToken);

    // 2. Set HTTP-only refresh token cookie (scoped path)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS.refreshToken);

    // 3. Set CSRF cookie (readable by JS)
    const csrfToken = generateCsrfToken();
    res.cookie('csrf-token', csrfToken, COOKIE_OPTIONS.csrfToken);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /user/refresh-token
 *
 * Reads the refresh token from the httpOnly cookie, validates it,
 * and issues a fresh accessToken cookie.
 */
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

    // Rotate access cookie
    res.cookie('accessToken', accessToken, COOKIE_OPTIONS.accessToken);

    // Refresh the CSRF cookie as well
    const csrfToken = generateCsrfToken();
    res.cookie('csrf-token', csrfToken, COOKIE_OPTIONS.csrfToken);

    res.status(StatusCodes.OK).json({ success: true, message: 'Token refreshed' });
  } catch (error) {
    // Clear stale cookies on failure
    res.clearCookie('accessToken',  { path: COOKIE_OPTIONS.accessToken.path });
    res.clearCookie('refreshToken', { path: COOKIE_OPTIONS.refreshToken.path });
    res.clearCookie('csrf-token',   { path: COOKIE_OPTIONS.csrfToken.path });
    next(error);
  }
};

/**
 * POST /user/logout
 *
 * Clears all auth-related cookies.
 */
export const logout = async (_req, res) => {
  res.clearCookie('accessToken',  { path: COOKIE_OPTIONS.accessToken.path });
  res.clearCookie('refreshToken', { path: COOKIE_OPTIONS.refreshToken.path });
  res.clearCookie('csrf-token',   { path: COOKIE_OPTIONS.csrfToken.path });

  res.status(StatusCodes.OK).json({ success: true, message: 'Logged out successfully' });
};


export const getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserByIdSvc(req.user.id);
    if (!user)
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'User not found' });
    res.status(StatusCodes.OK).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
