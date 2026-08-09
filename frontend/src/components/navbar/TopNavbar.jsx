import { useEffect, useId, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BrainCircuit, Menu, X } from 'lucide-react';
import Button from '../common/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { cn } from '../../utils/cn.js';

const learnerLinks = [
  ['Dashboard', '/dashboard'],
  ['Roadmap', '/roadmap'],
  ['Projects', '/projects'],
  ['Interview', '/interview'],
  ['Mentor', '/mentor'],
  ['Progress', '/progress']
];

const adminLinks = [
  ['Content', '/admin'],
  ['Catalog', '/admin/catalog'],
  ['Topics', '/admin/topics'],
  ['Lessons', '/admin/lessons'],
  ['Questions', '/admin/questions'],
  ['Templates', '/admin/templates']
];

function NavItem({ label, href, onClick, mobile = false }) {
  return <NavLink
    onClick={onClick}
    to={href}
    end={href === '/admin' || href === '/dashboard'}
    className={({ isActive }) => cn(
      'rounded-control px-3 py-2 text-sm font-semibold transition duration-200',
      mobile && 'w-full',
      isActive
        ? 'bg-primary-soft text-primary-strong'
        : 'text-muted-foreground hover:bg-surface-secondary hover:text-foreground'
    )}
  >
    {label}
  </NavLink>;
}

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mobileNavId = useId();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const learner = user?.role !== 'admin';
  const links = learner ? learnerLinks : adminLinks;
  const homePath = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/';

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
      setMobileOpen(false);
    }
  };

  return <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-xl">
    <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <Link to={homePath} className="flex min-w-0 items-center gap-2.5 font-bold text-foreground" aria-label="CodeMentor AI home">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-primary text-white shadow-sm" aria-hidden="true">
          <BrainCircuit size={19} />
        </span>
        <span className="truncate">CodeMentor AI</span>
      </Link>

      {user && <nav className="hidden items-center gap-1 lg:flex" aria-label={learner ? 'Learner navigation' : 'Admin navigation'}>
        {links.map(([label, href]) => <NavItem key={href} label={label} href={href} />)}
      </nav>}

      <div className="flex shrink-0 items-center gap-2">
        {user ? <>
          <div className="hidden max-w-40 text-right md:block">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{user.role || 'learner'}</p>
          </div>
          <Button variant="secondary" onClick={handleLogout} isLoading={isLoggingOut} loadingLabel="Logging out..." className="hidden sm:inline-flex">Logout</Button>
          <button
            type="button"
            className="ui-button ui-button--secondary min-h-10 w-10 p-0 lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-controls={mobileNavId}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </> : <>
          <Link to="/login" className="ui-button ui-button--ghost min-h-9 px-3">Login</Link>
          <Link to="/register" className="ui-button ui-button--primary min-h-9 px-3">Start</Link>
        </>}
      </div>
    </div>

    {user && mobileOpen && <div id={mobileNavId} className="border-t border-border bg-surface px-4 py-4 sm:px-6 lg:hidden">
      <nav className="mx-auto grid max-w-7xl gap-1" aria-label={learner ? 'Mobile learner navigation' : 'Mobile admin navigation'}>
        {links.map(([label, href]) => <NavItem key={href} label={label} href={href} mobile />)}
        <Button variant="ghost" onClick={handleLogout} isLoading={isLoggingOut} loadingLabel="Logging out..." className="mt-2 w-full justify-start sm:hidden">Logout</Button>
      </nav>
    </div>}
  </header>;
}
