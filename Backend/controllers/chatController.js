import AIConversation from '../models/AIConversation.js';
import { askOnboardingQuestion } from '../services/aiChatService.js';

export const postChat = async (req, res, next) => {
  try {
    const { employeeId, message } = req.body;
    let conv = await AIConversation.findOne({ employee: employeeId });
    if (!conv) conv = await AIConversation.create({ employee: employeeId, messages: [] });

    conv.messages.push({ sender: 'employee', text: message });
    await conv.save();

    const aiResp = await askOnboardingQuestion({ employee: employeeId, messages: conv.messages });

    conv.messages.push({ sender: 'ai', text: aiResp.text });
    await conv.save();

    res.json({ ai: aiResp.text });
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const conv = await AIConversation.findOne({ employee: employeeId });
    res.json(conv || { messages: [] });
  } catch (error) {
    next(error);
  }
};

export default { postChat, getChatHistory };
