import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const getError = (error) => error.response?.data?.message || error.message || 'Something went wrong.';
const homeFor = (role) => (role === 'recruiter' ? '/hr/dashboard' : '/candidate/dashboard');

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate', organization: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await register(form);
      toast.success('Account created');
      navigate(homeFor(response.user?.role));
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <form onSubmit={handleSubmit} className="glass-panel w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-white">Create Account</h1>
        <p className="mt-2 text-sm text-slate-400">Create a recruiter or candidate workspace.</p>
        <label className="mt-6 block text-sm text-slate-300">
          Name
          <input
            className="field mt-2"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>
        <label className="mt-4 block text-sm text-slate-300">
          Email
          <input
            className="field mt-2"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <label className="mt-4 block text-sm text-slate-300">
          Password
          <input
            className="field mt-2"
            type="password"
            minLength={6}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        <label className="mt-4 block text-sm text-slate-300">
          Account Type
          <select
            className="field mt-2"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            <option value="candidate">Candidate</option>
            <option value="recruiter">HR / Recruiter</option>
          </select>
        </label>
        {form.role === 'recruiter' ? (
          <label className="mt-4 block text-sm text-slate-300">
            Organization
            <input
              className="field mt-2"
              value={form.organization}
              onChange={(event) => setForm({ ...form, organization: event.target.value })}
            />
          </label>
        ) : null}
        <Button type="submit" icon={UserPlus} loading={submitting} className="mt-6 w-full">
          Register
        </Button>
        <p className="mt-5 text-center text-sm text-slate-400">
          Already registered?{' '}
          <Link className="font-semibold text-blue-300 hover:text-blue-200" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
};
