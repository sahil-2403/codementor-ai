import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BrainCircuit, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Button from '../common/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const learnerLinks = [
  ['Dashboard', '/dashboard'], ['Roadmap', '/roadmap'], ['Projects', '/projects'], ['Interview', '/interview'], ['Mentor', '/mentor'], ['Progress', '/progress']
];
const adminLinks = [['Content', '/admin'], ['Topics', '/admin/topics'], ['Lessons', '/admin/lessons'], ['Questions', '/admin/questions'], ['Templates', '/admin/templates']];

function NavItem({ label, href, onClick }) {
  return <NavLink onClick={onClick} to={href} className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-bold ${isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</NavLink>;
}

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const learner = user?.role !== 'admin';
  const links = learner ? learnerLinks : adminLinks;

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/login');
  };

  return <header className="sticky top-0 z-50 border-b border-white/40 bg-white/80 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
      <Link to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'} className="flex items-center gap-2 font-black text-slate-950">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white"><BrainCircuit size={20} /></span>
        CodeMentor AI
      </Link>

      {user && <nav className="hidden items-center gap-1 lg:flex">
        {links.map(([label, href]) => <NavItem key={href} label={label} href={href} />)}
      </nav>}

      <div className="flex items-center gap-3">
        {user ? <><span className="hidden text-sm font-bold text-slate-600 md:block">{user.name}</span><Button variant="secondary" onClick={handleLogout}>Logout</Button><button className="rounded-2xl border border-slate-200 bg-white p-2 lg:hidden" onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button></> : <><Link to="/login"><Button variant="ghost">Login</Button></Link><Link to="/register"><Button>Start</Button></Link></>}
      </div>
    </div>
    {user && mobileOpen && <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
      <div className="mx-auto grid max-w-7xl gap-2">
        {links.map(([label, href]) => <NavItem key={href} label={label} href={href} onClick={() => setMobileOpen(false)} />)}
      </div>
    </div>}
  </header>;
}
