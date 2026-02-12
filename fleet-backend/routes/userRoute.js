import { Router } from 'express';
import { createUser, getAllUsers, getUserById, updateUser, deleteUser,login } from '../controllers/userController.js';
import { authMiddleware, requireRole } from '../middlewares/authMiddlewares.js';
const router = Router();

router.get('/user/', authMiddleware, requireRole('ADMIN'), getAllUsers);
router.get('/user/:id', authMiddleware, requireRole('ADMIN'), getUserById);
router.post('/user/signup', createUser);
router.put('/user/:id', authMiddleware, updateUser);
router.delete('/user/:id', authMiddleware, deleteUser);
router.post('/user/login', login);
export default router;