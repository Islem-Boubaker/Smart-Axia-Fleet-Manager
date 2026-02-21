import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import * as authMiddleware from '../middlewares/auth.middlewares.js';
const router = Router();

router.get('/user/getusers', authMiddleware.authenticate, authMiddleware.authorizeRoles('ADMIN'), userController.getAllUsers);
router.get('/user/getuser/:id', authMiddleware.authenticate, authMiddleware.authorizeRoles('ADMIN', 'MANAGER'), userController.getUserById);
router.post('/user/signup', userController.createUser);
router.put('/user/updateuser/:id', authMiddleware.authenticate, userController.updateUser);
router.delete('/user/deleteuser/:id', authMiddleware.authenticate, userController.deleteUser);
router.post('/user/login', userController.login);


    
export default router;

