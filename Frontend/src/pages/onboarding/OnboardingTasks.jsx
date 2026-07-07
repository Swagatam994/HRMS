import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CheckCircle2, Circle, PlusCircle } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import api from '../../services/api.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to load tasks.';

export const OnboardingTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ title: '', description: '', mandatory: false });

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await api.get('/user/profile');
        const lookupId = profile?.user?.email || profile?.user?.employeeId || profile?.user?.id || profile?.user?._id;

        if (!lookupId || ['undefined', 'null'].includes(String(lookupId).toLowerCase())) {
          setEmployeeId('');
          setTasks([]);
          setLoading(false);
          return;
        }

        const employeeResponse = await api.get(`/employee/${encodeURIComponent(lookupId)}`);
        const id = employeeResponse?.employee?._id || employeeResponse?._id;
        setEmployeeId(id || lookupId);
        const taskResponse = await api.get(`/onboarding/tasks/${id || lookupId}`);
        setTasks(taskResponse || []);
      } catch (error) {
        toast.error(getError(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const toggleTask = async (task) => {
    try {
      const updated = await api.put(`/onboarding/tasks/${task._id}`, { completed: !task.completed });
      setTasks((current) => current.map((item) => (item._id === task._id ? updated : item)));
    } catch (error) {
      toast.error(getError(error));
    }
  };

  const addTask = async (event) => {
    event.preventDefault();
    if (!draft.title || !employeeId) return;

    try {
      const created = await api.post('/onboarding/tasks', { employeeId, ...draft });
      setTasks((current) => [created, ...current]);
      setDraft({ title: '', description: '', mandatory: false });
      toast.success('Task added');
    } catch (error) {
      toast.error(getError(error));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <p className="text-sm text-blue-300">Onboarding tasks</p>
        <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">Role-based checklist</h1>
      </div>

      <form onSubmit={addTask} className="glass-panel p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_0.9fr_auto_auto]">
          <input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
            placeholder="New task title"
          />
          <input
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
            placeholder="Optional description"
          />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={draft.mandatory}
              onChange={(event) => setDraft((current) => ({ ...current, mandatory: event.target.checked }))}
            />
            Mandatory
          </label>
          <Button type="submit" icon={PlusCircle}>Add task</Button>
        </div>
      </form>

      <div className="glass-panel p-5">
        {loading ? (
          <p className="text-sm text-slate-400">Loading tasks...</p>
        ) : tasks.length ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <button
                key={task._id}
                type="button"
                onClick={() => toggleTask(task)}
                className="flex w-full items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-blue-300/50"
              >
                <div className="flex gap-3">
                  {task.completed ? <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-300" /> : <Circle className="mt-0.5 h-5 w-5 flex-none text-slate-400" />}
                  <div>
                    <p className="font-medium text-white">{task.title}</p>
                    {task.description ? <p className="mt-1 text-sm text-slate-400">{task.description}</p> : null}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${task.mandatory ? 'bg-amber-300/15 text-amber-300' : 'bg-slate-700/70 text-slate-300'}`}>
                  {task.mandatory ? 'Mandatory' : 'Optional'}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No tasks assigned yet.</p>
        )}
      </div>
    </motion.div>
  );
};
