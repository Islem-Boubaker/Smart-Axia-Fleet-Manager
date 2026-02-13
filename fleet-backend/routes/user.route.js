import { Router } from 'express';
import { createUser, getAllUsers, getUserById, updateUser, deleteUser,login } from '../controllers/user.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middlewares.js';
const router = Router();

router.get('/user/', authenticate, authorizeRoles('ADMIN'), getAllUsers);
router.get('/user/:id', authenticate, authorizeRoles('ADMIN'), getUserById);
router.post('/user/signup', createUser);
router.put('/user/:id', authenticate, updateUser);
router.delete('/user/:id', authenticate, deleteUser);
router.post('/user/login', login);
export default router;