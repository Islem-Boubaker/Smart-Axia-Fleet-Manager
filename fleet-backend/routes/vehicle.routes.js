import express from 'express';
import * as vehicleController from '../controllers/vehicle.controller.js';
import * as authMiddleware from '../middlewares/auth.middlewares.js';

const router = express.Router();
router.use(authMiddleware.authenticate);

router.post('/vehicle/addvehicle', authMiddleware.authorizeRoles('ADMIN', 'MANAGER'), vehicleController.createVehicle);


// Allow authenticated drivers to read vehicle records (list & detail).
// `router.use(authMiddleware.authenticate)` at the top already enforces authentication,
// so we only require role checks on admin-only mutating routes below.
router.get('/vehicle/getvehicles', vehicleController.getAllVehicles);

router.get('/vehicle/getvehicle/:id', vehicleController.getVehicleById);


router.put('/vehicle/updatevehicle/:id', authMiddleware.authenticate, authMiddleware.authorizeRoles('ADMIN', 'MANAGER'), vehicleController.updateVehicle);

router.delete('/vehicle/deletevehicle/:id',authMiddleware.authorizeRoles('ADMIN', 'MANAGER'),authMiddleware.authenticate, authMiddleware.authorizeRoles('ADMIN', 'MANAGER'), vehicleController.deleteVehicle);
router.patch('/vehicle/:id/assign-driver',authMiddleware.authorizeRoles('ADMIN', 'MANAGER'),vehicleController.assignDriver);
router.patch('/vehicle/:id/unassign-driver', authMiddleware.authorizeRoles('ADMIN', 'MANAGER'), vehicleController.unassignDriver);
router.post('/vehicle/check-idle',authMiddleware.authorizeRoles('ADMIN', 'MANAGER'), vehicleController.checkIdleVehicles);
export default router;
