import OnboardingTask from '../models/OnboardingTask.js';
import OnboardingSession from '../models/OnboardingSession.js';

const roleTasks = {
  'Frontend Developer': [
    { title: 'Install VS Code', mandatory: true },
    { title: 'Install Node.js', mandatory: true },
    { title: 'Clone Company Repository', mandatory: true },
    { title: 'Read Coding Guidelines', mandatory: true },
    { title: 'Complete Git Training', mandatory: false }
  ],
  'Backend Developer': [
    { title: 'Install Docker', mandatory: true },
    { title: 'Install MongoDB', mandatory: true },
    { title: 'Configure Development Environment', mandatory: true },
    { title: 'Read API Documentation', mandatory: true },
    { title: 'Complete Backend Training', mandatory: false }
  ],
  'HR Manager': [
    { title: 'Review HR Policies', mandatory: true },
    { title: 'Complete Compliance Training', mandatory: true },
    { title: 'Set Up HR Tools', mandatory: false }
  ]
};

export const getDefaultTasksForRole = (role = '') => {
  const normalized = String(role || '').trim();
  return (roleTasks[normalized] || []).map((task) => ({ ...task }));
};

export const createTasksForRole = async ({ role, employeeId, sessionId, tasks = [] }) => {
  const template = tasks.length ? tasks : getDefaultTasksForRole(role);
  const created = [];

  for (const task of template) {
    const taskDoc = await OnboardingTask.create({
      title: task.title,
      description: task.description || '',
      role,
      mandatory: !!task.mandatory,
      assignedTo: employeeId,
      session: sessionId
    });
    created.push(taskDoc);
  }

  if (sessionId) {
    await OnboardingSession.findByIdAndUpdate(sessionId, { $push: { tasks: { $each: created.map((item) => item._id) } } });
  }

  return created;
};

export default { createTasksForRole, getDefaultTasksForRole };
