import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import { Candidate } from '../models/Candidate.js';
import OnboardingSession from '../models/OnboardingSession.js';
import { createTasksForRole } from '../services/taskService.js';

const generateEmployeeId = () => `EMP${Date.now().toString().slice(-6)}`;

export const createEmployeeFromUser = async ({ user, role, department, joiningDate, reportingManager, candidateId }) => {
  const payload = {
    name: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'New Employee',
    email: user?.email || user?.contactEmail || '',
    role: role || 'Employee',
    department: department || '',
    employeeId: generateEmployeeId(),
    joiningDate: joiningDate ? new Date(joiningDate) : null,
    reportingManager: reportingManager || null,
    fromCandidate: candidateId || null
  };

  const existingEmployee = payload.email ? await Employee.findOne({ email: payload.email }) : null;
  if (existingEmployee) {
    const existingSession = await OnboardingSession.findOne({ employee: existingEmployee._id }).sort({ createdAt: -1 });
    return { employee: existingEmployee, session: existingSession };
  }

  const employee = await Employee.create(payload);
  const session = await OnboardingSession.create({ employee: employee._id, status: 'in_progress', startedAt: new Date() });
  await createTasksForRole({ role: employee.role, employeeId: employee._id, sessionId: session._id });
  return { employee, session };
};

export const createEmployeeFromCandidate = async (req, res, next) => {
  try {
    const { candidateId, joiningDate, reportingManager } = req.body;
    const candidate = await Candidate.findById(candidateId).populate('user');
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    const result = await createEmployeeFromUser({
      user: candidate.user,
      role: candidate.currentRole || candidate.appliedRole || 'Employee',
      department: candidate.department || '',
      joiningDate,
      reportingManager,
      candidateId: candidate._id
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getEmployee = async (req, res, next) => {
  try {
    const rawId = req.params?.id;
    const candidateId = typeof rawId === 'string' ? rawId.trim() : '';

    if (!candidateId || ['undefined', 'null'].includes(candidateId.toLowerCase())) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const query = mongoose.Types.ObjectId.isValid(candidateId)
      ? { $or: [{ _id: candidateId }, { employeeId: candidateId }, { email: candidateId }] }
      : { $or: [{ employeeId: candidateId }, { email: candidateId }] };

    const employee = await Employee.findOne(query);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    next(error);
  }
};

export default { createEmployeeFromCandidate, getEmployee, createEmployeeFromUser };
