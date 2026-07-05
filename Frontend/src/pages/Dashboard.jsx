import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, CalendarClock, ClipboardList, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { PerformanceChart } from '../components/PerformanceChart.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { interviewApi } from '../services/api.js';
import { formatDate, formatScore } from '../utils/formatters.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to load dashboard.';

export const Dashboard = () => {
  const { user, stats, refreshProfile } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [history] = await Promise.all([interviewApi.history(), refreshProfile()]);
        setInterviews(history.interviews || []);
      } catch (error) {
        toast.error(getError(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const recent = interviews.slice(0, 4);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-blue-300">Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">Hi, {user?.name || 'Candidate'}</h1>
        </div>
        <Button as={Link} to="/create-interview" icon={ClipboardList}>
          New Interview
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Interviews" value={stats?.totalInterviews || 0} icon={ClipboardList} />
        <MetricCard label="Average Score" value={formatScore(stats?.averageScore)} icon={TrendingUp} accent="text-emerald-300" />
        <MetricCard label="Highest Score" value={formatScore(stats?.highestScore)} icon={Award} accent="text-amber-300" />
        <MetricCard label="Upcoming Practice" value="Today" icon={CalendarClock} accent="text-fuchsia-300" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="glass-panel p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Performance Chart</h2>
              <p className="text-sm text-slate-400">Last completed interview scores</p>
            </div>
          </div>
          <PerformanceChart interviews={interviews} />
        </section>

        <section className="glass-panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Interview History</h2>
            <Link to="/history" className="text-sm font-semibold text-blue-300 hover:text-blue-200">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-400">Loading history...</p>
            ) : recent.length ? (
              recent.map((item) => (
                <Link
                  key={item._id}
                  to={item.status === 'completed' ? `/summary/${item._id}` : `/interview/${item._id}`}
                  className="block rounded-lg border border-white/10 bg-white/[0.04] p-4 transition hover:border-blue-300/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-semibold text-white">{item.role}</p>
                    <span className="shrink-0 text-sm text-blue-300">{formatScore(item.finalReport?.overallScore)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.interviewType} · {formatDate(item.createdAt)}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-400">No interviews yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Upcoming Practice</h2>
            <p className="mt-1 text-sm text-slate-400">Recommended next session: mixed technical practice.</p>
          </div>
          <Button as={Link} to="/create-interview" variant="secondary" icon={CalendarClock}>
            Schedule Practice
          </Button>
        </div>
      </section>
    </motion.div>
  );
};
