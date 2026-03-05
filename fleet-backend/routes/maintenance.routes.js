import express from 'express';

import * as maintenanceController from '../controllers/maintenance.controller.js';

import { validateCreateMaintenance } from '../validators/maintenance.validator.js';
import * as authMiddlewares from '../middlewares/auth.middlewares.js';
import * as csrfMiddleware from '../middlewares/csrf.middleware.js';


const router = express.Router();
//  Appliquer la sécurité à TOUTES les routes de ce router:

router.use(authMiddlewares.authenticate);
router.use(authMiddlewares.authorizeRoles('ADMIN', 'MANAGER'));
router.use(csrfMiddleware.verifyCsrf);

router.post(
  '/maintenances',
  validateCreateMaintenance,
  maintenanceController.createMaintenance
);


router.get(
  '/maintenances',
  maintenanceController.getAllMaintenances
);


router.get(
  '/maintenances/:id',
  maintenanceController.getMaintenanceById
);

// PUT=Remplace toute l'objet si field not updated will be null
router.put(
  '/maintenances/:id',
  validateCreateMaintenance,
  maintenanceController.updateMaintenance
);


router.delete(
  '/maintenances/:id',
  maintenanceController.deleteMaintenance
);


// PATCH=Update status only
router.patch(
  '/maintenances/:id/status',
  maintenanceController.updateMaintenanceStatus
);


export default router;




