import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, Copy, Radio, RefreshCw, UserCheck } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { hrApi } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { formatDate, formatDuration, formatScore } from '../utils/formatters.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to load interview.';

const statusClass = (status) =>
  status === 'live'
    ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200'
    : status === 'completed'
      ? 'border-blue-300/30 bg-blue-300/10 text-blue-200'
      : 'border-amber-300/30 bg-amber-300/10 text-amber-200';

const ScoreCell = ({ label, value }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
    <p className="text-xs text-slate-400">{label}</p>
    <p className="mt-1 text-lg font-semibold text-white">{formatScore(value)}</p>
  </div>
);

export const HRInterviewDetail = () => {
  const { id } = useParams();
  const [detail, setDetail] = useState({ interview: null, sessions: [], rankings: [] });
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('rank');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await hrApi.getInterview(id);
      setDetail(response);
      setSelectedSessionId((current) => current || response.sessions?.[0]?.id || '');
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    socket.emit('hr:join-interview', { interviewId: id });
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
  }, [id, load]);

  const interview = detail.interview;
  const sessions = detail.sessions || [];
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) || sessions[0];
  const lastAnswer = selectedSession?.answers?.[selectedSession.answers.length - 1];

  const rankings = useMemo(() => {
    const rows = [...(detail.rankings || [])].filter((ranking) => !statusFilter || ranking.status === statusFilter);
    const sorters = {
      rank: (a, b) => (a.rank || 99) - (b.rank || 99),
      overallScore: (a, b) => b.overallScore - a.overallScore,
      technicalScore: (a, b) => (b.scores?.technicalScore || 0) - (a.scores?.technicalScore || 0),
      communicationScore: (a, b) => (b.scores?.communicationScore || 0) - (a.scores?.communicationScore || 0),
      interviewDate: (a, b) => new Date(b.interviewDate) - new Date(a.interviewDate),
      status: (a, b) => a.status.localeCompare(b.status)
    };
    return rows.sort(sorters[sort] || sorters.rank);
  }, [detail.rankings, sort, statusFilter]);

  const copyInvite = async () => {
    const link = `${window.location.origin}/candidate/dashboard?code=${interview.inviteCode}`;
    await navigator.clipboard.writeText(link);
    toast.success('Invite link copied');
  };

  const updateStatus = async (rankingId, status) => {
    try {
      await hrApi.updateCandidateStatus(rankingId, status);
      toast.success('Candidate status updated');
      load();
    } catch (error) {
      toast.error(getError(error));
    }
  };

  if (loading) {
    return <div className="glass-panel p-5 text-sm text-slate-400">Loading interview...</div>;
  }

  if (!interview) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/hr/interviews" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 hover:text-blue-200">
            <ArrowLeft className="h-4 w-4" />
            Campaigns
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-white">{interview.title}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {interview.role} · {interview.difficulty} · {interview.interviewType}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-semibold text-blue-200">
            {interview.inviteCode}
          </span>
          <Button variant="secondary" icon={Copy} onClick={copyInvite}>
            Copy Link
          </Button>
          <Button variant="secondary" icon={RefreshCw} onClick={load} title="Refresh" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <ScoreCell label="Waiting" value={interview.counts?.waiting || 0} />
        <ScoreCell label="Live" value={interview.counts?.live || 0} />
        <ScoreCell label="Completed" value={interview.counts?.completed || 0} />
        <ScoreCell label="Total Candidates" value={interview.counts?.total || 0} />
      </div>

      <section className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="glass-panel overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-xl font-semibold text-white">Candidate Sessions</h2>
          </div>
          {sessions.length ? (
            <div className="divide-y divide-white/5">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`block w-full px-5 py-4 text-left text-sm transition hover:bg-white/[0.04] ${
                    selectedSession?.id === session.id ? 'bg-white/[0.06]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate font-semibold text-white">{session.candidate?.name || 'Candidate'}</p>
                    <span className={`rounded-lg border px-2 py-1 text-xs font-semibold capitalize ${statusClass(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-slate-400">{session.candidate?.email || 'No email'}</p>
                  <p className="mt-2 text-blue-300">{formatScore(session.runningScore?.overallScore)}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-slate-400">No candidates have joined this campaign yet.</p>
          )}
        </div>

        <div className="glass-panel p-5">
          {selectedSession ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-blue-300">{selectedSession.candidate?.name || 'Candidate'}</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">Live Monitor</h2>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
                  <Radio className="h-4 w-4 text-emerald-300" />
                  <span className="capitalize">{selectedSession.status}</span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <ScoreCell label="Technical" value={selectedSession.runningScore?.technicalScore} />
                <ScoreCell label="Communication" value={selectedSession.runningScore?.communicationScore} />
                <ScoreCell label="Problem Solving" value={selectedSession.runningScore?.problemSolvingScore} />
                <ScoreCell label="Overall" value={selectedSession.runningScore?.overallScore} />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm text-slate-400">Current Question</p>
                  <p className="mt-2 text-lg font-semibold leading-7 text-white">
                    {selectedSession.currentQuestion?.question || 'Waiting for candidate activity.'}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    Question {Math.min(selectedSession.currentQuestionIndex + 1, selectedSession.questions?.length || 1)} of{' '}
                    {selectedSession.questions?.length || interview.numberOfQuestions}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm text-slate-400">Duration</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatDuration(selectedSession.elapsedSeconds)}</p>
                  <p className="mt-3 text-sm text-slate-500">Started {formatDate(selectedSession.startedAt)}</p>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-semibold text-white">Live Transcript</p>
                <p className="mt-3 min-h-24 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                  {selectedSession.liveTranscript || 'Transcript updates will stream here while the candidate speaks or types.'}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-semibold text-white">Latest AI Evaluation</p>
                {lastAnswer ? (
                  <div className="mt-3 space-y-3 text-sm">
                    <p className="font-semibold text-slate-200">{lastAnswer.question}</p>
                    <p className="leading-6 text-slate-300">{lastAnswer.transcript}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <p className="rounded-lg bg-black/20 p-3 text-slate-300">
                        Score: <span className="font-semibold text-blue-300">{formatScore(lastAnswer.feedback?.score?.overall)}</span>
                      </p>
                      <p className="rounded-lg bg-black/20 p-3 text-slate-300">
                        Suggestions: {(lastAnswer.feedback?.suggestions || []).join('; ') || 'Pending'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">No evaluated answers yet.</p>
                )}
              </div>

              {selectedSession.status === 'completed' ? (
                <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
                  <p className="text-sm font-semibold text-emerald-200">Final Summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{selectedSession.finalReport?.summary || 'Report generated.'}</p>
                  <p className="mt-3 text-sm font-semibold text-white">
                    Recommendation: {selectedSession.finalReport?.recommendation || 'Pending'}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Select a session to monitor it live.</p>
          )}
        </div>
      </section>

      <section className="glass-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Candidate Ranking</h2>
            <p className="text-sm text-slate-400">Compare candidates for this job opening.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="field w-auto py-2" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="rank">Rank</option>
              <option value="overallScore">Overall Score</option>
              <option value="technicalScore">Technical Score</option>
              <option value="communicationScore">Communication Score</option>
              <option value="interviewDate">Interview Date</option>
              <option value="status">Status</option>
            </select>
            <select className="field w-auto py-2" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Rejected">Rejected</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>

        {rankings.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 text-slate-400">
                <tr>
                  {['Rank', 'Candidate', 'Technical', 'Communication', 'Problem Solving', 'Overall', 'Recommendation', 'Status'].map((head) => (
                    <th key={head} className="px-5 py-3 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rankings.map((ranking) => (
                  <tr key={ranking._id} className="align-top">
                    <td className="px-5 py-4 text-white">{ranking.rank || '-'}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{ranking.candidateName}</p>
                      <p className="text-slate-400">{ranking.roleApplied}</p>
                    </td>
                    <td className="px-5 py-4 text-blue-300">{formatScore(ranking.scores?.technicalScore)}</td>
                    <td className="px-5 py-4 text-blue-300">{formatScore(ranking.scores?.communicationScore)}</td>
                    <td className="px-5 py-4 text-blue-300">{formatScore(ranking.scores?.problemSolvingScore)}</td>
                    <td className="px-5 py-4 font-semibold text-white">{formatScore(ranking.overallScore)}</td>
                    <td className="px-5 py-4 text-slate-200">{ranking.recommendation}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {['Shortlisted', 'Rejected', 'On Hold'].map((status) => (
                          <Button
                            key={status}
                            variant={ranking.status === status ? 'primary' : 'secondary'}
                            icon={UserCheck}
                            className="px-2"
                            onClick={() => updateStatus(ranking._id, status)}
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-5 text-sm text-slate-400">Rankings appear after candidates complete their interviews.</p>
        )}
      </section>
    </motion.div>
  );
};
