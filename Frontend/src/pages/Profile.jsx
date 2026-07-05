import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { MetricCard } from '../components/MetricCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatScore } from '../utils/formatters.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to update profile.';

export const Profile = () => {
  const { user, stats, updateProfile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ name: '', title: '', location: '', bio: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshProfile().catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        title: user.title || '',
        location: user.location || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <p className="text-sm text-blue-300">Candidate</p>
        <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">Profile</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Completed" value={stats?.completedInterviews || 0} />
        <MetricCard label="Average" value={formatScore(stats?.averageScore)} />
        <MetricCard label="Best" value={formatScore(stats?.highestScore)} />
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm text-slate-300">
            Name
            <input className="field mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="block text-sm text-slate-300">
            Title
            <input className="field mt-2" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="block text-sm text-slate-300">
            Location
            <input
              className="field mt-2"
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
            />
          </label>
          <label className="block text-sm text-slate-300">
            Avatar URL
            <input
              className="field mt-2"
              value={form.avatarUrl}
              onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })}
            />
          </label>
          <label className="block text-sm text-slate-300 md:col-span-2">
            Bio
            <textarea
              className="field mt-2 min-h-32 resize-y"
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
            />
          </label>
        </div>
        <Button type="submit" icon={Save} loading={saving} className="mt-6">
          Save Profile
        </Button>
      </form>
    </motion.div>
  );
};
