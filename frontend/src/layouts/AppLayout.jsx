import { NavLink, Outlet } from 'react-router-dom';
import { Activity, ClipboardCheck, ClipboardList, LayoutDashboard, LogOut, ScanLine, Store, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const links = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/stores', label: 'Stores', icon: Store },
    { to: '/audits', label: 'Shelf audits', icon: Activity },
    { to: '/findings', label: 'Findings', icon: ClipboardCheck },
    { to: '/tasks', label: 'Tasks', icon: ClipboardList },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand-lockup" href="/dashboard"><span className="brand-mark"><ScanLine size={19} strokeWidth={2.2} /></span><span><strong>ShelfSight</strong><small>RETAIL INTELLIGENCE</small></span></a>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}
          <button className="nav-link mobile-logout" onClick={logout}><LogOut size={18} /><span>Log out</span></button>
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}><UserRound size={18} /><span>Profile</span></NavLink>
          <div className="sidebar-user"><span className="user-avatar">{(user?.fullName || 'U').slice(0, 1).toUpperCase()}</span><span className="user-copy"><strong>{user?.fullName || 'User'}</strong><small>{user?.role || 'TEAM MEMBER'}</small></span><button className="logout-button" onClick={logout}><LogOut size={16} /><span>Log out</span></button></div>
        </div>
      </aside>
      <main className="main-area"><header className="topbar"><span>Store operations</span><span className="topbar-date">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span></header><div className="main-content"><Outlet /></div></main>
    </div>
  );
}
