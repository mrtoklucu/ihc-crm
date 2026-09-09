import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { getTenantSlug, isAdminPanel, getTenantBySlug, getRememberedTenantSlug, rememberTenantSlug } from './utils/tenantUtils';
import AppCodeGate from './components/AppCodeGate.jsx';
import { APP_DOMAIN } from './config/appConfig';
import App from './App.jsx';
import AdminApp from './AdminApp.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { AdminProvider } from './context/AdminContext.jsx';
import { I18nProvider } from './context/I18nContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css';
import { FinanceProvider } from './context/FinanceContext.jsx';
import { AppointmentProvider } from './context/AppointmentContext.jsx';

const TenantGateway = () => {
  const [status, setStatus] = useState({ loading: true, error: null, tenant: null, runtimeError: null });

  // Native uygulamada subdomain yoktur; firma, girilen erisim koduyla
  // bir kez cozulur ve cihazda saklanir.
  const isNative = Capacitor.isNativePlatform();
  const [appSlug, setAppSlug] = useState(() => (isNative ? getRememberedTenantSlug() : null));

  const authDomain = isNative ? false : isAdminPanel();
  const slug = isNative ? appSlug : getTenantSlug();

  // Runtime error boundary equivalent for window-level crashes
  useEffect(() => {
    const handleError = (event) => {
      const msg = event.message || (event.error && event.error.message) || "";
      if (msg.toLowerCase().includes('loading chunk') || msg.toLowerCase().includes('css_chunk_load_failed')) {
        window.location.reload();
        return;
      }
      console.error("Kritik Çalışma Zamanı Hatası:", event.error);
      setStatus(prev => ({ ...prev, runtimeError: event.error?.message || "Bilinmeyen bir hata oluştu." }));
    };

    const handleRejection = (event) => {
      const msg = event.reason?.message || event.reason?.toString() || "";
      if (msg.toLowerCase().includes('loading chunk') || msg.toLowerCase().includes('css_chunk_load_failed')) {
        window.location.reload();
      }
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchTenant = async () => {
      if (authDomain) {
        if (isMounted) setStatus({ loading: false, error: null, tenant: null });
        return;
      }

      // Kod henuz girilmemis: yukleme ekraninda beklemek yerine kod ekranini goster.
      if (isNative && !appSlug) {
        if (isMounted) setStatus({ loading: false, error: null, tenant: null });
        return;
      }
      
      try {
        const foundTenant = await getTenantBySlug(slug);
        if (isMounted) setStatus({ loading: false, error: null, tenant: foundTenant });
      } catch (error) {
        console.error("Firma bilgileri çekilirken hata oluştu:", error);
        if (isMounted) setStatus({ loading: false, error: error.message, tenant: null });
      }
    };

    fetchTenant();
    return () => { isMounted = false; };
  }, [authDomain, slug, isNative, appSlug]);

  if (status.runtimeError) {
    return (
      <div className="tenant-not-found">
        <div className="tenant-not-found-card" style={{ borderColor: 'var(--error)' }}>
          <h1 style={{ color: 'var(--error)' }}>Yazılım Hatası (Crash)</h1>
          <p>Uygulama çalışırken beklenmedik bir hata ile karşılaştı:</p>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '8px', fontSize: '12px', textAlign: 'left', marginBottom: '20px' }}>
            {status.runtimeError}
          </div>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="btn btn-primary">Verileri Temizle ve Yeniden Dene</button>
        </div>
      </div>
    );
  }

  if (status.loading) {
    return (
      <div className="global-loader" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '20px' }}>
        {status.tenant?.logo && (
          <img 
            src={status.tenant.logo} 
            alt="Logo" 
            style={{ height: '60px', marginBottom: '10px', animation: 'loadPulse 2s infinite ease-in-out' }} 
          />
        )}
        <div className="admin-login-spinner" style={{ width: '40px', height: '40px', borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-color)' }}></div>
        <style>{`
          @keyframes loadPulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="tenant-not-found">
        <div className="tenant-not-found-card">
          <h1>Sistem Hatası</h1>
          <p>Veritabanı bağlantısı kurulamadı: {status.error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '20px' }}>Yeniden Dene</button>
        </div>
      </div>
    );
  }

  // Native uygulamada firma kodu girilmemisse once onu iste.
  if (isNative && !appSlug) {
    return (
      <ThemeProvider>
        <AppCodeGate
          onResolved={(tenant) => {
            setStatus({ loading: false, error: null, tenant, runtimeError: null });
            setAppSlug(tenant.slug);
          }}
        />
      </ThemeProvider>
    );
  }

  // Admin paneli
  if (authDomain) {
    return (
      <ThemeProvider>
        <AdminProvider>
          <I18nProvider>
            <AdminApp />
          </I18nProvider>
        </AdminProvider>
      </ThemeProvider>
    );
  }

  const { tenant } = status;

  // Native uygulamada kayitli firma artik bulunamiyorsa kullanici kilitlenmesin;
  // kodu temizleyip yeniden girmesine izin ver.
  if (isNative && !tenant) {
    return (
      <ThemeProvider>
        <div className="tenant-not-found">
          <div className="tenant-not-found-card">
            <div className="tenant-not-found-icon">🔍</div>
            <h1>Firma Bulunamadı</h1>
            <p>Daha önce girilen koda ait firma artık erişilebilir değil.</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: '20px' }}
              onClick={() => { rememberTenantSlug(null); setAppSlug(null); }}
            >
              Farklı Kod Gir
            </button>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Tenant CRM
  if (!tenant) {
    return (
      <div className="tenant-not-found">
        <div className="tenant-not-found-card">
          <div className="tenant-not-found-icon">🔍</div>
          <h1>Firma Bulunamadı</h1>
          <p>Şu an bulunduğunuz subdomain (<code>{slug || 'Bilinmeyen'}</code>) ile kayıtlı bir firma bulunamadı.</p>
          <p className="tenant-not-found-hint">Lütfen doğru adresi (örn: {`firmaadi.${APP_DOMAIN}`}) kullandığınızdan emin olun.</p>
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
             <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Eğer Süper Admin iseniz, lütfen ana dizinden giriş yapın:</p>
             <a href={`https://${APP_DOMAIN}`} style={{ color: 'var(--accent-color)', fontWeight: 'bold', textDecoration: 'none' }}>{APP_DOMAIN} →</a>
          </div>
        </div>
      </div>
    );
  }

  if (tenant.status === 'suspended') {
    return (
      <div className="tenant-not-found">
        <div className="tenant-not-found-card">
          <div className="tenant-not-found-icon">⏸️</div>
          <h1>CRM Sistemi Askıya Alındı</h1>
          <p><strong>{tenant.name}</strong> CRM sistemi şu anda askıya alınmış durumda.</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AppProvider tenantSlug={slug} tenantConfig={tenant}>
        <FinanceProvider>
          <AppointmentProvider>
            <I18nProvider>
              <App />
            </I18nProvider>
          </AppointmentProvider>
        </FinanceProvider>
      </AppProvider>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TenantGateway />
  </React.StrictMode>,
);
