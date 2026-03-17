import React, { useContext } from 'react';
import { LogOut } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const Header = () => {
  const { currentUser, logout } = useContext(AppContext);

  if (!currentUser) return null;

  return (
    <header className="topbar">
      <div>
        <span style={{ color: 'var(--text-secondary)' }}>Hoş Geldiniz, </span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser.name}</span>
      </div>

      <div className="user-info">
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{currentUser.role}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Seviye {currentUser.level}</span>
        </div>
        <div className="user-avatar">
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
        <button 
          onClick={logout} 
          className="btn btn-secondary btn-sm"
          style={{ marginLeft: '12px' }}
        >
          <LogOut size={16} />
          Çıkış
        </button>
      </div>
    </header>
  );
};

export default Header;
