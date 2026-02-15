import * as userService from '../services/user.service.js';
import { StatusCodes } from 'http-status-codes';

export const createUser = async (req, res, next) => {
  try {
    const newUser = await userService.createUserSvc(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsersSvc();
    res.status(StatusCodes.OK).json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserByIdSvc(req.params.id);
    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUserSvc(req.params.id, req.body);
    if (!updatedUser) return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
    res.status(StatusCodes.OK).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const deleted = await userService.deleteUserSvc(req.params.id);
    if (!deleted) return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
    res.sendStatus(StatusCodes.NO_CONTENT);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const token = await userService.loginUserSvc(email, password);
    if (!token) return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
    res.cookie('refreshToken', token.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });
    res.json({
      success: true,
      data: {
        accessToken: token.accessToken,
        user: token.user
      }
    });
  } catch (error) {
    next(error);
  }
};


export const getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserByIdSvc(req.user.id);
    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
};