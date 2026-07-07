import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Activity, ClipboardList, Radio, Trophy, UsersRound, FileText } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { hrApi } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { formatDate, formatScore } from '../utils/formatters.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to load dashboard.';

const StatusBadge = ({ status }) => {
  const tone =
    status === 'live'
      ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200'
      : status === 'completed'
        ? 'border-blue-300/30 bg-blue-300/10 text-blue-200'
        : 'border-amber-300/30 bg-amber-300/10 text-amber-200';

  return <span className={`rounded-lg border px-2 py-1 text-xs font-semibold capitalize ${tone}`}>{status}</span>;
};

export const HRDashboard = () => {
  const [dashboard, setDashboard] = useState({ metrics: {}, interviews: [], activeSessions: [], topCandidates: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await hrApi.dashboard();
      setDashboard(response);
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    socket.emit('hr:join-dashboard');
    const events = [
      'candidate:joined',
      'ai:question',
      'candidate:speaking',
      'candidate:answer_submitted',
      'transcript:update',
      'ai:evaluation_completed',
      'score:update',
      'interview:completed',
      'report:generated',
      'candidate:status_updated'
    ];
    events.forEach((event) => socket.on(event, load));

    return () => {
      events.forEach((event) => socket.off(event, load));
    };
  }, [load]);

  const sessions = dashboard.activeSessions || [];
  const liveSessions = sessions.filter((session) => session.status === 'live' || session.status === 'waiting').slice(0, 6);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-blue-300">Recruiter Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">Live Interview Command Center</h1>
        </div>
        <div className="flex gap-3">
          <Button as={Link} to="/hr/resume-screening" icon={FileText} variant="secondary">
            Screen Resumes
          </Button>
          <Button as={Link} to="/hr/interviews" icon={ClipboardList}>
            Manage Interviews
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Open Campaigns" value={dashboard.metrics?.activeInterviews || 0} icon={ClipboardList} />
        <MetricCard label="Waiting" value={dashboard.metrics?.waitingCandidates || 0} icon={UsersRound} accent="text-amber-300" />
        <MetricCard label="Live Now" value={dashboard.metrics?.liveInterviews || 0} icon={Radio} accent="text-emerald-300" />
        <MetricCard label="Completed" value={dashboard.metrics?.completedInterviews || 0} icon={Trophy} accent="text-blue-300" />
        <MetricCard label="Avg Score" value={formatScore(dashboard.metrics?.averageScore)} icon={Activity} accent="text-fuchsia-300" />
      </div>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-xl font-semibold text-white">Active Interviews</h2>
            <p className="text-sm text-slate-400">Candidate sessions update here without refresh.</p>
          </div>
          {loading ? (
            <p className="p-5 text-sm text-slate-400">Loading sessions...</p>
          ) : liveSessions.length ? (
            <div className="divide-y divide-white/5">
              {liveSessions.map((session) => (
                <Link
                  key={session.id}
                  to={`/hr/interview/${session.interview?._id || session.interview?.id || session.interview}`}
                  className="grid gap-3 px-5 py-4 text-sm transition hover:bg-white/[0.04] md:grid-cols-[1fr_0.8fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{session.candidate?.name || 'Candidate'}</p>
                    <p className="truncate text-slate-400">{session.interview?.title || session.interview?.role || 'Interview'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-slate-300">{session.currentQuestion?.question || 'Waiting for start'}</p>
                    <p className="text-slate-500">{formatDate(session.updatedAt)}</p>
                  </div>
                  <StatusBadge status={session.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-slate-400">No waiting or live candidates yet.</p>
          )}
        </div>

        <div className="glass-panel overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-xl font-semibold text-white">Top Candidates</h2>
            <p className="text-sm text-slate-400">Generated after completed interviews.</p>
          </div>
          {(dashboard.topCandidates || []).length ? (
            <div className="divide-y divide-white/5">
              {dashboard.topCandidates.map((candidate) => (
                <Link
                  key={candidate._id}
                  to={`/hr/interview/${candidate.interview}`}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 text-sm transition hover:bg-white/[0.04]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.08] text-white">
                    {candidate.rank || '-'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{candidate.candidateName}</p>
                    <p className="truncate text-slate-400">{candidate.recommendation}</p>
                  </div>
                  <span className="font-semibold text-blue-300">{formatScore(candidate.overallScore)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-slate-400">Completed candidate rankings will appear here.</p>
          )}
        </div>
      </section>
    </motion.div>
  );
};
