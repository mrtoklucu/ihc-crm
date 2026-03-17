import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, UserPlus, ListOrdered, Shield, LayoutDashboard, User, ClipboardList, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import logoImg from '../assets/ihc_logo.webp';
import zbtLogo from '../assets/zbt_media_beyaz_logo.webp';

const Sidebar = () => {
  const { currentUser, checkPermission } = useContext(AppContext);
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const isDesktopVisible = (path) => {
    if (path === '/') return checkPermission('viewDashboard');
    if (path === '/new-lead') return checkPermission('addLead');
    if (path === '/leads') return checkPermission('viewLeads');
    if (path === '/profile') return checkPermission('editProfile');
    if (path === '/users') return checkPermission('manageUsers');
    if (path === '/logs') return checkPermission('viewLogs');
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
      </nav>

      <div style={{ marginTop: 'auto', padding: '16px 0' }}>
        {isDesktopVisible('/profile') && (
          <NavLink to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
            <User size={20} />
            <span>Profilim</span>
          </NavLink>
        )}

        {(isDesktopVisible('/users') || isDesktopVisible('/logs')) && (
          <>
            <div 
              className={`nav-link`} 
              style={{ cursor: 'pointer', justifyContent: 'space-between' }} 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Settings size={20} />
                <span>Ayarlar</span>
              </div>
              {isSettingsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {isSettingsOpen && (
              <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                {isDesktopVisible('/users') && (
                  <NavLink to="/users" className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`} style={{ fontSize: '13px', padding: '10px 24px' }}>
                    <Shield size={16} />
                    <span>Yetkilendirme</span>
                  </NavLink>
                )}
                {isDesktopVisible('/logs') && (
                  <NavLink to="/logs" className={`nav-link ${location.pathname === '/logs' ? 'active' : ''}`} style={{ fontSize: '13px', padding: '10px 24px' }}>
                    <ClipboardList size={16} />
                    <span>Log Geçmişi</span>
                  </NavLink>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ padding: '24px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>made by</span>
        <img src={zbtLogo} alt="ZBT Media Logo" style={{ height: '20px', opacity: 0.6 }} />
      </div>
    </aside>
  );
};

export default Sidebar;
