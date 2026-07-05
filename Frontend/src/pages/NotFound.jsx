import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/Button.jsx';

export const NotFound = () => (
  <main className="grid min-h-screen place-items-center px-4">
    <div className="glass-panel max-w-md p-8 text-center">
      <Compass className="mx-auto h-12 w-12 text-blue-300" />
      <h1 className="mt-5 text-3xl font-bold text-white">Page Not Found</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">The route you opened does not exist.</p>
      <Button as={Link} to="/dashboard" className="mt-6">
        Back to Dashboard
      </Button>
    </div>
  </main>
);
