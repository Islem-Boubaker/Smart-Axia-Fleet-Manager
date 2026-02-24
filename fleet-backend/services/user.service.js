import User from '../models/user.model.js';
import Reclamation from '../models/reclamation.model.js';
import * as Token from '../utils/jwt.js';



export const createUserSvc = async (userData) => {
  const user = await User.create(userData);
  const { password, ...safeUser } = user.toJSON();
  return safeUser;
};

export const getAllUsersSvc = async () => {
  return await User.findAll({ attributes: { exclude: ['password'] } });
};

export const getUserByIdSvc = async (id) => {
  return await User.findByPk(id);
};
export const updateUserSvc = async (id, updateData) => {
  const user = await User.findByPk(id);
  if (!user) return null;

  if (!updateData.password || updateData.password.trim() === '') {
    delete updateData.password;
  }

  await User.update(updateData, { where: { id }, individualHooks: true });

  const updated = await User.findByPk(id);
  return updated;
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

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    }
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




