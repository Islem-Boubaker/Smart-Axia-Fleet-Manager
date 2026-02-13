import * as userService from '../services/user.service.js';
import { StatusCodes } from 'http-status-codes';
export const createUser = async (req, res) => {
  try {
    const newUser = await userService.createUserSvc(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsersSvc();
    res.status(StatusCodes.OK).json(users);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserByIdSvc(req.params.id);
    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const updatedUser = await userService.updateUserSvc(req.params.id, req.body);
    if (!updatedUser) return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
    res.status(StatusCodes.OK).json(updatedUser);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deleted = await userService.deleteUserSvc(req.params.id);
    if (!deleted) return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
    res.sendStatus(StatusCodes.NO_CONTENT);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await userService.loginUserSvc(email, password);
    if (!token) return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
    res.status(StatusCodes.OK).json({ token });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  } 
};


export const getMe = async (req, res) => {
  try {
    const user = await userService.getUserByIdSvc(req.user.id);
    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
    
    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};  