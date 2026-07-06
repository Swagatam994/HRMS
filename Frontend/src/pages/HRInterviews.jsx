import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, PlusCircle, SlidersHorizontal } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { hrApi } from '../services/api.js';
import { difficulties, experienceLevels, interviewTypes, roles } from '../utils/constants.js';
import { formatDate } from '../utils/formatters.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to load interviews.';

const defaultCriteria = {
  strongHireScore: 8.5,
  hireScore: 7,
  considerScore: 5.5,
  technicalWeight: 0.5,
  communicationWeight: 0.25,
  problemSolvingWeight: 0.25
};

export const HRInterviews = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    role: roles[0],
    experienceLevel: experienceLevels[1],
    difficulty: difficulties[1],
    interviewType: interviewTypes[0],
    numberOfQuestions: 5,
    scoringCriteria: defaultCriteria,
    settings: {
      allowVoice: true,
      allowText: true,
      showEvaluationToCandidate: false,
      autoShortlist: true
    }
  });

  const inviteOrigin = useMemo(() => window.location.origin, []);

  const load = async () => {
    try {
      const response = await hrApi.listInterviews();
      setInterviews(response.interviews || []);
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateCriteria = (field, value) =>
    setForm((current) => ({
      ...current,
      scoringCriteria: { ...current.scoringCriteria, [field]: Number(value) }
    }));
  const updateSetting = (field, value) =>
    setForm((current) => ({
      ...current,
      settings: { ...current.settings, [field]: value }
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await hrApi.createInterview({
        ...form,
        title: form.title || `${form.role} Hiring Round`,
        numberOfQuestions: Number(form.numberOfQuestions)
      });
      toast.success('Interview campaign created');
      navigate(`/hr/interview/${response.interview.id}`);
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const copyInvite = async (inviteCode) => {
    const link = `${inviteOrigin}/candidate/dashboard?code=${inviteCode}`;
    await navigator.clipboard.writeText(link);
    toast.success('Invite link copied');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <p className="text-sm text-blue-300">Recruiter</p>
        <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">Interview Campaigns</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-6">
        <div className="flex items-center gap-2 text-white">
          <PlusCircle className="h-5 w-5 text-blue-300" />
          <h2 className="text-xl font-semibold">Create Campaign</h2>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block text-sm text-slate-300">
            Campaign Title
            <input
              className="field mt-2"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder={`${form.role} Hiring Round`}
            />
          </label>
          <label className="block text-sm text-slate-300">
            Job Role
            <select className="field mt-2" value={form.role} onChange={(event) => update('role', event.target.value)}>
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-300">
            Experience Level
            <select className="field mt-2" value={form.experienceLevel} onChange={(event) => update('experienceLevel', event.target.value)}>
              {experienceLevels.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-300">
            Difficulty
            <select className="field mt-2" value={form.difficulty} onChange={(event) => update('difficulty', event.target.value)}>
              {difficulties.map((difficulty) => (
                <option key={difficulty}>{difficulty}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-300">
            Interview Type
            <select className="field mt-2" value={form.interviewType} onChange={(event) => update('interviewType', event.target.value)}>
              {interviewTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-300">
            Number of Questions
            <input
              className="field mt-2"
              type="number"
              min="1"
              max="20"
              value={form.numberOfQuestions}
              onChange={(event) => update('numberOfQuestions', event.target.value)}
            />
          </label>
        </div>

        <div className="mt-6 grid gap-4 border-t border-white/10 pt-5 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <SlidersHorizontal className="h-4 w-4 text-blue-300" />
              Scoring Criteria
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm text-slate-300">
                Strong Hire
                <input
                  className="field mt-2"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.scoringCriteria.strongHireScore}
                  onChange={(event) => updateCriteria('strongHireScore', event.target.value)}
                />
              </label>
              <label className="text-sm text-slate-300">
                Hire
                <input
                  className="field mt-2"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.scoringCriteria.hireScore}
                  onChange={(event) => updateCriteria('hireScore', event.target.value)}
                />
              </label>
              <label className="text-sm text-slate-300">
                Consider
                <input
                  className="field mt-2"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.scoringCriteria.considerScore}
                  onChange={(event) => updateCriteria('considerScore', event.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="grid content-start gap-3 sm:grid-cols-2">
            {[
              ['allowVoice', 'Voice'],
              ['allowText', 'Text'],
              ['showEvaluationToCandidate', 'Show Evaluation'],
              ['autoShortlist', 'Auto Shortlist']
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={form.settings[key]}
                  onChange={(event) => updateSetting(key, event.target.checked)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" icon={PlusCircle} loading={submitting}>
            Create Campaign
          </Button>
        </div>
      </form>

      <section className="glass-panel overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-xl font-semibold text-white">Campaign List</h2>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-slate-400">Loading campaigns...</p>
        ) : interviews.length ? (
          <div className="divide-y divide-white/5">
            {interviews.map((interview) => (
              <div key={interview.id} className="grid gap-4 px-5 py-4 text-sm md:grid-cols-[1fr_0.7fr_auto]">
                <Link to={`/hr/interview/${interview.id}`} className="min-w-0">
                  <p className="truncate font-semibold text-white">{interview.title}</p>
                  <p className="truncate text-slate-400">
                    {interview.role} · {interview.difficulty} · {formatDate(interview.createdAt)}
                  </p>
                </Link>
                <div className="text-slate-300">
                  <p>{interview.counts?.live || 0} live</p>
                  <p className="text-slate-500">{interview.counts?.completed || 0} completed</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 font-semibold text-blue-200">
                    {interview.inviteCode}
                  </span>
                  <Button variant="secondary" icon={Copy} onClick={() => copyInvite(interview.inviteCode)} title="Copy invite link" />
                  <Button as={Link} to={`/hr/interview/${interview.id}`} variant="secondary" icon={ExternalLink} title="Open campaign" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-5 text-sm text-slate-400">Create a campaign to invite candidates.</p>
        )}
      </section>
    </motion.div>
  );
};
