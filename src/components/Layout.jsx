import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import { AppContext } from '../context/AppContext';
import { initPushNotifications } from '../utils/pushNotifications';

const VERSION_TIMESTAMP = 1774523280000;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Sayfa Hatası:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', margin: '20px' }}>
          <h2 style={{ color: '#ef4444' }}>Sayfa Yüklenemedi</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Bu sayfa oluşturulurken bir hata oluştu. Lütfen yenileyiniz.</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Sayfayı Yenile</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const VersionBanner = () => {
  const [hasNewVersion, setHasNewVersion] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.version > VERSION_TIMESTAMP) {
          setHasNewVersion(true);
        }
      } catch (err) {
        // Silently fail if fetch fails
      }
    };

    const intervalId = setInterval(checkVersion, 300000); // Check every 5 mins
    
    // Also check when page becomes visible
    document.addEventListener('visibilitychange', () => {
       if (document.visibilityState === 'visible') checkVersion();
    });

    return () => {
        clearInterval(intervalId);
    };
  }, []);

  if (!hasNewVersion) return null;

  return (
    <div style={{ 
      position: 'fixed', top: '15px', left: '50%', transform: 'translateX(-50%)', 
      zIndex: 100000, display: 'flex', alignItems: 'center', gap: '12px',
      backgroundColor: '#6366f1', color: 'white', padding: '10px 20px', 
      borderRadius: '50px', boxShadow: '0 8px 30px rgba(99, 102, 241, 0.5)',
      animation: 'bannerSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      border: '1px solid rgba(255,255,255,0.2)',
      fontWeight: 600, fontSize: '14px'
    }}>
      <style>{`
        @keyframes bannerSlideIn {
          from { transform: translate(-50%, -100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
      <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🚀</div>
      <span>Yeni bir güncelleme mevcut! En son iyileştirmelere sahip olmak için lütfen yenileyin.</span>
      <button 
        onClick={() => { localStorage.clear(); window.location.reload(); }} 
        className="btn" 
        style={{ backgroundColor: 'white', color: '#6366f1', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 800, border: 'none' }}
      >
        Şimdi Yenile
      </button>
    </div>
  );
};

const Layout = () => {
  const { billingWarning, currentUser, tenantSlug, emailVerified, sendVerificationEmail } = React.useContext(AppContext);
  const [verifySent, setVerifySent] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Mobil uygulamada cihazi bildirimlere kaydeder; tarayicida etkisizdir.
  useEffect(() => {
    initPushNotifications({
      tenantSlug,
      userId: currentUser?.id,
      onOpenLead: (leadId) => navigate(`/leads/${leadId}`),
    });
  }, [tenantSlug, currentUser?.id, navigate]);

  return (
    <div className="container">
      <VersionBanner />
      <div className="content-area">
        <Header />
        
        {/* Dogrulanmamis adres girisi engellemiyor; yalnizca hatirlatiliyor. */}
        {currentUser && !emailVerified && (
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '10px 16px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <span>E-posta adresiniz doğrulanmadı.</span>
            {verifySent ? (
              <strong>Doğrulama e-postası gönderildi, gelen kutunuzu kontrol edin.</strong>
            ) : (
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }}
                onClick={async () => { if (await sendVerificationEmail()) setVerifySent(true); }}
              >
                Doğrulama e-postası gönder
              </button>
            )}
          </div>
        )}

        {billingWarning && (
          <div style={{ 
            backgroundColor: '#ef4444', 
            color: '#fff', 
            textAlign: 'center', 
            padding: '12px', 
            fontWeight: 800, 
            fontSize: '14px',
            animation: 'pulse 2s infinite',
            letterSpacing: '1px',
            zIndex: 100
          }}>
            ⚠️ CRM HİZMETİNİZİN SÜRESİ DOLMUŞTUR. LÜTFEN ÖDEME YAPINIZ!
          </div>
        )}

        <main className="main-content">
          <div className="page-inner-container">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { background-color: #ef4444; }
          50% { background-color: #991b1b; }
          100% { background-color: #ef4444; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
