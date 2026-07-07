import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { SendHorizonal } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import api from '../../services/api.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to load chat.';

export const OnboardingChat = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await api.get('/user/profile');
        const lookupId = profile?.user?.email || profile?.user?.employeeId || profile?.user?.id || profile?.user?._id;

        if (!lookupId || ['undefined', 'null'].includes(String(lookupId).toLowerCase())) {
          setEmployeeId('');
          setMessages([]);
          setLoading(false);
          return;
        }

        const employeeResponse = await api.get(`/employee/${encodeURIComponent(lookupId)}`);
        const id = employeeResponse?.employee?._id || employeeResponse?._id;
        setEmployeeId(id || lookupId);
        const history = await api.get(`/chat/history/${id || lookupId}`);
        setMessages(history.messages || []);
      } catch (error) {
        toast.error(getError(error));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !employeeId) return;

    const userMessage = { sender: 'employee', text: draft.trim() };
    setMessages((current) => [...current, userMessage]);
    setDraft('');

    try {
      const response = await api.post('/chat/onboarding', { employeeId, message: userMessage.text });
      setMessages((current) => [...current, { sender: 'ai', text: response.ai || response.message }]);
    } catch (error) {
      toast.error(getError(error));
    }
  };

  const chatMessages = useMemo(() => messages, [messages]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <p className="text-sm text-blue-300">AI onboarding assistant</p>
        <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">Ask anything about your first days</h1>
      </div>

      <div className="glass-panel flex h-[70vh] flex-col p-5">
        <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/70 p-4">
          {loading ? (
            <p className="text-sm text-slate-400">Loading your onboarding conversation...</p>
          ) : chatMessages.length ? (
            chatMessages.map((message, index) => (
              <div key={`${message.sender}-${index}`} className={`flex ${message.sender === 'employee' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${message.sender === 'employee' ? 'bg-blue-500/90 text-white' : 'bg-white/[0.06] text-slate-200'}`}>
                  {message.text}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">Ask the assistant about policies, tools, benefits, or first-day instructions.</p>
          )}
        </div>

        <form onSubmit={sendMessage} className="mt-4 flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
            placeholder="Type your onboarding question"
          />
          <Button type="submit" icon={SendHorizonal}>Send</Button>
        </form>
      </div>
    </motion.div>
  );
};
