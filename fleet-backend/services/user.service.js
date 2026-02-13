import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from "../utils/jwt.js";




export const createUserSvc = async (userData) => {
  const salt = await bcrypt.genSalt(10);
  userData.password = await bcrypt.hash(userData.password, salt);
  return await User.create(userData);
};

export const getAllUsersSvc = async () => {
  return await User.findAll();
};

export const getUserByIdSvc = async (id) => {
  return await User.findByPk(id);
};

export const updateUserSvc = async (id, updateData) => {
  if (updateData.password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(updateData.password, salt);
  }
  const [updated] = await User.update(updateData, { where: { id } });
  if (!updated) return null;
  return await User.findByPk(id);
};

export const deleteUserSvc = async (id) => {
  return await User.destroy({ where: { id } });
};


export const loginUserSvc = async (email, password) => {
    console.log('Login attempt for email:', email);
  const user = await User.findOne({ where: { email } });
  if (!user) return null;

  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  const token = generateAccessToken(
    { 
      id: user.id, 
      role: user.role 
    }
  );      
   
  return { token, user: { id: user.id, name: user.name, role: user.role } };
};