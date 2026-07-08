import Employee from '../models/Employee.js';
import OnboardingSession from '../models/OnboardingSession.js';
import OnboardingTask from '../models/OnboardingTask.js';
import LeaveRequest from '../models/LeaveRequest.js';
import PayrollRecord from '../models/PayrollRecord.js';
import HRPolicy from '../models/HRPolicy.js';
import ChatHistory from '../models/ChatHistory.js';
import { generateSupportResponse } from './geminiService.js';

export const classifySupportIntent = (message = '') => {
  const text = message.toLowerCase();
  if (/leave|days left|leave request|leave history|leave balance|apply for leave/.test(text)) return 'leave';
  if (/salary|payroll|payslip|bonus|deduction|net salary/.test(text)) return 'payroll';
  if (/onboarding|pending task|first day|document|team|manager|it setup/.test(text)) return 'onboarding';
  if (/policy|attendance|working hours|holiday|code of conduct|remote work/.test(text)) return 'policy';
  return 'general';
};

export const buildSupportContext = ({ employee, message, history = [] }) => {
  const summary = [
    employee?.name ? `Employee: ${employee.name}` : 'Employee: Unavailable',
    employee?.role ? `Role: ${employee.role}` : '',
    employee?.department ? `Department: ${employee.department}` : '',
    message ? `Latest question: ${message}` : ''
  ].filter(Boolean).join(' | ');

  return {
    employee: employee || {},
    message: message || '',
    history: history.slice(-6),
    summary,
    leaveSummary: 'No leave data available yet.',
    payrollSummary: 'No payroll data available yet.',
    onboardingSummary: 'No onboarding session found.'
  };
};

export const gatherSupportContext = async ({ employeeId, message }) => {
  const employee = await Employee.findById(employeeId).lean();
  const context = buildSupportContext({ employee, message });

  if (!employee) {
    return context;
  }

  const [leaveRequests, payrollRecords, onboardingSession, policies] = await Promise.all([
    LeaveRequest.find({ employee: employee._id }).sort({ createdAt: -1 }).limit(5).lean(),
    PayrollRecord.find({ employee: employee._id }).sort({ createdAt: -1 }).limit(5).lean(),
    OnboardingSession.findOne({ employee: employee._id }).populate('tasks').lean(),
    HRPolicy.find({ active: true }).sort({ createdAt: -1 }).limit(10).lean()
  ]);

  const pendingTasks = onboardingSession?.tasks?.filter((task) => task?.status !== 'completed') || [];
  const latestLeave = leaveRequests[0];
  const latestPayroll = payrollRecords[0];

  context.leaveSummary = latestLeave
    ? `Latest leave request: ${latestLeave.leaveType} (${latestLeave.status}) from ${new Date(latestLeave.startDate).toLocaleDateString()} to ${new Date(latestLeave.endDate).toLocaleDateString()}.`
    : 'No leave data available yet.';
  context.payrollSummary = latestPayroll
    ? `Latest payroll: ${latestPayroll.month} with net salary ${latestPayroll.netSalary} and status ${latestPayroll.status}.`
    : 'No payroll data available yet.';
  context.onboardingSummary = onboardingSession
    ? `Onboarding status: ${onboardingSession.status}; pending tasks: ${pendingTasks.length}.`
    : 'No onboarding session found.';
  context.policies = policies;
  context.leaveRequests = leaveRequests;
  context.payrollRecords = payrollRecords;
  context.onboardingSession = onboardingSession;
  context.pendingTasks = pendingTasks;
  return context;
};

export const getSupportHistory = async ({ employeeId }) => {
  const history = await ChatHistory.findOne({ employee: employeeId }).sort({ createdAt: -1 }).lean();
  return history || { messages: [] };
};

export const saveSupportMessage = async ({ employeeId, message, sender = 'employee' }) => {
  const history = await ChatHistory.findOne({ employee: employeeId });
  if (!history) {
    return ChatHistory.create({ employee: employeeId, messages: [{ sender, text: message }] });
  }

  history.messages.push({ sender, text: message });
  return history.save();
};

export const generateSupportReply = async ({ employeeId, message, history = [] }) => {
  const context = await gatherSupportContext({ employeeId, message });
  const intent = classifySupportIntent(message);
  const response = await generateSupportResponse(employeeId, message);

  return {
    text: response.text,
    intent: response.intent || intent,
    context: response.context || context
  };
};

export const createPolicy = async ({ title, category, content, createdBy }) => HRPolicy.create({ title, category, content, createdBy });
export const listPolicies = async () => HRPolicy.find({ active: true }).sort({ createdAt: -1 }).lean();
export const updatePolicy = async ({ id, updates }) => HRPolicy.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
export const deletePolicy = async ({ id }) => HRPolicy.findByIdAndDelete(id);
