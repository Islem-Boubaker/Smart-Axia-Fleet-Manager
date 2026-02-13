import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import * as authMiddleware from '../middlewares/auth.middlewares.js';
const router = Router();

router.get('/user/', authMiddleware.authenticate, authMiddleware.authorizeRoles('ADMIN'), userController.getAllUsers);
router.get('/user/:id', authMiddleware.authenticate, authMiddleware.authorizeRoles('ADMIN', 'DRIVER'), userController.getUserById);
router.post('/user/signup', userController.createUser);
router.put('/user/:id', authMiddleware.authenticate, userController.updateUser);
router.delete('/user/:id', authMiddleware.authenticate, userController.deleteUser);
router.post('/user/login', userController.login);
export default router;