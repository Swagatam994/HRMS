import { Attendance } from '../models/Attendance.js';
import { CandidateRanking } from '../models/CandidateRanking.js';
import Employee from '../models/Employee.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { Leave } from '../models/Leave.js';
import { Payroll } from '../models/Payroll.js';

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const monthLabel = (year, month) =>
  new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });

const pct = (numerator, denominator) => {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
};

export const getHiringAnalytics = async () => {
  const [totalCandidates, interviewsConducted, shortlisted, hired, statusBreakdown, monthlyHires] = await Promise.all([
    InterviewSession.distinct('candidate').then((ids) => ids.length),
    InterviewSession.countDocuments({ status: 'completed' }),
    CandidateRanking.countDocuments({ status: 'Shortlisted' }),
    CandidateRanking.countDocuments({ status: 'Hired' }),
    CandidateRanking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    CandidateRanking.aggregate([
      { $match: { status: 'Hired' } },
      {
        $group: {
          _id: { year: { $year: '$interviewDate' }, month: { $month: '$interviewDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ])
  ]);

  const hiringSuccessRate = pct(hired, totalCandidates);

  return {
    metrics: {
      totalCandidates,
      interviewsConducted,
      candidatesShortlisted: shortlisted,
      candidatesHired: hired,
      hiringSuccessRate
    },
    charts: {
      statusDistribution: statusBreakdown.map((row) => ({
        label: row._id,
        value: row.count
      })),
      monthlyHiring: monthlyHires.map((row) => ({
        label: monthLabel(row._id.year, row._id.month),
        value: row.count
      })),
      funnel: [
        { label: 'Candidates', value: totalCandidates },
        { label: 'Interviews', value: interviewsConducted },
        { label: 'Shortlisted', value: shortlisted },
        { label: 'Hired', value: hired }
      ]
    }
  };
};

export const getProductivityAnalytics = async () => {
  const today = startOfDay(new Date());

  const [totalEmployees, onLeaveToday, attendanceStats] = await Promise.all([
    Employee.countDocuments(),
    Leave.countDocuments({
      status: 'approved',
      startDate: { $lte: endOfDay(today) },
      endDate: { $gte: today }
    }),
    Attendance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['present', 'late', 'half-day']] }, 1, 0]
            }
          }
        }
      }
    ])
  ]);

  const activeEmployees = Math.max(totalEmployees - onLeaveToday, 0);
  const attendanceRow = attendanceStats[0] || { total: 0, present: 0 };
  const averageAttendancePercentage = pct(attendanceRow.present, attendanceRow.total);

  return {
    metrics: {
      totalEmployees,
      activeEmployees,
      employeesOnLeave: onLeaveToday,
      averageAttendancePercentage
    }
  };
};

export const getPayrollAnalytics = async () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [currentMonth, departmentBreakdown, salaryRanges] = await Promise.all([
    Payroll.aggregate([
      { $match: { month, year, status: { $in: ['processed', 'paid'] } } },
      {
        $group: {
          _id: null,
          totalPayroll: { $sum: '$netSalary' },
          employeesPaid: { $sum: 1 },
          averageSalary: { $avg: '$netSalary' }
        }
      }
    ]),
    Payroll.aggregate([
      { $match: { month, year } },
      {
        $group: {
          _id: { $ifNull: ['$department', 'Unassigned'] },
          total: { $sum: '$netSalary' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]),
    Payroll.aggregate([
      { $match: { month, year } },
      {
        $bucket: {
          groupBy: '$netSalary',
          boundaries: [0, 30000, 50000, 80000, 120000, 200000],
          default: '200000+',
          output: { count: { $sum: 1 }, total: { $sum: '$netSalary' } }
        }
      }
    ])
  ]);

  const row = currentMonth[0] || { totalPayroll: 0, employeesPaid: 0, averageSalary: 0 };

  const rangeLabels = {
    0: 'Under 30K',
    30000: '30K – 50K',
    50000: '50K – 80K',
    80000: '80K – 120K',
    120000: '120K – 200K',
    '200000+': '200K+'
  };

  return {
    metrics: {
      totalPayrollProcessed: Math.round(row.totalPayroll || 0),
      totalEmployeesPaid: row.employeesPaid || 0,
      averageSalary: Math.round(row.averageSalary || 0),
      period: monthLabel(year, month)
    },
    charts: {
      departmentDistribution: departmentBreakdown.map((item) => ({
        label: item._id,
        value: Math.round(item.total),
        count: item.count
      })),
      salaryDistribution: salaryRanges.map((item) => ({
        label: rangeLabels[item._id] || String(item._id),
        value: item.count
      }))
    }
  };
};

export const getLeaveAnalytics = async () => {
  const [total, approved, pending, rejected, typeBreakdown, monthlyTrend] = await Promise.all([
    Leave.countDocuments(),
    Leave.countDocuments({ status: 'approved' }),
    Leave.countDocuments({ status: 'pending' }),
    Leave.countDocuments({ status: 'rejected' }),
    Leave.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Leave.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$startDate' },
            month: { $month: '$startDate' }
          },
          count: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ])
  ]);

  return {
    metrics: {
      totalLeaveRequests: total,
      approvedLeaves: approved,
      pendingLeaves: pending,
      rejectedLeaves: rejected,
      approvalRate: pct(approved, total)
    },
    charts: {
      statusDistribution: [
        { label: 'Approved', value: approved },
        { label: 'Pending', value: pending },
        { label: 'Rejected', value: rejected }
      ],
      typeDistribution: typeBreakdown.map((row) => ({
        label: row._id,
        value: row.count
      })),
      monthlyTrend: monthlyTrend.map((row) => ({
        label: monthLabel(row._id.year, row._id.month),
        total: row.count,
        approved: row.approved
      }))
    }
  };
};

export const getAttendanceAnalytics = async () => {
  const today = startOfDay(new Date());
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const eightWeeksAgo = new Date(today);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 7 * 7);

  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

  const [overall, daily, weekly, monthly] = await Promise.all([
    Attendance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['present', 'late', 'half-day']] }, 1, 0]
            }
          }
        }
      }
    ]),
    Attendance.aggregate([
      { $match: { date: { $gte: sevenDaysAgo, $lte: endOfDay(today) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['present', 'late', 'half-day']] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Attendance.aggregate([
      { $match: { date: { $gte: eightWeeksAgo } } },
      {
        $group: {
          _id: { $isoWeek: '$date', year: { $isoWeekYear: '$date' } },
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['present', 'late', 'half-day']] }, 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id._id': 1 } },
      { $limit: 8 }
    ]),
    Attendance.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['present', 'late', 'half-day']] }, 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ])
  ]);

  const overallRow = overall[0] || { total: 0, present: 0 };
  const overallAttendancePercentage = pct(overallRow.present, overallRow.total);

  const formatDay = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return {
    metrics: {
      overallAttendancePercentage,
      totalRecords: overallRow.total,
      presentRecords: overallRow.present
    },
    charts: {
      dailyAttendance: daily.map((row) => ({
        label: formatDay(row._id),
        percentage: pct(row.present, row.total),
        present: row.present,
        total: row.total
      })),
      weeklyTrend: weekly.map((row) => ({
        label: `W${row._id._id} ${row._id.year}`,
        percentage: pct(row.present, row.total)
      })),
      monthlyTrend: monthly.map((row) => ({
        label: monthLabel(row._id.year, row._id.month),
        percentage: pct(row.present, row.total)
      }))
    }
  };
};

export const getDashboardOverview = async () => {
  const [hiring, productivity, payroll, leaves, attendance] = await Promise.all([
    getHiringAnalytics(),
    getProductivityAnalytics(),
    getPayrollAnalytics(),
    getLeaveAnalytics(),
    getAttendanceAnalytics()
  ]);

  return {
    hiring: hiring.metrics,
    productivity: productivity.metrics,
    payroll: payroll.metrics,
    leaves: leaves.metrics,
    attendance: attendance.metrics,
    generatedAt: new Date().toISOString()
  };
};

export const getWorkforceStats = async () => ({
  hiring: await getHiringAnalytics(),
  productivity: await getProductivityAnalytics(),
  payroll: await getPayrollAnalytics(),
  leaves: await getLeaveAnalytics(),
  attendance: await getAttendanceAnalytics()
});
