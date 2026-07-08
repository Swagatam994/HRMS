import OnboardingSession from '../models/OnboardingSession.js';
import OnboardingTask from '../models/OnboardingTask.js';
import Employee from '../models/Employee.js';
import { createTasksForRole } from '../services/taskService.js';

export const startOnboarding = async (req, res, next) => {
  try {
    const { employeeId, tasks } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const existing = await OnboardingSession.findOne({ employee: employee._id }).sort({ createdAt: -1 });
    if (existing && existing.status !== 'completed') {
      return res.status(200).json(existing);
    }

    const session = await OnboardingSession.create({ employee: employee._id, status: 'in_progress', startedAt: new Date() });
    const createdTasks = await createTasksForRole({ role: employee.role, employeeId: employee._id, sessionId: session._id, tasks });

    res.status(201).json({ session, tasks: createdTasks });
  } catch (error) {
    next(error);
  }
};

export const getTasksForEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const tasks = await OnboardingTask.find({ assignedTo: employeeId }).sort({ mandatory: -1, createdAt: 1 });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    const task = await OnboardingTask.findByIdAndUpdate(taskId, updates, { new: true });
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { employeeId, title, description, mandatory } = req.body;
    const task = await OnboardingTask.create({
      title,
      description: description || '',
      mandatory: !!mandatory,
      assignedTo: employeeId,
      role: req.body.role || 'General'
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    await OnboardingTask.findByIdAndDelete(taskId);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

export default { startOnboarding, getTasksForEmployee, updateTask, createTask, deleteTask };
