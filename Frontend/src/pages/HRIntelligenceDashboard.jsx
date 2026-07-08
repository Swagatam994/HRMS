import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Banknote,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  FileText,
  RefreshCw,
  TrendingUp,
  UserCheck,
  Users
} from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { DashboardBarChart } from '../components/dashboard/DashboardBarChart.jsx';
import { DashboardDoughnutChart } from '../components/dashboard/DashboardDoughnutChart.jsx';
import { DashboardLineChart } from '../components/dashboard/DashboardLineChart.jsx';
import { InsightCard } from '../components/dashboard/InsightCard.jsx';
import { dashboardApi } from '../services/api.js';
import { formatCurrency, formatPercent } from '../utils/formatters.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to load dashboard.';

const SectionHeader = ({ title, description }) => (
  <div className="mb-4">
    <h2 className="text-lg font-semibold text-white">{title}</h2>
    {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
  </div>
);

const ReportMarkdown = ({ content }) => {
  const lines = (content || '').split('\n').filter(Boolean);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-300">
      {lines.map((line, index) => {
        if (line.startsWith('## ')) {
          return (
            <h3 key={index} className="pt-2 text-base font-semibold text-white">
              {line.replace('## ', '')}
            </h3>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h3 key={index} className="text-base font-semibold text-white">
              {line.replace('# ', '')}
            </h3>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <p key={index} className="pl-4 before:mr-2 before:content-['•']">
              {line.replace('- ', '')}
            </p>
          );
        }
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
};

export const HRIntelligenceDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [hiring, setHiring] = useState(null);
  const [productivity, setProductivity] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [leaves, setLeaves] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [workforceReport, setWorkforceReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewData, hiringData, productivityData, payrollData, leavesData, attendanceData] = await Promise.all([
        dashboardApi.overview(),
        dashboardApi.hiring(),
        dashboardApi.productivity(),
        dashboardApi.payroll(),
        dashboardApi.leaves(),
        dashboardApi.attendance()
      ]);

      setOverview(overviewData);
      setHiring(hiringData);
      setProductivity(productivityData);
      setPayroll(payrollData);
      setLeaves(leavesData);
      setAttendance(attendanceData);
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWorkforceReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const data = await dashboardApi.workforceReport();
      setWorkforceReport(data);
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">HR Intelligence</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Workforce Analytics Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            AI-powered insights across recruitment, employees, attendance, leave, and payroll — all in one place.
          </p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={loadDashboard} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading && !overview ? (
        <div className="glass-panel flex h-48 items-center justify-center text-slate-400">Loading intelligence data...</div>
      ) : (
        <>
          <section>
            <SectionHeader title="Executive Overview" description="Key workforce metrics at a glance" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard label="Total Candidates" value={overview?.hiring?.totalCandidates ?? 0} icon={Users} accent="text-blue-300" />
              <MetricCard label="Total Employees" value={overview?.productivity?.totalEmployees ?? 0} icon={UserCheck} accent="text-emerald-300" />
              <MetricCard
                label="Attendance Rate"
                value={formatPercent(overview?.attendance?.overallAttendancePercentage)}
                icon={CalendarCheck}
                accent="text-amber-300"
              />
              <MetricCard label="Pending Leaves" value={overview?.leaves?.pendingLeaves ?? 0} icon={CalendarDays} accent="text-violet-300" />
              <MetricCard
                label="Payroll Processed"
                value={formatCurrency(overview?.payroll?.totalPayrollProcessed)}
                icon={Banknote}
                accent="text-rose-300"
              />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="glass-panel p-5">
              <SectionHeader title="Hiring Analytics" description="Recruitment pipeline performance" />
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <MetricCard label="Interviews" value={hiring?.metrics?.interviewsConducted ?? 0} icon={Briefcase} />
                <MetricCard label="Shortlisted" value={hiring?.metrics?.candidatesShortlisted ?? 0} icon={ClipboardCheck} />
                <MetricCard label="Hired" value={hiring?.metrics?.candidatesHired ?? 0} icon={UserCheck} accent="text-emerald-300" />
                <MetricCard
                  label="Success Rate"
                  value={formatPercent(hiring?.metrics?.hiringSuccessRate)}
                  icon={TrendingUp}
                  accent="text-blue-300"
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <DashboardBarChart data={hiring?.charts?.funnel} label="Pipeline" />
                <DashboardDoughnutChart data={hiring?.charts?.statusDistribution} />
              </div>
              <div className="mt-4">
                <InsightCard title="AI Hiring Insight" summary={hiring?.aiSummary} loading={loading} />
              </div>
            </div>

            <div className="glass-panel p-5">
              <SectionHeader title="Employee Productivity" description="Workforce availability and attendance health" />
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <MetricCard label="Active Employees" value={productivity?.metrics?.activeEmployees ?? 0} icon={UserCheck} accent="text-emerald-300" />
                <MetricCard label="On Leave" value={productivity?.metrics?.employeesOnLeave ?? 0} icon={CalendarDays} accent="text-amber-300" />
                <MetricCard
                  label="Avg Attendance"
                  value={formatPercent(productivity?.metrics?.averageAttendancePercentage)}
                  icon={CalendarCheck}
                  accent="text-blue-300"
                />
                <MetricCard label="Total Employees" value={productivity?.metrics?.totalEmployees ?? 0} icon={Users} />
              </div>
              <InsightCard title="AI Productivity Insight" summary={productivity?.aiSummary} loading={loading} />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="glass-panel p-5">
              <SectionHeader title="Payroll Dashboard" description={payroll?.metrics?.period ? `Period: ${payroll.metrics.period}` : 'Monthly payroll summary'} />
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <MetricCard label="Employees Paid" value={payroll?.metrics?.totalEmployeesPaid ?? 0} icon={Users} />
                <MetricCard label="Avg Salary" value={formatCurrency(payroll?.metrics?.averageSalary)} icon={Banknote} accent="text-emerald-300" />
                <MetricCard
                  label="Total Processed"
                  value={formatCurrency(payroll?.metrics?.totalPayrollProcessed)}
                  icon={TrendingUp}
                  accent="text-blue-300"
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <DashboardBarChart data={payroll?.charts?.departmentDistribution} label="Amount" horizontal />
                <DashboardDoughnutChart data={payroll?.charts?.salaryDistribution} emptyMessage="No salary distribution data" />
              </div>
              <div className="mt-4">
                <InsightCard title="AI Payroll Insight" summary={payroll?.aiSummary} loading={loading} />
              </div>
            </div>

            <div className="glass-panel p-5">
              <SectionHeader title="Leave Analytics" description="Leave request trends and approvals" />
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <MetricCard label="Total Requests" value={leaves?.metrics?.totalLeaveRequests ?? 0} icon={CalendarDays} />
                <MetricCard label="Approved" value={leaves?.metrics?.approvedLeaves ?? 0} icon={CalendarCheck} accent="text-emerald-300" />
                <MetricCard label="Pending" value={leaves?.metrics?.pendingLeaves ?? 0} icon={ClipboardCheck} accent="text-amber-300" />
                <MetricCard label="Rejected" value={leaves?.metrics?.rejectedLeaves ?? 0} icon={FileText} accent="text-rose-300" />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <DashboardDoughnutChart data={leaves?.charts?.statusDistribution} />
                <DashboardBarChart data={leaves?.charts?.typeDistribution} label="Requests" />
              </div>
              <div className="mt-4">
                <InsightCard title="AI Leave Insight" summary={leaves?.aiSummary} loading={loading} />
              </div>
            </div>
          </section>

          <section className="glass-panel p-5">
            <SectionHeader title="Attendance Trends" description="Daily, weekly, and monthly attendance patterns" />
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Overall Attendance"
                value={formatPercent(attendance?.metrics?.overallAttendancePercentage)}
                icon={CalendarCheck}
                accent="text-emerald-300"
              />
              <MetricCard label="Present Records" value={attendance?.metrics?.presentRecords ?? 0} icon={UserCheck} />
              <MetricCard label="Total Records" value={attendance?.metrics?.totalRecords ?? 0} icon={ClipboardCheck} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Daily (7 days)</p>
                <DashboardLineChart
                  data={attendance?.charts?.dailyAttendance}
                  valueKey="percentage"
                  label="Attendance %"
                  yMax={100}
                  suffix="%"
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Weekly Trend</p>
                <DashboardLineChart
                  data={attendance?.charts?.weeklyTrend}
                  valueKey="percentage"
                  label="Attendance %"
                  color="#34d399"
                  yMax={100}
                  suffix="%"
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Monthly Trend</p>
                <DashboardBarChart data={attendance?.charts?.monthlyTrend?.map((item) => ({ label: item.label, value: item.percentage }))} label="%" />
              </div>
            </div>
            <div className="mt-4">
              <InsightCard title="AI Attendance Insight" summary={attendance?.aiSummary} loading={loading} />
            </div>
          </section>

          <section className="glass-panel p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <SectionHeader title="Workforce Intelligence Report" description="AI-generated executive summary across all HR modules" />
              </div>
              <Button variant="primary" icon={FileText} onClick={loadWorkforceReport} disabled={reportLoading}>
                {reportLoading ? 'Generating...' : workforceReport ? 'Regenerate Report' : 'Generate Report'}
              </Button>
            </div>
            {reportLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
                <div className="h-3 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
              </div>
            ) : workforceReport ? (
              <ReportMarkdown content={workforceReport.report} />
            ) : (
              <p className="text-sm text-slate-400">
                Click &quot;Generate Report&quot; to create a comprehensive AI-powered workforce intelligence report using Gemini.
              </p>
            )}
          </section>
        </>
      )}
    </motion.div>
  );
};
