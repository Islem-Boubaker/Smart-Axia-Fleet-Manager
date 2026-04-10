import { z } from "zod";
import { sendValidationError } from "../utils/response.js";

const uuid = z.string().uuid();
const isoDate = z.string().datetime();

const stopSchema = z.object({
  locationName: z.string().min(1),
  stopOrder: z.number().int().positive(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  estimatedArrival: isoDate.optional().nullable(),
  notes: z.string().optional().nullable(),
});

const stopUpdateSchema = z.object({
  locationName: z.string().min(1).optional(),
  stopOrder: z.number().int().positive().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  estimatedArrival: isoDate.optional().nullable(),
  notes: z.string().optional().nullable(),
});

const createTripSchema = z.object({
  vehicleId: uuid,
  userId: uuid,
  region: z.string().min(2),
  startLocation: z.string().min(2),
  endLocation: z.string().min(2),
  startTime: isoDate,
  endTime: isoDate.optional().nullable(),
  distance: z.number().positive(),
  fuel: z.string().optional().nullable(),
  cost: z.number().nonnegative().optional().nullable(),
  stops: z.array(stopSchema).optional(),
});

const updateTripSchema = z
  .object({
    vehicleId: uuid.optional(),
    userId: uuid.optional().nullable(),
    region: z.string().min(2).optional(),
    startLocation: z.string().min(2).optional(),
    endLocation: z.string().min(2).optional(),
    startTime: isoDate.optional(),
    endTime: isoDate.optional().nullable(),
    distance: z.number().positive().optional(),
    fuel: z.string().optional().nullable(),
    cost: z.number().nonnegative().optional().nullable(),
    stops: z.array(stopSchema).optional(),
  })
  .strict();

const updateStatusSchema = z.object({
  status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]),
});

const addStopsSchema = z.union([
  stopSchema,
  z.object({
    stops: z.array(stopSchema).min(1),
  }),
]);

const reachStopSchema = z.object({
  arrivalTime: isoDate.optional(),
});

const skipStopSchema = z.object({
  notes: z.string().optional(),
});

const reorderStopsSchema = z.object({
  order: z.array(
    z.object({
      stopId: uuid,
      stopOrder: z.number().int().positive(),
    })
  ).min(1),
});

const parseBody = (schema, req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(
      res,
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    );
  }
  req.body = parsed.data;
  return next();
};

export const validateCreateTrip = (req, res, next) => {
  return parseBody(createTripSchema, req, res, next);
};

export const validateUpdateTrip = (req, res, next) => {
  if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
    return sendValidationError(res, ["status: status cannot be updated from this endpoint"]);
  }
  return parseBody(updateTripSchema, req, res, next);
};

export const validateUpdateStatus = (req, res, next) => {
  return parseBody(updateStatusSchema, req, res, next);
};

export const validateAddStops = (req, res, next) => {
  return parseBody(addStopsSchema, req, res, next);
};

export const validateUpdateStop = (req, res, next) => {
  return parseBody(stopUpdateSchema, req, res, next);
};

export const validateReachStop = (req, res, next) => {
  return parseBody(reachStopSchema, req, res, next);
};

export const validateSkipStop = (req, res, next) => {
  return parseBody(skipStopSchema, req, res, next);
};

export const validateReorderStops = (req, res, next) => {
  return parseBody(reorderStopsSchema, req, res, next);
};
