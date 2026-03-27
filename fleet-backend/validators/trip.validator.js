import { z } from "zod";
import { Op } from "sequelize";
import Trip from "../models/trip.model.js";
import Vehicle from "../models/vehicle.model.js";
import User from "../models/user.model.js";
import { sendValidationError } from "../utils/response.js";

const uuid = z.string().uuid();

const tripStatuses = ["scheduled", "ongoing", "completed", "cancelled"];




export const validateCreateTrip = (req, res, next) => {
  const schema = z
    .object({
      vehicleId: uuid,
      userId: uuid,
      region: z.string().min(2),
      startLocation: z.string().min(2),
      endLocation: z.string().min(2),
      startTime: z.string().datetime(),
      endTime: z.string().datetime().optional().nullable(),
      distance: z.number().positive(),
      fuel: z.string().optional().nullable(),
      cost: z.number().nonnegative().optional().nullable(),
      status: z.enum(tripStatuses).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);

        if (start >= end) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endTime"],
            message: "endTime must be after startTime",
          });
        }
      }
    });

  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(
      res,
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
    );
  }

  req.body = parsed.data;
  next();
};

export const validateUpdateTrip = (req, res, next) => {
  const schema = z
    .object({
      vehicleId: uuid.optional(),
      userId: uuid.optional(),
      region: z.string().min(2).optional(),
      startLocation: z.string().min(2).optional(),
      endLocation: z.string().min(2).optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional().nullable(),
      distance: z.number().positive().optional(),
      fuel: z.string().optional().nullable(),
      cost: z.number().nonnegative().optional().nullable(),
      status: z.enum(tripStatuses).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);

        if (start >= end) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endTime"],
            message: "endTime must be after startTime",
          });
        }
      }
    });

  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(
      res,
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
    );
  }

  req.body = parsed.data;
  next();
};

export const validateUpdateTripStatus = (req, res, next) => {
  const schema = z.object({
    status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]),
  });

  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(
      res,
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
    );
  }

  req.body = parsed.data;
  next();
};


export const validateVehicleExists = async (req, res, next) => {
  try {
    const vehicleId = req.body.vehicleId;

    if (!vehicleId) return next(); 

    const vehicle = await Vehicle.findByPk(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        code: 'NOT_FOUND',
      });
    }

    const BLOCKED_STATUSES = ['IN_MAINTENANCE', 'OUT_OF_SERVICE'];
    if (BLOCKED_STATUSES.includes(vehicle.status)) {
      return res.status(409).json({
        success: false,
        message: `Vehicle is not available: status is '${vehicle.status}'`,
        code: 'CONFLICT',
      });
    }

    req.vehicle = vehicle; 
    next();
  } catch (error) {
    next(error);
  }
};

export const validateDriverExists = async (req, res, next) => {
  try {
    const userId = req.body.userId;

    if (!userId) return next();

    const driver = await User.findByPk(userId);

    if (!driver) {
      return sendValidationError(res, "userId: Driver not found");
    }

    next();
  } catch (error) {
    next(error);
  }
};



export const validateTripTimeLogic = async (req, res, next) => {
  try {
    const { startTime, endTime } = req.body;

    if (!startTime) return next();

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;

    if (Number.isNaN(start.getTime())) {
      return sendValidationError(res, "startTime: Invalid date");
    }

    if (endTime && Number.isNaN(end.getTime())) {
      return sendValidationError(res, "endTime: Invalid date");
    }

    if (end && start >= end) {
      return sendValidationError(
        res,
        "endTime: endTime must be after startTime"
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateNoOverlappingVehicleTrip = async (req, res, next) => {
  try {
    const { vehicleId, startTime, endTime } = req.body;
    const tripId = req.params.id;

    if (!vehicleId || !startTime || !endTime) {
      return next();
    }

    const overlappingTrip = await Trip.findOne({
      where: {
        vehicleId,
        id: tripId ? { [Op.ne]: tripId } : { [Op.ne]: null },
        status: {
          [Op.notIn]: ["completed", "cancelled"],
        },
        [Op.and]: [
          {
            startTime: {
              [Op.lt]: new Date(endTime),
            },
          },
          {
            endTime: {
              [Op.gt]: new Date(startTime),
            },
          },
        ],
      },
    });

    if (overlappingTrip) {
      return sendValidationError(
        res,
        "vehicleId: Vehicle already has another trip in this time range"
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateNoOverlappingDriverTrip = async (req, res, next) => {
  try {
    const { userId, startTime, endTime } = req.body;
    const tripId = req.params.id;

    if (!userId || !startTime || !endTime) {
      return next();
    }

    const overlappingTrip = await Trip.findOne({
      where: {
        userId,
        id: tripId ? { [Op.ne]: tripId } : { [Op.ne]: null },
        status: {
          [Op.notIn]: ["completed", "cancelled"],
        },
        [Op.and]: [
          {
            startTime: {
              [Op.lt]: new Date(endTime),
            },
          },
          {
            endTime: {
              [Op.gt]: new Date(startTime),
            },
          },
        ],
      },
    });

    if (overlappingTrip) {
      return sendValidationError(
        res,
        "userId: Driver already has another trip in this time range"
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};



const allowedTransitions = {
  scheduled: ["ongoing", "cancelled"],
  ongoing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const validateTripStatusTransition = async (req, res, next) => {
  try {
    const { status: newStatus } = req.body;
    const tripId = req.params.id;

    if (!tripId || !newStatus) {
      return next();
    }

    const trip = await Trip.findByPk(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
        code: "TRIP_NOT_FOUND",
      });
    }

    const currentStatus = trip.status;

    if (currentStatus === newStatus) {
      return next();
    }

    const validNextStatuses = allowedTransitions[currentStatus] || [];

    if (!validNextStatuses.includes(newStatus)) {
      return sendValidationError(
        res,
        `status: Invalid transition from "${currentStatus}" to "${newStatus}"`
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};