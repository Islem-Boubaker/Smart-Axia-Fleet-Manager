import { z } from "zod";

const validPriority = ["low", "medium", "high"];
const validStatus = ["scheduled", "in_progress", "completed", "cancelled"];

const createMaintenanceSchema = z.object({
  vehiclePlate: z.string().min(1, "vehiclePlate required"),
  scheduledDate: z
    .string()
    .min(1, "scheduledDate required")
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "scheduledDate must be a valid date",
    }),
  technician: z.string().min(1, "technician required"),


  cost: z.coerce
    .number({ invalid_type_error: "valid cost required" })
    .min(0, "valid cost required"),

  priority: z.enum(validPriority).optional(),
  status: z.enum(validStatus).optional(),
});

export const validateCreateMaintenance = (req, res, next) => {
  const parsed = createMaintenanceSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation error",
      errors: parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
      code: "VALIDATION_ERROR",
    });
  }
  req.body = parsed.data;
  next();
};