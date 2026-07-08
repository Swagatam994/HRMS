import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { History, PlusCircle } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { interviewApi } from '../services/api.js';
import { formatDate, formatScore } from '../utils/formatters.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to load history.';

export const InterviewHistory = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await interviewApi.history();
        setInterviews(response.interviews || []);
      } catch (error) {
        toast.error(getError(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-blue-300">Archive</p>
          <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">Interview History</h1>
        </div>
        <Button as={Link} to="/create-interview" icon={PlusCircle}>
          New Interview
        </Button>
      </div>

      {loading ? (
        <div className="glass-panel p-5 text-sm text-slate-400">Loading history...</div>
      ) : interviews.length ? (
        <div className="glass-panel overflow-hidden">
          <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.7fr] gap-3 border-b border-white/10 px-5 py-3 text-sm text-slate-400 sm:grid">
            <span>Role</span>
            <span>Type</span>
            <span>Score</span>
            <span>Date</span>
          </div>
          {interviews.map((item) => (
            <Link
              key={item._id}
              to={item.status === 'completed' ? `/summary/${item._id}` : `/interview/${item._id}`}
              className="grid gap-2 border-b border-white/5 px-5 py-4 text-sm transition last:border-b-0 hover:bg-white/[0.04] sm:grid-cols-[1.4fr_1fr_0.8fr_0.7fr] sm:gap-3"
            >
              <span className="min-w-0 truncate font-semibold text-white">{item.role}</span>
              <span className="min-w-0 truncate text-slate-300">{item.interviewType}</span>
              <span className="text-blue-300">{formatScore(item.finalReport?.overallScore)}</span>
              <span className="text-slate-400">{formatDate(item.createdAt)}</span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No interviews yet"
          description="Start a practice session to create your first report."
          actionLabel="Create Interview"
          icon={History}
          onAction={() => navigate('/create-interview')}
        />
      )}
    </motion.div>
  );
};
