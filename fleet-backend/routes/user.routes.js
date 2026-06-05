
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as userController from '../controllers/user.controller.js';
import * as authMiddleware from '../middlewares/auth.middlewares.js';
import * as csrfMiddleware from '../middlewares/csrf.middleware.js';
import { RATE_LIMIT } from '../config/security.js';
import cacheMiddleware from '../middlewares/cache.middleware.js';

const router = Router();
router.post('/user/login', rateLimit(RATE_LIMIT.login), userController.login);
router.post('/user/forgot-password', rateLimit(RATE_LIMIT.login), userController.forgotPassword);

router.post('/user/refresh-token', userController.refreshToken);

router.post('/user/logout', authMiddleware.authenticate, csrfMiddleware.verifyCsrf, userController.logout);
router.post(
  '/user/change-password',
  authMiddleware.authenticate,
  csrfMiddleware.verifyCsrf,
  userController.changePassword
);

router.get('/user/me', authMiddleware.authenticate, cacheMiddleware('users', 'me', { requireAuth: true }), userController.getMe);
router.get('/user/me/ranking', authMiddleware.authenticate, userController.getMyDriverRanking);
router.put('/user/me', authMiddleware.authenticate, csrfMiddleware.verifyCsrf, userController.updateMe);
router.get('/user/me/notifications', authMiddleware.authenticate, cacheMiddleware('users', 'notificationSettings', { requireAuth: true }), userController.getMyNotificationSettings);
router.put(
  '/user/me/notifications',
  authMiddleware.authenticate,
  csrfMiddleware.verifyCsrf,
  userController.updateMyNotificationSettings
);
router.put(
  '/user/me/push-token',
  authMiddleware.authenticate,
  userController.updateMyPushToken
);

router.patch(
  '/user/me/avatar',
  authMiddleware.authenticate,
  csrfMiddleware.verifyCsrf,
  ...userController.updateMyAvatar
);

router.patch (
  '/user/:id/avatar',
  authMiddleware.authenticate,
  csrfMiddleware.verifyCsrf,
  ...userController.updateUserAvatar
);

router.post(
  '/user/createdriver',
  authMiddleware.authenticate,
  csrfMiddleware.verifyCsrf,
  authMiddleware.authorizeRoles('ADMIN', 'MANAGER'),
  ...userController.createUser
);

router.get(
  '/user/driver-leaderboard',
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles('ADMIN', 'MANAGER', 'DRIVER'),
  userController.getDriverLeaderboard
);
router.get(
  '/user/getusers',
  authMiddleware.authenticate,
  csrfMiddleware.verifyCsrf,
  authMiddleware.authorizeRoles('ADMIN'),
  cacheMiddleware('users', 'index', { requireAuth: true }),
  userController.getAllUsers
);
router.get(
  '/user/getuser/:id',
  authMiddleware.authenticate,
  csrfMiddleware.verifyCsrf,
  authMiddleware.authorizeRoles('ADMIN', 'MANAGER'),
  cacheMiddleware('users', 'show', { requireAuth: true }),
  userController.getUserById
);
router.put(
  '/user/updateuser/:id',
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles('ADMIN', 'MANAGER',"Driver"),
  csrfMiddleware.verifyCsrf,
  userController.updateUser
);
router.delete(
  '/user/deleteuser/:id',
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles('ADMIN'),
  csrfMiddleware.verifyCsrf,
  userController.deleteUser
);

router.put(
  '/user/:id/photo',
  authMiddleware.authenticate,
  csrfMiddleware.verifyCsrf,
  ...userController.updateUserAvatar
);


export default router;

