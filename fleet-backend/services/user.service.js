import User from '../models/user.model.js';
import Reclamation from '../models/reclamation.model.js';
import * as Token from '../utils/jwt.js';



export const createUserSvc = async (userData) => {

  return await User.create(userData);
};

export const getAllUsersSvc = async () => {
  return await User.findAll();
};

export const getUserByIdSvc = async (id) => {
  return await User.findByPk(id);
};

export const updateUserSvc = async (id, updateData) => {

  const [updated] = await User.update(updateData, { where: { id } });
  if (!updated) return null;
  return await User.findByPk(id);
};

export const deleteUserSvc = async (id) => {
  return await User.destroy({ where: { id } });
};




export const loginUserSvc = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error('Invalid email or password');
  }




  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const payload = {
    id: user.id,
    role: user.role,
    email: user.email
  };

  // Générer les deux tokens
  const accessToken = Token.generateAccessToken(payload);
  const refreshToken = Token.generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

export const refreshTokenSvc = async (refreshToken) => {
  try {
    const decoded = Token.verifyRefreshToken(refreshToken);

    // Vérifier si l'utilisateur existe toujours
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    const payload = {
      id: user.id,
      role: user.role,
      email: user.email
    };

    const newAccessToken = Token.generateAccessToken(payload);

    return { accessToken: newAccessToken };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};




