import express from 'express';

import * as maintenanceController from '../controllers/maintenance.controller.js';

import { validateCreateMaintenance } from '../validators/maintenance.validator.js';


const router = express.Router();


router.post(
    '/maintenance/',
    validateCreateMaintenance,
    maintenanceController.createMaintenance
);


router.get(
    '/maintenance/',
    maintenanceController.getAllMaintenances
);


router.get(
    '/maintenance/:id',
    maintenanceController.getMaintenanceById
);


router.put(
    '/maintenance/:id',
    validateCreateMaintenance,
    maintenanceController.updateMaintenance
);


router.delete(
    '/maintenance/:id',
    maintenanceController.deleteMaintenance
);


router.patch(
    '/maintenance/:id/status',
    maintenanceController.updateMaintenanceStatus
);


export default router;