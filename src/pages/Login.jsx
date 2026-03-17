import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import bgImg from '../assets/login_page_background.webp';
import logoImg from '../assets/ihc_logo.webp';

const Login = () => {
  const { login } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const success = login(email, password);
    if (!success) {
      setError('Hatalı e-posta veya şifre.');
    }
  };

  return (
    <div className="auth-container" style={{ 
      backgroundImage: `url(${bgImg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 0 }}></div>
      <div className="card" style={{ width: '400px', zIndex: 1, backgroundColor: 'rgba(30, 30, 30, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src={logoImg} alt="Istanbul Hair Center Logo" style={{ height: '70px', objectFit: 'contain', marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>CRM Giriş Paneli</p>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">E-posta Adresi</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ornek@gmail.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Şifre</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
