
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as userController from '../controllers/user.controller.js';
import * as authMiddleware from '../middlewares/auth.middlewares.js';
import * as csrfMiddleware from '../middlewares/csrf.middleware.js';
import { RATE_LIMIT } from '../config/security.js';

const router = Router();





router.post('/user/login', rateLimit(RATE_LIMIT.login), userController.login);
router.post('/user/signup', userController.createUser);

router.post('/user/refresh-token', userController.refreshToken);


router.post('/user/logout', authMiddleware.authenticate, csrfMiddleware.verifyCsrf, userController.logout);

router.get('/user/me', authMiddleware.authenticate, userController.getMe);



router.post(
  '/user/createdriver',
  authMiddleware.authenticate,
  csrfMiddleware.verifyCsrf,
  authMiddleware.authorizeRoles('ADMIN', 'MANAGER'),
  userController.createUser
);

router.get(
  '/user/getusers',
  authMiddleware.authenticate,
  csrfMiddleware.verifyCsrf,
  authMiddleware.authorizeRoles('ADMIN'),
  userController.getAllUsers
);
router.get(
  '/user/getuser/:id',
  authMiddleware.authenticate,
  csrfMiddleware.verifyCsrf,
  authMiddleware.authorizeRoles('ADMIN', 'MANAGER'),
  userController.getUserById
);
router.put(
  '/user/updateuser/:id',
  authMiddleware.authenticate,
  csrfMiddleware.verifyCsrf,
  userController.updateUser
);
router.delete(
  '/user/deleteuser/:id',
  authMiddleware.authenticate,
  csrfMiddleware.verifyCsrf,
  userController.deleteUser
);

export default router;

