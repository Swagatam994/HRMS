import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BriefcaseBusiness, FileText, MessageCircleMore, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../components/Button.jsx';
import api from '../../services/api.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to load onboarding information.';

export const EmployeeDashboard = () => {
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await api.get('/user/profile');
        const lookupId = profile?.user?.email || profile?.user?.employeeId || profile?.user?.id || profile?.user?._id;

        if (!lookupId || ['undefined', 'null'].includes(String(lookupId).toLowerCase())) {
          setEmployee(null);
          setTasks([]);
          setLoading(false);
          return;
        }

        const employeeResponse = await api.get(`/employee/${encodeURIComponent(lookupId)}`);
        const employee = employeeResponse?.employee || employeeResponse;
        const taskResponse = await api.get(`/onboarding/tasks/${employee?._id || lookupId}`);
        setEmployee(employee);
        setTasks(taskResponse || []);
      } catch (error) {
        toast.error(getError(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const completion = useMemo(() => {
    if (!tasks.length) return 0;
    const completed = tasks.filter((task) => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-blue-300">Employee Onboarding</p>
          <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">Welcome, {employee?.name || 'new teammate'}</h1>
        </div>
        <Button as={Link} to="/onboarding/tasks" icon={BriefcaseBusiness}>View tasks</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel p-5">
          <p className="text-sm text-slate-400">Current progress</p>
          <p className="mt-2 text-3xl font-semibold text-white">{completion}%</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-sm text-slate-400">Assigned tasks</p>
          <p className="mt-2 text-3xl font-semibold text-white">{tasks.length}</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-sm text-slate-400">Support</p>
          <p className="mt-2 text-3xl font-semibold text-white">AI Assistant</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Your onboarding journey</h2>
              <p className="text-sm text-slate-400">A guided checklist for your first week.</p>
            </div>
            <Sparkles className="h-5 w-5 text-blue-300" />
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">Loading your onboarding plan...</p>
          ) : (
            <div className="space-y-3">
              {tasks.length ? tasks.slice(0, 4).map((task) => (
                <div key={task._id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{task.title}</p>
                    {task.mandatory ? <span className="text-xs text-amber-300">Mandatory</span> : <span className="text-xs text-slate-400">Optional</span>}
                  </div>
                  {task.description ? <p className="mt-1 text-sm text-slate-400">{task.description}</p> : null}
                </div>
              )) : <p className="text-sm text-slate-400">No onboarding tasks assigned yet.</p>}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Link to="/onboarding/documents" className="glass-panel block p-5 transition hover:border-blue-300/40">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-300" />
              <div>
                <p className="font-semibold text-white">Documents</p>
                <p className="text-sm text-slate-400">Preview and download onboarding paperwork.</p>
              </div>
            </div>
          </Link>
          <Link to="/onboarding/chat" className="glass-panel block p-5 transition hover:border-blue-300/40">
            <div className="flex items-center gap-3">
              <MessageCircleMore className="h-5 w-5 text-blue-300" />
              <div>
                <p className="font-semibold text-white">AI assistant</p>
                <p className="text-sm text-slate-400">Ask questions about your first days.</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
