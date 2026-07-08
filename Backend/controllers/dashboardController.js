import {
  getAttendanceAnalytics,
  getDashboardOverview,
  getHiringAnalytics,
  getLeaveAnalytics,
  getPayrollAnalytics,
  getProductivityAnalytics,
  getWorkforceStats
} from '../services/analyticsService.js';
import {
  generateAttendanceInsight,
  generateHiringInsight,
  generateLeaveInsight,
  generatePayrollInsight,
  generateProductivityInsight,
  generateWorkforceReport
} from '../services/aiInsightService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getOverview = asyncHandler(async (_req, res) => {
  const overview = await getDashboardOverview();
  res.json(overview);
});

export const getHiring = asyncHandler(async (_req, res) => {
  const analytics = await getHiringAnalytics();
  const aiSummary = await generateHiringInsight(analytics);
  res.json({ ...analytics, aiSummary });
});

export const getProductivity = asyncHandler(async (_req, res) => {
  const analytics = await getProductivityAnalytics();
  const aiSummary = await generateProductivityInsight(analytics);
  res.json({ ...analytics, aiSummary });
});

export const getPayroll = asyncHandler(async (_req, res) => {
  const analytics = await getPayrollAnalytics();
  const aiSummary = await generatePayrollInsight(analytics);
  res.json({ ...analytics, aiSummary });
});

export const getAttendance = asyncHandler(async (_req, res) => {
  const analytics = await getAttendanceAnalytics();
  const aiSummary = await generateAttendanceInsight(analytics);
  res.json({ ...analytics, aiSummary });
});

export const getLeaves = asyncHandler(async (_req, res) => {
  const analytics = await getLeaveAnalytics();
  const aiSummary = await generateLeaveInsight(analytics);
  res.json({ ...analytics, aiSummary });
});

export const getWorkforceReport = asyncHandler(async (_req, res) => {
  const stats = await getWorkforceStats();
  const report = await generateWorkforceReport(stats);
  res.json({
    report,
    stats: {
      hiring: stats.hiring.metrics,
      productivity: stats.productivity.metrics,
      payroll: stats.payroll.metrics,
      leaves: stats.leaves.metrics,
      attendance: stats.attendance.metrics
    },
    generatedAt: new Date().toISOString()
  });
});
