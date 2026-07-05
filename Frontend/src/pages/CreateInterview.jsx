import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { interviewApi } from '../services/api.js';
import { difficulties, experienceLevels, interviewTypes, roles } from '../utils/constants.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to start interview.';

export const CreateInterview = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: roles[0],
    experienceLevel: experienceLevels[1],
    difficulty: difficulties[1],
    numberOfQuestions: 5,
    interviewType: interviewTypes[0]
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await interviewApi.start({
        ...form,
        numberOfQuestions: Number(form.numberOfQuestions)
      });
      toast.success('Interview created');
      navigate(`/interview/${response.interview.id}`, { state: response });
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <p className="text-sm text-blue-300">Interview Setup</p>
        <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">Create Interview</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-6">
        <div className="grid gap-5 md:grid-cols-2">
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
            <select
              className="field mt-2"
              value={form.experienceLevel}
              onChange={(event) => update('experienceLevel', event.target.value)}
            >
              {experienceLevels.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-300">
            Difficulty
            <select
              className="field mt-2"
              value={form.difficulty}
              onChange={(event) => update('difficulty', event.target.value)}
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty}>{difficulty}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-300">
            Interview Type
            <select
              className="field mt-2"
              value={form.interviewType}
              onChange={(event) => update('interviewType', event.target.value)}
            >
              {interviewTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-300 md:col-span-2">
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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
          <div className="text-sm text-slate-400">
            {form.role} · {form.experienceLevel} · {form.interviewType}
          </div>
          <Button type="submit" icon={PlayCircle} loading={submitting}>
            Start Interview
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
