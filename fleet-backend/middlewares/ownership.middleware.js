
export const checkOwnership = (
  Model,
  {
    paramId = 'id',
    ownerField = 'userId',
    bypassRoles = ['ADMIN', 'MANAGER'],
    attachResourceAs = 'resource', // puts loaded row into req.resource
    notFoundMessage = 'Resource not found',
  } = {}
) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      // 2) bypass for privileged roles
      if (bypassRoles.includes(role)) {
        // Optionally attach resource for downstream controller
        const id = req.params[paramId];
        if (id) {
          const resource = await Model.findByPk(id);
          if (!resource) {
            return res.status(404).json({
              success: false,
              message: notFoundMessage,
              code: 'NOT_FOUND',
            });
          }
          req[attachResourceAs] = resource;
        }
        return next();
      }

      // 3) check resource existence
      const id = req.params[paramId];
      if (!id) {
        return res.status(400).json({
          success: false,
          message: `Missing param :${paramId}`,
          code: 'BAD_REQUEST',
        });
      }

      const resource = await Model.findByPk(id);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: notFoundMessage,
          code: 'NOT_FOUND',
        });
      }

      // 4) check ownership
      const ownerValue = resource[ownerField];

      // In case owner is stored as number/string/uuid, normalize as string
      const isOwner = ownerValue != null && String(ownerValue) === String(userId);

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden',
          code: 'FORBIDDEN',
        });
      }

      // Attach resource for controller to reuse (avoid re-query)
      req[attachResourceAs] = resource;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

/**
 * Variant: check ownership based on a relation or multiple possible owner fields.
 * Example: a resource can belong to userId OR createdBy
 */
export const checkOwnershipAnyField = (
  Model,
  {
    paramId = 'id',
    ownerFields = ['userId', 'createdBy'],
    bypassRoles = ['ADMIN', 'MANAGER'],
    attachResourceAs = 'resource',
    notFoundMessage = 'Resource not found',
  } = {}
) => {
  return async (req, res, next) => {
    try {
     

      const userId = req.user.id;
      const role = req.user.role;

      const id = req.params[paramId];
      if (!id) {
        return res.status(400).json({ success: false, message: `Missing param :${paramId}`, code: 'BAD_REQUEST' });
      }

      const resource = await Model.findByPk(id);
      if (!resource) {
        return res.status(404).json({ success: false, message: notFoundMessage, code: 'NOT_FOUND' });
      }

      if (bypassRoles.includes(role)) {
        req[attachResourceAs] = resource;
        return next();
      }

      const ok = ownerFields.some((f) => resource[f] != null && String(resource[f]) === String(userId));

      if (!ok) {
        return res.status(403).json({ success: false, message: 'Forbidden', code: 'FORBIDDEN' });
      }

      req[attachResourceAs] = resource;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};