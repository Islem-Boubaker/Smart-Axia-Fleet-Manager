import User from '../models/user.model.js';
import Reclamation from '../models/reclamation.model.js';
import * as Token from '../utils/jwt.js';
import { getPagination, getPagingData } from '../utils/pagination.js';
import cloudinary from '../config/cloudinary.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { getDriverLeaderboard, getDriverRankingProfile } from './driverScore.service.js';
import {
  buildEmailAttachments,
  buildEmailLogoHtml,
  escapeHtml,
} from '../utils/emailTemplate.js';

const NOTIFICATION_KEYS = [
  'emailTrips',
  'emailMaintenance',
  'emailDrivers',
  'emailAI',
  'emailSystem',
  'pushTrips',
  'pushMaintenance',
  'pushDrivers',
  'pushAI',
  'pushSystem',
  'pushAlerts',
  'smsAlerts',
];

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

const extractUploadedFileUrl = (file) => {
  if (!file || typeof file !== 'object') return null;

  return (
    file.path ||
    file.secure_url ||
    file.url ||
    (file.filename && typeof file.filename === 'string' && file.filename.startsWith('http')
      ? file.filename
      : null)
  );
};

const isLocalAvatarUri = (value) => {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith('file://') || normalized.startsWith('content://');
};

const buildPasswordResetEmailHtml = ({ name, temporaryPassword }) => {
  const safeName = escapeHtml(name || 'there');
  const safePassword = escapeHtml(temporaryPassword);

  return `
    <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:24px 28px;background:#0f172a;color:#ffffff;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="76" valign="middle">${buildEmailLogoHtml()}</td>
                      <td valign="middle">
                        <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#93c5fd;">AXIA Fleet Manager</p>
                        <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;font-weight:700;">Password reset request</h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hello ${safeName},</p>
                  <p style="margin:0 0 18px;font-size:15px;line-height:1.7;">
                    We received a request to reset the password for your AXIA Fleet Manager account.
                    Use the temporary password below to sign in.
                  </p>
                  <div style="margin:18px 0;padding:16px 18px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;">
                    <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Temporary password</p>
                    <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.08em;color:#0f172a;">${safePassword}</p>
                  </div>
                  <p style="margin:0;font-size:15px;line-height:1.7;">
                    For your security, please sign in and change this temporary password from your account settings as soon as possible.
                  </p>
                  <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                      If you did not request this reset, please contact your fleet administrator immediately.
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
};

export const updateUserPhotoSvc = async (id, file) => {
  if (!file) throw Object.assign(new Error('No file uploaded'), { statusCode: 400 });

  const avatarUrl = extractUploadedFileUrl(file);
  if (!avatarUrl) {
    throw Object.assign(new Error('Uploaded avatar URL is missing'), { statusCode: 500 });
  }

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

  await user.update({ avatar: avatarUrl });

  const { password, ...safeUser } = user.toJSON();
  return safeUser;
};
export const createUserSvc = async (userData, file = null) => {
  // If a file was uploaded, attach the Cloudinary URL
  const avatarUrl = extractUploadedFileUrl(file);
  if (avatarUrl) {
    userData.avatar = avatarUrl;
  }

  const user = await User.create(userData);
  const { password, ...safeUser } = user.toJSON();
  return safeUser;
};

export const getAllUsersSvc = async (query = {}, cacheKey = null) => {
  const { page, limit, offset } = getPagination(query);
  const { count, rows } = await User.findAndCountAll({
    attributes: { exclude: ['password'] },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
  return getPagingData(count, rows, page, limit);
};

export const getUserByIdSvc = async (id, cacheKey = null) => {
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

  if (isLocalAvatarUri(sanitizedUpdate.avatar)) {
    delete sanitizedUpdate.avatar;
  }

  await user.update(sanitizedUpdate);

  const { password, ...safeUser } = user.toJSON();
  return safeUser;
};

export const deleteUserSvc = async (id) => {
  return await User.destroy({ where: { id } });
};

export const getMyNotificationSettingsSvc = async (userId, cacheKey = null) => {
  const user = await User.findByPk(userId, { attributes: NOTIFICATION_KEYS });
  if (!user) return null;
  return user.toJSON();
};

export const updateMyNotificationSettingsSvc = async (userId, payload = {}) => {
  const user = await User.findByPk(userId);
  if (!user) return null;

  const sanitized = {};
  for (const key of NOTIFICATION_KEYS) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      sanitized[key] = Boolean(payload[key]);
    }
  }

  if (Object.keys(sanitized).length === 0) {
    return await getMyNotificationSettingsSvc(userId);
  }

  await user.update(sanitized);
  return await getMyNotificationSettingsSvc(userId);
};

export const updateMyPushTokenSvc = async (userId, pushToken) => {
  const user = await User.findByPk(userId);
  if (!user) return null;

  const normalized = typeof pushToken === 'string' ? pushToken.trim() : '';
  await user.update({ expoPushToken: normalized || null });

  return {
    expoPushToken: user.expoPushToken,
  };
};

export const forgotPasswordSvc = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Return quietly so we don't expose if email exists or not
    return;
  }

  // Generate a random plain text password
  const randomPlainPassword = crypto.randomBytes(6).toString('hex'); // 12 character hex string

  // We set it like this, the Sequelize `beforeUpdate` hook (in user.model.js) will hash it for us!
  await user.update({ password: randomPlainPassword });

  // Send email to the user
  const transporter = nodemailer.createTransport({
    service: 'gmail', // you can change this
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"AXIA Fleet Manager" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'AXIA Fleet Manager password reset',
    text: [
      `Hello ${user.name || 'there'},`,
      '',
      'We received a request to reset the password for your AXIA Fleet Manager account.',
      `Temporary password: ${randomPlainPassword}`,
      '',
      'For your security, please sign in and change this temporary password from your account settings as soon as possible.',
      '',
      'If you did not request this reset, please contact your fleet administrator immediately.',
      '',
      'AXIA Fleet Manager',
    ].join('\n'),
    html: buildPasswordResetEmailHtml({
      name: user.name,
      temporaryPassword: randomPlainPassword,
    }),
    attachments: buildEmailAttachments(),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send mail in forgotPasswordSvc', error);
  }
};

export const changePasswordSvc = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 400;
    throw err;
  }

  if (newPassword.length < 8) {
    const err = new Error('New password must be at least 8 characters long');
    err.statusCode = 400;
    throw err;
  }

  await user.update({ password: newPassword });
};




export const loginUserSvc = async (email, password) => {

  const user = await User.scope('withPassword').findOne({
    where: { email },
    attributes: [
      'id',
      'email',
      'password',
      'role',
      'phone',
      'avatar',
      'isActive',
      'name',
      'company',
      'country',
      'city',
      'postalCode',
      'taxId',
    ],
  });


  if (!user) {
    throwAuthError();
  }

  // ⚡ Optional: block inactive users
  if (!user.isActive) {
    const err = new Error('Account disabled');
    err.statusCode = 403;
    throw err;
  }

  // ⚡ 2. Fast password compare

  const isMatch = await user.comparePassword(password);


  if (!isMatch) {
    throwAuthError();
  }

  // ⚡ 3. Minimal payload (VERY IMPORTANT)
  const payload = {
    id: user.id,
    role: user.role,
  };


  const accessToken = Token.generateAccessToken(payload);
  const refreshToken = Token.generateRefreshToken(payload);


  // ⚡ 5. Safe user object (no password)
  const safeUser = user.toSafeJSON();


  return {
    accessToken,
    refreshToken,
    user: safeUser,
  };
};



function throwAuthError() {
  const err = new Error('Invalid email or password');
  err.statusCode = 401;
  throw err;
}

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

export const getDriverLeaderboardSvc = async (limit = 10) => {
  return getDriverLeaderboard(limit);
};

export const getMyDriverRankingSvc = async (userId) => {
  return getDriverRankingProfile(userId);
};




