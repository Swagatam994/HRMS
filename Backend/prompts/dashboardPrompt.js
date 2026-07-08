const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

export const buildHiringInsightPrompt = (stats) =>
  `You are an HR analytics assistant. Based on the following hiring statistics (already calculated), write a concise 2-3 sentence professional summary for HR managers. Do not invent numbers. Focus on performance trends and actionable observations.

Hiring Statistics:
${JSON.stringify(stats, null, 2)}`;

export const buildProductivityInsightPrompt = (stats) =>
  `You are an HR analytics assistant. Based on the following employee productivity metrics (already calculated), write a concise 2-3 sentence summary highlighting workforce availability and attendance health. Do not invent numbers.

Productivity Metrics:
${JSON.stringify(stats, null, 2)}`;

export const buildPayrollInsightPrompt = (stats) =>
  `You are an HR analytics assistant. Based on the following payroll statistics (already calculated), write a concise 2-3 sentence summary describing the monthly payroll picture. Use plain language. Do not invent numbers.

Payroll Statistics:
${JSON.stringify(stats, null, 2)}`;

export const buildLeaveInsightPrompt = (stats) =>
  `You are an HR analytics assistant. Based on the following leave analytics (already calculated), write a concise 2-3 sentence summary of leave trends and approval patterns. Do not invent numbers.

Leave Analytics:
${JSON.stringify(stats, null, 2)}`;

export const buildAttendanceInsightPrompt = (stats) =>
  `You are an HR analytics assistant. Based on the following attendance statistics (already calculated), write a concise 2-3 sentence summary of attendance patterns and any notable trends. Do not invent numbers.

Attendance Statistics:
${JSON.stringify(stats, null, 2)}`;

export const buildWorkforceReportPrompt = (stats) =>
  `You are a senior HR analyst preparing a Workforce Intelligence Report for HR managers. Using ONLY the data provided below (already calculated from the HRMS), write a professional, readable report with these sections:

1. Recruitment Overview
2. Employee Overview
3. Attendance Summary
4. Leave Summary
5. Payroll Summary
6. Overall Workforce Insights

Use clear headings, short paragraphs, and bullet points where helpful. Be factual — do not invent metrics. If a section has zero or minimal data, note it professionally and suggest what it means.

Workforce Data:
${JSON.stringify(stats, null, 2)}`;

export const fallbackHiringInsight = (stats) => {
  const { totalCandidates, interviewsConducted, candidatesHired, hiringSuccessRate } = stats.metrics || stats;
  if (!totalCandidates) {
    return 'No candidate pipeline data is available yet. Start conducting interviews to populate hiring analytics.';
  }
  return `The hiring pipeline includes ${totalCandidates} candidates with ${interviewsConducted} interviews completed. ${candidatesHired} candidates have been hired, yielding a ${hiringSuccessRate}% success rate. Review shortlisted candidates to improve conversion from interview to offer.`;
};

export const fallbackProductivityInsight = (stats) => {
  const { totalEmployees, activeEmployees, employeesOnLeave, averageAttendancePercentage } = stats.metrics || stats;
  if (!totalEmployees) {
    return 'No employee records found. Convert hired candidates to employees to begin tracking workforce productivity.';
  }
  return `The workforce comprises ${totalEmployees} employees with ${activeEmployees} currently active and ${employeesOnLeave} on approved leave. Average attendance stands at ${averageAttendancePercentage}%, indicating ${averageAttendancePercentage >= 85 ? 'healthy' : 'room for improvement in'} workforce availability.`;
};

export const fallbackPayrollInsight = (stats) => {
  const { totalPayrollProcessed, totalEmployeesPaid, averageSalary, period } = stats.metrics || stats;
  if (!totalEmployeesPaid) {
    return 'No payroll records processed for the current period. Process employee payroll to enable financial workforce insights.';
  }
  return `For ${period || 'the current period'}, payroll of ${formatCurrency(totalPayrollProcessed)} was processed for ${totalEmployeesPaid} employees. The average net salary is ${formatCurrency(averageSalary)}. Review department distribution to ensure equitable compensation allocation.`;
};

export const fallbackLeaveInsight = (stats) => {
  const { totalLeaveRequests, approvedLeaves, pendingLeaves, rejectedLeaves, approvalRate } = stats.metrics || stats;
  if (!totalLeaveRequests) {
    return 'No leave requests recorded yet. Employee leave data will appear here once requests are submitted.';
  }
  return `A total of ${totalLeaveRequests} leave requests have been submitted with ${approvedLeaves} approved, ${pendingLeaves} pending, and ${rejectedLeaves} rejected. The approval rate is ${approvalRate}%. Address pending requests promptly to maintain employee satisfaction.`;
};

export const fallbackAttendanceInsight = (stats) => {
  const { overallAttendancePercentage, totalRecords } = stats.metrics || stats;
  if (!totalRecords) {
    return 'No attendance records available. Begin logging daily attendance to track workforce presence trends.';
  }
  return `Overall attendance is ${overallAttendancePercentage}% across ${totalRecords} recorded days. ${overallAttendancePercentage >= 90 ? 'This reflects strong workforce discipline.' : 'Consider investigating absenteeism patterns to improve operational continuity.'}`;
};

export const fallbackWorkforceReport = (stats) => {
  const h = stats.hiring?.metrics || {};
  const p = stats.productivity?.metrics || {};
  const a = stats.attendance?.metrics || {};
  const l = stats.leaves?.metrics || {};
  const pay = stats.payroll?.metrics || {};

  return `# Workforce Intelligence Report

## Recruitment Overview
${h.totalCandidates ? `${h.totalCandidates} candidates in the pipeline, ${h.interviewsConducted} interviews conducted, and ${h.candidatesHired} hires completed (${h.hiringSuccessRate}% success rate).` : 'No recruitment data available yet.'}

## Employee Overview
${p.totalEmployees ? `${p.totalEmployees} total employees with ${p.activeEmployees} active and ${p.employeesOnLeave} on leave.` : 'No employee records on file.'}

## Attendance Summary
${a.totalRecords ? `Overall attendance rate: ${a.overallAttendancePercentage}%.` : 'Attendance tracking not yet initiated.'}

## Leave Summary
${l.totalLeaveRequests ? `${l.totalLeaveRequests} requests (${l.approvedLeaves} approved, ${l.pendingLeaves} pending, ${l.rejectedLeaves} rejected).` : 'No leave requests recorded.'}

## Payroll Summary
${pay.totalEmployeesPaid ? `${formatCurrency(pay.totalPayrollProcessed)} processed for ${pay.totalEmployeesPaid} employees (avg ${formatCurrency(pay.averageSalary)}).` : 'No payroll data for the current period.'}

## Overall Workforce Insights
${p.totalEmployees && h.candidatesHired ? 'The organization has an active workforce with ongoing recruitment. Monitor attendance and leave trends alongside hiring velocity for balanced workforce planning.' : 'Initialize employee, attendance, leave, and payroll modules to unlock comprehensive workforce intelligence.'}`;
};
