import { z } from "zod";
import { sendValidationError } from "../utils/response.js";

const uuid = z.string().uuid();
const isoDate = z.string().datetime();

export const createMaintenanceSchema = z.object({
  vehicleId: uuid,
  scheduledDate: isoDate,
  technician: z.string().min(2).max(100),
  cost: z.number().min(0),
  mileage: z.number().int().min(0).optional(),
  type: z.string().max(100).optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  description: z.string().max(2000).optional().nullable(),
  attachments: z.array(z.string().url()).optional().default([]),
});

export const updateMaintenanceSchema = z
  .object({
    scheduledDate: isoDate.optional(),
    technician: z.string().min(2).max(100).optional(),
    cost: z.number().min(0).optional(),
    mileage: z.number().int().min(0).optional(),
    type: z.string().max(100).optional().nullable(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    description: z.string().max(2000).optional().nullable(),
    attachments: z.array(z.string().url()).optional(),
  })
  .strict();

export const statusUpdateSchema = z.object({
  status: z.enum(["in_progress", "completed", "cancelled"]),
});

const listMaintenanceSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  vehicleId: uuid.optional(),
  technician: z.string().optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  sortBy: z.enum(["scheduledDate", "createdAt", "updatedAt", "priority", "status"]).optional(),
  sortOrder: z.enum(["ASC", "DESC"]).optional(),
});

const upcomingSchema = z.object({
  days: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  vehicleId: uuid.optional(),
  limit: z.string().optional(),
});

const overdueSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  vehicleId: uuid.optional(),
});

export const validateCreateMaintenance = (req, res, next) => {
  const parsed = createMaintenanceSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(
      res,
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    );
  }

  req.body = parsed.data;

  if (new Date(req.body.scheduledDate) <= new Date()) {
    return sendValidationError(res, ["scheduledDate: scheduledDate must be a future date"]);
  }

  return next();
};

export const validateUpdateMaintenance = (req, res, next) => {
  const parsed = updateMaintenanceSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(
      res,
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    );
  }

  req.body = parsed.data;

  if (req.body.scheduledDate && new Date(req.body.scheduledDate) <= new Date()) {
    return sendValidationError(res, ["scheduledDate: scheduledDate must be a future date"]);
  }

  return next();
};

export const validateStatusUpdate = (req, res, next) => {
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(
      res,
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    );
  }

  req.body = parsed.data;
  return next();
};

export const validateListMaintenancesQuery = (req, res, next) => {
  const parsed = listMaintenanceSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendValidationError(
      res,
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    );
  }

  req.validatedQuery = parsed.data;
  return next();
};

export const validateUpcomingQuery = (req, res, next) => {
  const parsed = upcomingSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendValidationError(
      res,
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    );
  }

  req.validatedQuery = parsed.data;
  return next();
};

export const validateOverdueQuery = (req, res, next) => {
  const parsed = overdueSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendValidationError(
      res,
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    );
  }

  req.validatedQuery = parsed.data;
  return next();
};
