import express from 'express';
import * as vehicleController from '../controllers/vehicle.controller.js';
import * as authMiddleware from '../middlewares/auth.middlewares.js';

const router = express.Router();

router.post('/vehicle/addvehicle', authMiddleware.authenticate, authMiddleware.authorizeRoles('ADMIN', 'MANAGER'), vehicleController.createVehicle);


router.get('/vehicle/getvehicles', authMiddleware.authenticate, authMiddleware.authorizeRoles('ADMIN', 'MANAGER'), vehicleController.getAllVehicles);

router.get('/vehicle/getvehicle/:id', authMiddleware.authenticate, authMiddleware.authorizeRoles('ADMIN', 'MANAGER'), vehicleController.getVehicleById);


router.put('/vehicle/updatevehicle/:id', authMiddleware.authenticate, authMiddleware.authorizeRoles('ADMIN', 'MANAGER'), vehicleController.updateVehicle);

router.delete('/vehicle/deletevehicle/:id',authMiddleware.authenticate, authMiddleware.authorizeRoles('ADMIN', 'MANAGER'), vehicleController.deleteVehicle);

export default router;
