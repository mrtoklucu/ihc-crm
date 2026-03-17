import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, UserPlus, ListOrdered, Shield, LayoutDashboard, User, ClipboardList } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import logoImg from '../assets/ihc_logo.webp';

const Sidebar = () => {
  const { currentUser } = useContext(AppContext);
  const location = useLocation();

  const isDesktopVisible = (path) => {
    if (path === '/') return true; // Everyone can see Analiz
    if (path === '/new-lead' && currentUser.level >= 4) return true;
    if (path === '/leads' && currentUser.level >= 2) return true;
    if (path === '/profile' && currentUser.level >= 2) return true;
    if (path === '/users' && currentUser.level === 5) return true;
    if (path === '/logs' && currentUser.level === 5) return true;
    return false;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px' }}>
        <img src={logoImg} alt="IHC Logo" style={{ width: '100%', maxWidth: '160px', objectFit: 'contain' }} />
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>CRM System</div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isDesktopVisible('/') && (
          <NavLink to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Analiz Paneli</span>
          </NavLink>
        )}

        {isDesktopVisible('/new-lead') && (
          <NavLink to="/new-lead" className={`nav-link ${location.pathname === '/new-lead' ? 'active' : ''}`}>
            <UserPlus size={20} />
            <span>Yeni Lead</span>
          </NavLink>
        )}
        
        {isDesktopVisible('/leads') && (
          <NavLink to="/leads" className={`nav-link ${location.pathname === '/leads' ? 'active' : ''}`}>
            <ListOrdered size={20} />
            <span>Lead Listesi</span>
          </NavLink>
        )}

        {isDesktopVisible('/profile') && (
          <NavLink to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
            <User size={20} />
            <span>Profilim</span>
          </NavLink>
        )}

        {isDesktopVisible('/users') && (
          <NavLink to="/users" className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}>
            <Shield size={20} />
            <span>Yetkilendirme</span>
          </NavLink>
        )}

        {isDesktopVisible('/logs') && (
          <NavLink to="/logs" className={`nav-link ${location.pathname === '/logs' ? 'active' : ''}`}>
            <ClipboardList size={20} />
            <span>Log Geçmişi</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
