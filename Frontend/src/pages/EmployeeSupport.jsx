import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { SendHorizonal, Sparkles, BookOpen, BriefcaseBusiness, ReceiptText } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import api from '../services/api.js';

const getError = (error) => error.response?.data?.message || error.message || 'Unable to load support assistant.';

const suggestedQuestions = [
  'How many leave days do I have left?',
  'What is the status of my leave request?',
  'When will I receive my salary?',
  'What onboarding tasks are pending?'
];

export const EmployeeSupport = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState([]);

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
        const resolvedId = employeeResponse?.employee?._id || employeeResponse?._id;
        setEmployeeId(resolvedId || lookupId);

        const [historyResponse, policiesResponse] = await Promise.all([
          api.get(`/support/history/${resolvedId || lookupId}`),
          api.get('/support/policies')
        ]);

        setMessages(historyResponse?.messages || []);
        setPolicies(policiesResponse || []);
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
    if (!draft.trim()) return;

    const userMessage = { sender: 'employee', text: draft.trim() };
    setMessages((current) => [...current, userMessage]);
    setDraft('');

    try {
      const payload = employeeId ? { employeeId, message: userMessage.text } : { message: userMessage.text };
      const response = await api.post('/support/chat', payload);
      setMessages((current) => [...current, { sender: 'ai', text: response.message || response.ai || 'I can help with HR-related topics.' }]);
    } catch (error) {
      toast.error(getError(error));
    }
  };

  const chatMessages = useMemo(() => messages, [messages]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-blue-300">AI Employee Support Agent</p>
          <h1 className="mt-1 text-3xl font-bold tracking-normal text-white">Ask HR questions in plain language</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Get support for leave, payroll, onboarding, and company policies without leaving the portal.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-200">
          <Sparkles className="h-4 w-4" />
          Gemini-powered guidance
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
        <div className="glass-panel flex h-[72vh] flex-col p-5">
          <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/70 p-4">
            {loading ? (
              <p className="text-sm text-slate-400">Loading your HR support chat...</p>
            ) : chatMessages.length ? (
              chatMessages.map((message, index) => (
                <div key={`${message.sender}-${index}`} className={`flex ${message.sender === 'employee' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender === 'employee' ? 'bg-blue-500/90 text-white' : 'bg-white/[0.06] text-slate-200'}`}>
                    {message.sender === 'ai' ? (
                      <div className="prose prose-sm max-w-none prose-invert">
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                      </div>
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-3 text-sm text-slate-400">
                <p>Try one of these suggestions to begin.</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question) => (
                    <button key={question} type="button" onClick={() => setDraft(question)} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-xs text-slate-300 transition hover:bg-white/[0.08]">
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="mt-4 flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
              placeholder="Ask about leave, payroll, onboarding, or policies"
            />
            <Button type="submit" icon={SendHorizonal}>Send</Button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 text-white">
              <BookOpen className="h-4 w-4 text-blue-300" />
              <h2 className="font-semibold">Policy Library</h2>
            </div>
            <div className="mt-4 space-y-3">
              {policies.length ? policies.slice(0, 5).map((policy) => (
                <div key={policy._id} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-sm font-medium text-white">{policy.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{policy.category}</p>
                </div>
              )) : <p className="text-sm text-slate-400">Policies will appear here once HR adds them.</p>}
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 text-white">
              <BriefcaseBusiness className="h-4 w-4 text-blue-300" />
              <h2 className="font-semibold">What it can help with</h2>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>• Leave balances and request status</li>
              <li>• Payslips, salary, and deductions</li>
              <li>• Pending onboarding tasks and documents</li>
              <li>• HR processes and policy explanations</li>
            </ul>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 text-white">
              <ReceiptText className="h-4 w-4 text-blue-300" />
              <h2 className="font-semibold">Tip</h2>
            </div>
            <p className="mt-3 text-sm text-slate-400">The assistant uses the data already in the platform when available and keeps responses grounded in HR-related information.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmployeeSupport;
