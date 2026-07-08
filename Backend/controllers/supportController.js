import { createPolicy, deletePolicy, generateSupportReply, getSupportHistory as getStoredSupportHistory, listPolicies, saveSupportMessage, updatePolicy } from '../services/supportService.js';

export const chatWithSupport = async (req, res, next) => {
  try {
    const { message, employeeId: bodyEmployeeId } = req.body;
    const fallbackEmployeeId = req.user?.employeeId || req.user?.id || req.user?._id;
    const employeeId = bodyEmployeeId || fallbackEmployeeId;

    if (!message || !employeeId) {
      return res.status(400).json({ message: 'Message and employee context are required.' });
    }

    await saveSupportMessage({ employeeId, message, sender: 'employee' });
    const history = await getStoredSupportHistory({ employeeId });
    const reply = await generateSupportReply({ employeeId, message, history: history.messages || [] });
    await saveSupportMessage({ employeeId, message: reply.text, sender: 'ai' });

    res.json({ message: reply.text, intent: reply.intent, context: reply.context });
  } catch (error) {
    next(error);
  }
};

export const getSupportHistory = async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId || req.user?.employeeId;
    const history = await getStoredSupportHistory({ employeeId });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

export const listSupportPolicies = async (_req, res, next) => {
  try {
    const policies = await listPolicies();
    res.json(policies);
  } catch (error) {
    next(error);
  }
};

export const createSupportPolicy = async (req, res, next) => {
  try {
    const policy = await createPolicy({
      title: req.body.title,
      category: req.body.category,
      content: req.body.content,
      createdBy: req.user?._id
    });
    res.status(201).json(policy);
  } catch (error) {
    next(error);
  }
};

export const updateSupportPolicy = async (req, res, next) => {
  try {
    const policy = await updatePolicy({ id: req.params.id, updates: req.body });
    res.json(policy);
  } catch (error) {
    next(error);
  }
};

export const deleteSupportPolicy = async (req, res, next) => {
  try {
    const policy = await deletePolicy({ id: req.params.id });
    res.json({ message: 'Policy deleted', policy });
  } catch (error) {
    next(error);
  }
};

export default {
  chatWithSupport,
  getSupportHistory,
  listSupportPolicies,
  createSupportPolicy,
  updateSupportPolicy,
  deleteSupportPolicy
};
