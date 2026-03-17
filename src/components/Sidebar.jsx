import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, UserPlus, ListOrdered, Shield, LayoutDashboard } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const Sidebar = () => {
  const { currentUser } = useContext(AppContext);
  const location = useLocation();

  const isDesktopVisible = (path) => {
    if (path === '/') return true; // Everyone can see Analiz
    if (path === '/new-lead' && currentUser.level >= 4) return true;
    if (path === '/leads' && currentUser.level >= 2) return true;
    if (path === '/users' && currentUser.level === 5) return true;
    return false;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">ISTANBUL HAIR CENTER</h2>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>CRM System</div>
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

        {isDesktopVisible('/users') && (
          <NavLink to="/users" className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}>
            <Shield size={20} />
            <span>Yetkilendirme</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
