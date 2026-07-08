import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

const ai = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;

const systemInstruction = `You are an AI onboarding assistant. Answer only onboarding-related questions about joining process, policies, IT setup, tools, benefits, reporting manager, and first-day instructions. If the user asks about unrelated topics, politely decline.`;
const onboardingKeywords = ['join', 'joining', 'onboarding', 'policy', 'leave', 'schedule', 'team', 'manager', 'benefit', 'tool', 'it', 'device', 'day one', 'first day', 'document', 'welcome'];

const isOnboardingQuestion = (text = '') => {
  const normalized = text.toLowerCase();
  return onboardingKeywords.some((keyword) => normalized.includes(keyword));
};

export const askOnboardingQuestion = async ({ employee, messages }) => {
  const latest = messages?.[messages.length - 1]?.text || '';
  if (!isOnboardingQuestion(latest)) {
    return { text: 'I can help with onboarding topics such as the joining process, policies, team info, tools, benefits, and first-day instructions.' };
  }

  if (!ai) {
    return {
      text: 'I can help with your onboarding questions. For now, the AI integration is not configured, so I am sharing a concise guidance response: please contact HR for detailed policy questions.'
    };
  }

  const contents = [];
  contents.push({ role: 'system', content: systemInstruction });
  for (const m of messages) {
    contents.push({ role: m.sender === 'employee' ? 'user' : 'assistant', content: m.text });
  }

  const response = await ai.models.generateContent({
    model: env.geminiModel,
    contents,
    config: { temperature: 0.2 }
  });

  const text = response?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || response?.text || '';
  return { text };
};

export default { askOnboardingQuestion };
