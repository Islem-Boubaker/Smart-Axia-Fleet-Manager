import { z } from "zod";
import { sendValidationError } from "../utils/response.js";

const uuid = z.string().uuid();
const isoDate = z.string().datetime();
const coordNumber = z.number().finite().min(-180).max(180);

const stopSchema = z.object({
  locationName: z.string().min(1),
  stopOrder: z.number().int().positive(),
  latitude: coordNumber.min(-90).max(90).optional().nullable(),
  longitude: coordNumber.optional().nullable(),
  estimatedArrival: isoDate.optional().nullable(),
  notes: z.string().optional().nullable(),
});

const stopUpdateSchema = z.object({
  locationName: z.string().min(1).optional(),
  stopOrder: z.number().int().positive().optional(),
  latitude: coordNumber.min(-90).max(90).optional().nullable(),
  longitude: coordNumber.optional().nullable(),
  estimatedArrival: isoDate.optional().nullable(),
  notes: z.string().optional().nullable(),
});

const mapLegacyCostToRevenue = (payload = {}) => {
  if (!payload || typeof payload !== "object") return payload;

  if (
    payload.revenue === undefined &&
    Object.prototype.hasOwnProperty.call(payload, "cost")
  ) {
    payload.revenue = payload.cost;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "cost")) {
    delete payload.cost;
  }

  return payload;
};

const createTripSchema = z.object({
  vehicleId: uuid.optional(),
  userId: uuid.optional(),
  region: z.string().min(2).optional(),
  notes: z.string().optional().nullable(),
  startLocation: z.string().min(2),
  startLatitude: coordNumber.min(-90).max(90).optional().nullable(),
  startLongitude: coordNumber.optional().nullable(),
  endLocation: z.string().min(2),
  endLatitude: coordNumber.min(-90).max(90).optional().nullable(),
  endLongitude: coordNumber.optional().nullable(),
  startTime: isoDate,
  endTime: isoDate.optional().nullable(),
  plannedEndTime: isoDate.optional().nullable(),
  distance: z.number().positive(),
  requiredCapacity: z.number().int().nonnegative().optional(),
  loadType: z.enum(["general", "cold", "fragile", "heavy"]).optional(),
  fuel: z.number().nonnegative().optional().nullable(),
  revenue: z.number().nonnegative().optional().nullable(),
  stops: z.array(stopSchema).optional(),
});

const updateTripSchema = z
  .object({
    vehicleId: uuid.optional(),
    userId: uuid.optional().nullable(),
    region: z.string().min(2).optional(),
    notes: z.string().optional().nullable(),
    startLocation: z.string().min(2).optional(),
    startLatitude: coordNumber.min(-90).max(90).optional().nullable(),
    startLongitude: coordNumber.optional().nullable(),
    endLocation: z.string().min(2).optional(),
    endLatitude: coordNumber.min(-90).max(90).optional().nullable(),
    endLongitude: coordNumber.optional().nullable(),
    startTime: isoDate.optional(),
    endTime: isoDate.optional().nullable(),
    plannedEndTime: isoDate.optional().nullable(),
    distance: z.number().positive().optional(),
    requiredCapacity: z.number().int().nonnegative().optional(),
    loadType: z.enum(["general", "cold", "fragile", "heavy"]).optional(),
    fuel: z.number().nonnegative().optional().nullable(),
    revenue: z.number().nonnegative().optional().nullable(),
    stops: z.array(stopSchema).optional(),
  })
  .strict();

const updateStatusSchema = z.object({
  status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]),
});

const completeTripSchema = z
  .object({
    endTime: isoDate.optional(),
    revenue: z.number().nonnegative().optional(),
    fuel: z.number().nonnegative().optional().nullable(),
  })
  .strict();

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

const recommendationSchema = z
  .object({
    tripId: uuid.optional(),
    startTime: isoDate.optional(),
    endTime: isoDate.optional().nullable(),
    region: z.string().min(2).optional(),
    distance: z.number().positive().optional(),
    requiredCapacity: z.number().int().nonnegative().optional(),
    loadType: z.enum(["general", "cold", "fragile", "heavy"]).optional(),
    action: z.enum(["drivers", "vehicles", "assignment", "apply"]).optional(),
    topN: z.number().int().positive().max(20).optional(),
  })
  .refine(
    (data) =>
      Boolean(data.tripId) ||
      (Boolean(data.startTime) && data.distance !== undefined),
    {
      message: "Provide tripId or (startTime + distance + optional trip fields)",
      path: ["tripId"],
    }
  )
  .strict();

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
  req.body = mapLegacyCostToRevenue(req.body);
  return parseBody(createTripSchema, req, res, next);
};

export const validateUpdateTrip = (req, res, next) => {
  req.body = mapLegacyCostToRevenue(req.body);
  if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
    return sendValidationError(res, ["status: status cannot be updated from this endpoint"]);
  }
  return parseBody(updateTripSchema, req, res, next);
};

export const validateUpdateStatus = (req, res, next) => {
  return parseBody(updateStatusSchema, req, res, next);
};

export const validateCompleteTrip = (req, res, next) => {
  req.body = mapLegacyCostToRevenue(req.body);
  return parseBody(completeTripSchema, req, res, next);
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

export const validateRecommendations = (req, res, next) => {
  return parseBody(recommendationSchema, req, res, next);
};
