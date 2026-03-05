import { z } from 'zod';

const uuid = z.string().uuid();

export const validateCreateTrip = (req, res, next) => {
  const schema = z.object({
    vehicleId: uuid,
    driverId: uuid,
    startLocation: z.string().min(2),
    endLocation: z.string().min(2),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      code: 'VALIDATION_ERROR',
    });
  }
  req.body = parsed.data;
  next();
};

export const validateUpdateTrip = (req, res, next) => {
  // partial update
  const schema = z.object({
    vehicleId: uuid.optional(),
    driverId: uuid.optional(),
    startLocation: z.string().min(2).optional(),
    endLocation: z.string().min(2).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    notes: z.string().max(500).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      code: 'VALIDATION_ERROR',
    });
  }
  req.body = parsed.data;
  next();
};

export const validateUpdateTripStatus = (req, res, next) => {
  const schema = z.object({
    status: z.enum(['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED']),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      code: 'VALIDATION_ERROR',
    });
  }
  req.body = parsed.data;
  next();
};