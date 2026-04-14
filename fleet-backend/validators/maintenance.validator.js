import { z } from "zod";
import { sendValidationError } from "../utils/response.js";

const uuid = z.string().uuid();
const isoDate = z.string().datetime();

const isBeforeToday = (value) => {
  const date = new Date(value);
  const today = new Date();

  if (Number.isNaN(date.getTime())) return false;

  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return date < today;
};

export const createMaintenanceSchema = z.object({
  vehicleId: uuid.optional(),
  vehiclePlate: z.string().min(2).max(50).optional(),
  scheduledDate: isoDate,
  technician: z.string().min(2).max(100),
  cost: z.number().min(0),
  mileage: z.number().int().min(0).optional(),
  type: z.string().max(100).optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  description: z.string().max(2000).optional().nullable(),
  attachments: z.array(z.string().url()).optional().default([]),
}).refine((data) => Boolean(data.vehicleId || data.vehiclePlate), {
  message: "vehicleId or vehiclePlate is required",
  path: ["vehicleId"],
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
  status: z.enum(["pending", "in_progress", "in progress", "completed", "cancelled"]),
});

const listMaintenanceSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(["scheduled", "pending", "in_progress", "in progress", "completed", "cancelled"]).optional(),
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

  if (isBeforeToday(req.body.scheduledDate)) {
    return sendValidationError(res, ["scheduledDate: scheduledDate cannot be in the past"]);
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

  if (req.body.scheduledDate && isBeforeToday(req.body.scheduledDate)) {
    return sendValidationError(res, ["scheduledDate: scheduledDate cannot be in the past"]);
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

  req.body = {
    ...parsed.data,
    status: parsed.data.status === "in_progress" ? "in progress" : parsed.data.status,
  };
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

  req.validatedQuery = {
    ...parsed.data,
    status: parsed.data.status === "in_progress" ? "in progress" : parsed.data.status,
  };
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
