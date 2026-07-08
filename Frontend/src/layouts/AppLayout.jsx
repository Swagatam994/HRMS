import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, BriefcaseBusiness, History, LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Button } from '../components/Button.jsx';

const navClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
  }`;

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const navItems =
    user?.role === 'recruiter'
      ? [
          { to: '/hr/dashboard', label: 'Dashboard', icon: BarChart3 },
          { to: '/hr/resume-screening', label: 'Screening', icon: BriefcaseBusiness },
          { to: '/hr/interviews', label: 'Interviews', icon: BriefcaseBusiness },
          { to: '/profile', label: 'Profile', icon: UserRound }
        ]
      : [
          { to: '/candidate/dashboard', label: 'Dashboard', icon: BarChart3 },
          { to: '/onboarding', label: 'Onboarding', icon: BriefcaseBusiness },
          { to: '/candidate/history', label: 'History', icon: History },
          { to: '/profile', label: 'Profile', icon: UserRound }
        ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-ink/80 px-4 py-5 backdrop-blur-xl lg:block">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
            AI
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">AI Interviewer</p>
            <p className="truncate text-xs text-slate-400">
              {user?.name} · {user?.role === 'recruiter' ? 'Recruiter' : 'Candidate'}
            </p>
          </div>
        </div>
        <nav className="mt-8 space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            icon={theme === 'dark' ? Sun : Moon}
            onClick={toggleTheme}
            title="Toggle theme"
            className="flex-1 px-2"
          />
          <Button variant="ghost" icon={LogOut} onClick={handleLogout} title="Log out" className="px-2" />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/78 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <NavLink to={user?.role === 'recruiter' ? '/hr/dashboard' : '/candidate/dashboard'} className="font-semibold text-white">
              AI Interviewer
            </NavLink>
            <div className="flex gap-2">
              <Button variant="secondary" icon={theme === 'dark' ? Sun : Moon} onClick={toggleTheme} title="Toggle theme" />
              <Button variant="ghost" icon={LogOut} onClick={handleLogout} title="Log out" />
            </div>
          </div>
          <nav className="mt-3 grid grid-cols-3 gap-2">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="page-shell py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
