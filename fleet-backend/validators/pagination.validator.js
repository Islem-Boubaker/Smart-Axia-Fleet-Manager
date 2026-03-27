import { z } from "zod";
import { sendValidationError } from "../utils/response.js";

const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 1), {
      message: "page must be a positive integer",
    }),
  limit: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 100),
      { message: "limit must be between 1 and 100" }
    ),
});


export const validatePagination = (req, res, next) => {
  const parsed = paginationSchema.safeParse(req.query);

  if (!parsed.success) {
    return sendValidationError(
      res,
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
    );
  }

  next();
};
