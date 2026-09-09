import React, { useContext, useState, useEffect } from 'react';
import { AdminContext } from './context/AdminContext';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import TenantManagement from './pages/admin/TenantManagement';
import AdminTickets from './pages/admin/AdminTickets';
import Billing from './pages/admin/Billing';
import AdminSidebar from './components/admin/AdminSidebar';
import AdminHeader from './components/admin/AdminHeader';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLogs from './pages/admin/AdminLogs';
import './admin.css';

const VERSION_TIMESTAMP = 1774523280000;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Admin Sayfa Hatası:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', margin: '20px' }}>
          <h2 style={{ color: '#ef4444' }}>Sayfa Hatası</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Admin paneli sayfası yüklenemedi. Lütfen yenileyiniz.</p>
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
      } catch (err) { }
    };

    const intervalId = setInterval(checkVersion, 300000);
    document.addEventListener('visibilitychange', () => {
       if (document.visibilityState === 'visible') checkVersion();
    });
    return () => clearInterval(intervalId);
  }, []);

  if (!hasNewVersion) return null;

  return (
    <div style={{ 
      position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', 
      zIndex: 100000, display: 'flex', alignItems: 'center', gap: '15px',
      backgroundColor: '#1877f2', color: 'white', padding: '12px 24px', 
      borderRadius: '50px', boxShadow: '0 10px 40px rgba(24, 119, 242, 0.5)',
      animation: 'bannerSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      fontWeight: 600, fontSize: '14px'
    }}>
      <style>{`@keyframes bannerSlideIn { from { transform: translate(-50%, -100px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }`}</style>
      <span>🚀 Panel için yeni bir güncelleme mevcut!</span>
      <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="btn" style={{ backgroundColor: 'white', color: '#1877f2', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 800, border: 'none' }}>Şimdi Yenile</button>
    </div>
  );
};

const AdminApp = () => {
  const { adminUser } = useContext(AdminContext);
  
  // Set default page based on role
  const getDefaultPage = () => {
    if (adminUser?.role === 'support') return 'tickets';
    if (adminUser?.role === 'muhasebe') return 'billing';
    return 'dashboard';
  };

  const [activePage, setActivePage] = useState(getDefaultPage());
  // Mobilde sidebar cekmece olarak acilir.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!adminUser) {
    return <AdminLogin />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'tenants':
        return <TenantManagement />;
      case 'tickets':
        return <AdminTickets />;
      case 'billing':
        return <Billing />;
      case 'users':
        return <AdminUsers />;
      case 'logs':
        return <AdminLogs />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="admin-layout">
      <VersionBanner />
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <AdminSidebar
        activePage={activePage}
        isOpen={sidebarOpen}
        onNavigate={(page) => { setActivePage(page); setSidebarOpen(false); }}
      />
      <div className="admin-main">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="admin-content">
          <ErrorBoundary key={activePage}>
            {renderPage()}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default AdminApp;
