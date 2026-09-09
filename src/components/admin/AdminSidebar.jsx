import React, { useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { I18nContext } from '../../context/I18nContext';
import zbtLogo from '../../assets/zbt_media_beyaz_logo.webp';

const AdminSidebar = ({ activePage, onNavigate, isOpen }) => {
  const { adminUser, adminLogout, tenants } = useContext(AdminContext);
  const { t } = useContext(I18nContext);

  const allMenuItems = [
    { 
      id: 'dashboard', 
      label: t('dashboard'), 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
      roles: ['superadmin']
    },
    { 
      id: 'tenants', 
      label: t('tenants'), 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      badge: tenants.length,
      roles: ['superadmin']
    },
    { 
      id: 'tickets', 
      label: t('tickets'), 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      ),
      roles: ['superadmin', 'support']
    },
    { 
      id: 'billing', 
      label: 'Faturalandırma', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      ),
      roles: ['superadmin', 'muhasebe']
    },
    { 
      id: 'users', 
      label: 'Kullanıcılar', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      roles: ['superadmin']
    },
    { 
      id: 'logs', 
      label: 'Sistem Logları', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      roles: ['superadmin']
    },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(adminUser?.role));

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-logo">
          <div className="admin-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <span className="admin-sidebar-title">ZBT CRM</span>
            <span className="admin-sidebar-subtitle">{t('management')}</span>
          </div>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`admin-sidebar-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="admin-sidebar-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button className="admin-sidebar-item admin-sidebar-logout" onClick={adminLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>{t('logout')}</span>
        </button>
        <div className="admin-sidebar-branding">
          <img src={zbtLogo} alt="ZBT Media" />
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
