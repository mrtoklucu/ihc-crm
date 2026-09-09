import React, { useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { I18nContext } from '../../context/I18nContext';
import { Globe, Menu } from 'lucide-react';

const AdminHeader = ({ onMenuClick }) => {
  const { adminUser } = useContext(AdminContext);
  const { t, currentLang, changeLanguage } = useContext(I18nContext);

  return (
    <header className="admin-header">
      <div className="admin-header-left" style={{ display: 'flex', alignItems: 'center' }}>
        <button className="admin-menu-btn" onClick={onMenuClick} aria-label="Menüyü aç">
          <Menu size={20} />
        </button>
        <h2>{t('welcome')}</h2>
      </div>
      <div className="admin-header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
          <Globe size={16} />
          <select 
            value={currentLang} 
            onChange={(e) => changeLanguage(e.target.value)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'inherit', 
              fontSize: '13px', 
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="tr">TR</option>
            <option value="en">EN</option>
            <option value="de">DE</option>
            <option value="ru">RU</option>
            <option value="fr">FR</option>
            <option value="es">ES</option>
            <option value="ar">AR</option>
          </select>
        </div>
        <div className="admin-header-user">
          <div className="admin-header-avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="admin-header-user-info">
            <span className="admin-header-user-name">{adminUser?.name || 'Admin'}</span>
            <span className="admin-header-user-role">Süper Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
