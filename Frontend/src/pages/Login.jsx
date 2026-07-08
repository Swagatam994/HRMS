import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const getError = (error) => error.response?.data?.message || error.message || 'Something went wrong.';
const homeFor = (role) => (role === 'recruiter' ? '/hr/dashboard' : '/candidate/dashboard');

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await login(form);
      toast.success('Signed in');
      navigate(location.state?.from?.pathname || homeFor(response.user?.role), { replace: true });
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <form onSubmit={handleSubmit} className="glass-panel w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in to continue your interview workspace.</p>
        <label className="mt-6 block text-sm text-slate-300">
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
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        <Button type="submit" icon={LogIn} loading={submitting} className="mt-6 w-full">
          Sign In
        </Button>
        <p className="mt-5 text-center text-sm text-slate-400">
          New here?{' '}
          <Link className="font-semibold text-blue-300 hover:text-blue-200" to="/register">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
};
