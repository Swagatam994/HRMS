import { AppError } from '../utils/AppError.js';

export const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: error.isOperational ? error.message : 'Something went wrong.',
    details: error.details || undefined
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = error.stack;
    payload.message = error.message;
  }

  res.status(statusCode).json(payload);
};
