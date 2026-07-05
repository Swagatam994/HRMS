import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateToken } from '../utils/generateToken.js';

const authPayload = (user) => ({
  user: user.toSafeJSON(),
  token: generateToken(user._id)
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const user = await User.create({ name, email, password });
  res.status(201).json(authPayload(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  res.json(authPayload(user));
});
