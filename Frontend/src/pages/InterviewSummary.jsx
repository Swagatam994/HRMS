import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Download, ListChecks, Target, TrendingUp } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { interviewApi } from '../services/api.js';
import { downloadInterviewPdf } from '../utils/pdf.js';
import { formatDate, formatScore } from '../utils/formatters.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to load summary.';

const PillList = ({ title, items = [], icon: Icon, color }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
    <div className={`mb-3 flex items-center gap-2 text-sm font-semibold ${color}`}>
      <Icon className="h-4 w-4" />
      <span>{title}</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {(items.length ? items : ['No items listed']).map((item) => (
        <span key={item} className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1 text-sm text-slate-300">
          {item}
        </span>
      ))}
    </div>
  </div>
);

export const InterviewSummary = () => {
  const { id } = useParams();
  const location = useLocation();
  const [interview, setInterview] = useState(location.state?.interview || null);
  const [loading, setLoading] = useState(!location.state?.interview);

  useEffect(() => {
    if (interview) return;

    const load = async () => {
      try {
        const response = await interviewApi.getById(id);
        setInterview(response.interview);
      } catch (error) {
        toast.error(getError(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, interview]);

  if (loading) return <LoadingScreen label="Loading final report" />;
  if (!interview) return null;

  const report = interview.finalReport || {};
  const answers = interview.answers || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-blue-300">Interview Summary</p>
          <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">{interview.role}</h1>
          <p className="mt-2 text-sm text-slate-400">{formatDate(interview.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => downloadInterviewPdf(interview).catch(() => toast.error('Unable to generate PDF.'))}
          >
            Download PDF
          </Button>
          <Button as={Link} to="/create-interview" icon={ListChecks}>
            Practice Again
          </Button>
        </div>
      </div>

      <section className="glass-panel grid gap-5 p-6 md:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">Overall Score</p>
          <p className="mt-3 text-6xl font-bold tracking-normal text-white">{formatScore(report.overallScore)}</p>
          <p className="mt-4 text-sm leading-6 text-slate-300">{report.summary}</p>
        </div>
        <div className="space-y-3">
          {answers.map((answer, index) => {
            const score = Number(answer.feedback?.score?.overall || 0);
            return (
              <div key={answer._id || answer.questionId} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-semibold text-white">
                    {index + 1}. {answer.question}
                  </p>
                  <span className="shrink-0 text-sm text-blue-300">{formatScore(score)}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-300" style={{ width: `${score * 10}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <PillList title="Strengths" items={report.strengths} icon={TrendingUp} color="text-emerald-300" />
        <PillList title="Weaknesses" items={report.weaknesses} icon={ListChecks} color="text-amber-300" />
        <PillList title="Recommended Topics" items={report.recommendedTopics} icon={Target} color="text-fuchsia-300" />
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Question-wise Feedback</h2>
        <div className="mt-4 space-y-4">
          {answers.map((answer, index) => (
            <article key={answer._id || answer.questionId} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <h3 className="font-semibold text-white">
                {index + 1}. {answer.question}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{answer.transcript}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-amber-300">Mistakes</p>
                  <p className="mt-1 text-sm text-slate-400">{(answer.feedback?.mistakes || []).join('; ') || 'None listed'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-300">Suggestions</p>
                  <p className="mt-1 text-sm text-slate-400">{(answer.feedback?.suggestions || []).join('; ') || 'None listed'}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </motion.div>
  );
};
