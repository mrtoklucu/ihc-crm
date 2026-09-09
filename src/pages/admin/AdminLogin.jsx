import React, { useState, useContext } from 'react';
import PasswordInput from '../../components/PasswordInput';
import { AdminContext } from '../../context/AdminContext';
import zbtLogo from '../../assets/zbt_media_beyaz_logo.webp';

const AdminLogin = () => {
  const { adminLogin } = useContext(AdminContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simulate brief loading
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const success = await adminLogin(email, password);
    if (!success) {
      setError('Hatalı e-posta veya şifre.');
    }
    setIsLoading(false);
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-bg-effects">
        <div className="admin-login-orb admin-login-orb-1"></div>
        <div className="admin-login-orb admin-login-orb-2"></div>
        <div className="admin-login-orb admin-login-orb-3"></div>
      </div>

      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1>ZBT CRM System</h1>
          <p>Yönetim Paneli Girişi</p>
        </div>

        {error && (
          <div className="admin-login-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="admin-form-group">
            <label className="admin-form-label">E-posta Adresi</label>
            <div className="admin-input-wrapper">
              <svg className="admin-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="E-posta"
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Şifre</label>
            <div className="admin-input-wrapper">
              <svg className="admin-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="admin-form-input"
              />
            </div>
          </div>

          <button type="submit" className="admin-login-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="admin-login-spinner"></span>
            ) : (
              <>
                Giriş Yap
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="admin-login-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px', lineHeight: '1.5' }}>
            © {new Date().getFullYear()} ZBT CRM Systems. All rights reserved.<br/>
            This is a private B2B internal application for authorized personnel only. 
            Unauthorized access is strictly prohibited.
          </p>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px' }}>powered by</span>
          <img src={zbtLogo} alt="ZBT Media Logo" style={{ height: '24px', opacity: 0.8 }} />
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
