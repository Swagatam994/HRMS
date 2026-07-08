import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import {
  buildAttendanceInsightPrompt,
  buildHiringInsightPrompt,
  buildLeaveInsightPrompt,
  buildPayrollInsightPrompt,
  buildProductivityInsightPrompt,
  buildWorkforceReportPrompt,
  fallbackAttendanceInsight,
  fallbackHiringInsight,
  fallbackLeaveInsight,
  fallbackPayrollInsight,
  fallbackProductivityInsight,
  fallbackWorkforceReport
} from '../prompts/dashboardPrompt.js';

const ai = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;

const extractTextFromResponse = (response) => {
  if (typeof response?.text === 'string' && response.text.trim()) {
    return response.text.trim();
  }

  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const combined = parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('');
    if (combined.trim()) return combined.trim();
  }

  return '';
};

const generateText = async ({ prompt, systemInstruction }) => {
  if (!ai) {
    throw new Error('Gemini client is not configured.');
  }

  const response = await ai.models.generateContent({
    model: env.geminiModel,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.35
    }
  });

  const text = extractTextFromResponse(response);
  if (!text) {
    throw new Error('Empty response from Gemini.');
  }

  return text;
};

const withFallback = async ({ prompt, fallback, systemInstruction }) => {
  if (!env.geminiApiKey) {
    return fallback;
  }

  try {
    return await generateText({ prompt, systemInstruction });
  } catch (error) {
    console.warn('Gemini insight generation failed. Using fallback:', error.message);
    return fallback;
  }
};

export const generateHiringInsight = async (stats) =>
  withFallback({
    prompt: buildHiringInsightPrompt(stats),
    fallback: fallbackHiringInsight(stats),
    systemInstruction: 'You are an HR analytics assistant. Write concise, professional summaries. Never invent statistics.'
  });

export const generateProductivityInsight = async (stats) =>
  withFallback({
    prompt: buildProductivityInsightPrompt(stats),
    fallback: fallbackProductivityInsight(stats),
    systemInstruction: 'You are an HR analytics assistant. Write concise, professional summaries. Never invent statistics.'
  });

export const generatePayrollInsight = async (stats) =>
  withFallback({
    prompt: buildPayrollInsightPrompt(stats),
    fallback: fallbackPayrollInsight(stats),
    systemInstruction: 'You are an HR analytics assistant. Write concise, professional summaries. Never invent statistics.'
  });

export const generateLeaveInsight = async (stats) =>
  withFallback({
    prompt: buildLeaveInsightPrompt(stats),
    fallback: fallbackLeaveInsight(stats),
    systemInstruction: 'You are an HR analytics assistant. Write concise, professional summaries. Never invent statistics.'
  });

export const generateAttendanceInsight = async (stats) =>
  withFallback({
    prompt: buildAttendanceInsightPrompt(stats),
    fallback: fallbackAttendanceInsight(stats),
    systemInstruction: 'You are an HR analytics assistant. Write concise, professional summaries. Never invent statistics.'
  });

export const generateWorkforceReport = async (stats) =>
  withFallback({
    prompt: buildWorkforceReportPrompt(stats),
    fallback: fallbackWorkforceReport(stats),
    systemInstruction:
      'You are a senior HR analyst. Produce professional workforce intelligence reports using only provided data. Use markdown headings.'
  });
