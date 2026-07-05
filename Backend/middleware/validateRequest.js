import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

export const validateRequest = (req, _res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const details = result.array().map((error) => ({
    field: error.path,
    message: error.msg
  }));

  return next(new AppError('Validation failed.', 422, details));
};
