import { StatusCodes } from 'http-status-codes';

export function successResponse(res, data = null, message = 'Success', statusCode = StatusCodes.OK) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(res, message = 'Error', statusCode = StatusCodes.BAD_REQUEST, details = undefined) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
  });
}
