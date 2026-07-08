import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit, LineChart, Mic, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const signals = [
  { label: 'Live voice flow', icon: Mic, value: 'Speech' },
  { label: 'Structured scoring', icon: BrainCircuit, value: 'Gemini' },
  { label: 'Report history', icon: LineChart, value: 'Charts' },
  { label: 'JWT protected', icon: ShieldCheck, value: 'Secure' }
];

export const Home = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <main className="min-h-screen">
      <section className="page-shell grid min-h-screen items-center gap-10 py-10 lg:grid-cols-[1fr_0.9fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="mb-4 inline-flex rounded-lg border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-sm text-blue-200">
            MERN + Gemini Interview Platform
          </p>
          <h1 className="max-w-3xl text-5xl font-bold tracking-normal text-white sm:text-6xl">
            AI Interviewer Agent
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Run first-round technical interviews with recruiter campaign dashboards, live candidate sessions, and
            AI-assisted rankings.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button as={Link} to="/register" icon={BrainCircuit}>
              Create Account
            </Button>
            <Button as={Link} to="/login" variant="secondary">
              Sign In
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="glass-panel p-5 shadow-glow"
        >
          <div className="rounded-lg border border-white/10 bg-black/[0.24] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Current Question</p>
                <p className="mt-1 text-xl font-semibold text-white">Explain closures in JavaScript.</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 text-white">
                <Mic className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-blue-400 via-emerald-300 to-amber-300" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {signals.map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
                  <item.icon className="h-5 w-5 text-blue-300" />
                  <p className="mt-3 text-lg font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
};
