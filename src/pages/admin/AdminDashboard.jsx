import React, { useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { getTenantLeadCount, getTenantUserCount } from '../../utils/tenantUtils';
import { tenantDomain } from '../../config/appConfig';

const AdminDashboard = () => {
  const { tenants, loadingTenants, getStats, supportTickets, clearTenantLogs, clearTenantTickets } = useContext(AdminContext);
  const stats = loadingTenants ? { totalTenants: 0, activeTenants: 0, suspendedTenants: 0, totalLeads: 0, totalUsers: 0, trialTenants: 0 } : getStats();

  const statCards = [
    { label: 'Toplam Firma', value: stats.totalTenants, icon: '🏢', color: '#6366f1' },
    { label: 'Aktif Firma', value: stats.activeTenants, icon: '✅', color: '#22c55e' },
    { label: 'Askıda', value: stats.suspendedTenants, icon: '⏸️', color: '#f59e0b' },
    { label: 'Toplam Lead', value: stats.totalLeads, icon: '👥', color: '#3b82f6' },
    { label: 'Toplam Kullanıcı', value: stats.totalUsers, icon: '🔑', color: '#ec4899' },
    { label: 'Deneme', value: stats.trialTenants, icon: '🧪', color: '#8b5cf6' },
  ];

  // Utility to format bytes into human-readable units
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper to calculate itemized storage
  const calculateItemizedStorage = (tenant) => {
    const leadCount = getTenantLeadCount(tenant);
    const userCount = getTenantUserCount(tenant);
    const logCount = (leadCount * 50) + 100;

    // Item 1: Lead Data (Leads + Users) - PROTECTED
    const leadBytes = (leadCount * 1536) + (userCount * 2048);
    
    // Item 2: Support Tickets (Attachments + Messages) - CLEARABLE
    let ticketBytes = 0;
    const tenantTickets = supportTickets.filter(t => t.tenantSlug === tenant.slug);
    tenantTickets.forEach(ticket => {
      ticketBytes += 1024; // Base ticket metadata
      (ticket.messages || []).forEach(msg => {
        ticketBytes += 512; // Message metadata
        if (msg.attachment && msg.attachment.size) {
          ticketBytes += msg.attachment.size;
        } else if (msg.attachment) {
          ticketBytes += 256000;
        }
      });
    });

    // Item 3: System Logs - CLEARABLE
    const logBytes = (logCount * 1024);

    // Item 4: System Base (Hardcoded estimate)
    const baseBytes = 5 * 1024 * 1024; // 5MB static assets

    return {
      lead: leadBytes,
      tickets: ticketBytes,
      logs: logBytes,
      base: baseBytes,
      total: leadBytes + ticketBytes + logBytes + baseBytes
    };
  };

  const handleClearLogs = async (slug) => {
    if (window.confirm("Bu firmanın tüm işlem loglarını (geçmiş hareketlerini) temizlemek istediğinizden emin misiniz?")) {
      const res = await clearTenantLogs(slug);
      if (res.success) alert("Loglar temizlendi.");
    }
  };

  const handleClearTickets = async (slug) => {
    if (window.confirm("Bu firmanın tüm destek taleplerini ve görsellerini silmek istediğinizden emin misiniz?")) {
      const res = await clearTenantTickets(slug);
      if (res.success) alert("Destek kayıtları temizlendi.");
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>CRM sistemlerinin genel durumu ve altyapı tüketimi</p>
      </div>

      <div className="admin-stats-grid">
        {statCards.map((stat, index) => (
          <div className="admin-stat-card" key={index} style={{ '--accent-color': stat.color }}>
            <div className="admin-stat-icon">{stat.icon}</div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">{loadingTenants ? '...' : stat.value}</span>
              <span className="admin-stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-section" style={{ marginBottom: '32px' }}>
        <div className="admin-section-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📊</span> Madde Madde Depolama Analizi & Bakım
          </h2>
        </div>
        {!loadingTenants && tenants.length > 0 && (
          <div className="admin-chart-container" style={{ padding: '24px' }}>
            {tenants.sort((a,b) => calculateItemizedStorage(b).total - calculateItemizedStorage(a).total).slice(0, 5).map(tenant => {
              const storage = calculateItemizedStorage(tenant);
              
              return (
                <div key={tenant.id} style={{ marginBottom: '32px', backgroundColor: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div className="admin-tenant-avatar" style={{ backgroundColor: tenant.primaryColor || '#6366f1', width: '24px', height: '24px', fontSize: '11px' }}>
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{tenant.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '16px' }}>{formatSize(storage.total)}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleClearLogs(tenant.slug)} className="admin-btn admin-btn-sm admin-btn-ghost" style={{ fontSize: '10px', padding: '4px 8px' }}>Logları Temizle</button>
                        <button onClick={() => handleClearTickets(tenant.slug)} className="admin-btn admin-btn-sm admin-btn-ghost" style={{ fontSize: '10px', padding: '4px 8px' }}>Chat Kayıtlarını Sil</button>
                      </div>
                    </div>
                  </div>

                  <div className="admin-progress-bar" style={{ height: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', overflow: 'hidden' }}>
                    <div title={`Lead Verileri: ${formatSize(storage.lead)}`} style={{ width: `${(storage.lead / storage.total) * 100}%`, background: '#3b82f6', height: '100%' }}></div>
                    <div title={`Destek Chat: ${formatSize(storage.tickets)}`} style={{ width: `${(storage.tickets / storage.total) * 100}%`, background: '#8b5cf6', height: '100%' }}></div>
                    <div title={`Sistem Logları: ${formatSize(storage.logs)}`} style={{ width: `${(storage.logs / storage.total) * 100}%`, background: '#f59e0b', height: '100%' }}></div>
                    <div title={`Sistem Çekirdeği: ${formatSize(storage.base)}`} style={{ width: `${(storage.base / storage.total) * 100}%`, background: '#64748b', height: '100%' }}></div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '11px', color: '#94a3b8', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '2px' }}></div> Lead Verileri (Kayıtlı) 🔒</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', background: '#8b5cf6', borderRadius: '2px' }}></div> Destek Mesaj / Görsel 🗑️</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '2px' }}></div> Sistem Logları 🗑️</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', background: '#64748b', borderRadius: '2px' }}></div> Sistem Temel 🛡️</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Firmalar</h2>
        </div>

        {loadingTenants ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="admin-login-spinner" style={{ margin: '0 auto', width: '32px', height: '32px', borderColor: 'rgba(99, 102, 241, 0.3)', borderTopColor: '#6366f1' }}></div>
            <p style={{ marginTop: '16px', color: '#94a3b8' }}>Veriler çekiliyor...</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">🏢</div>
            <h3>Henüz firma eklenmedi</h3>
            <p>Sol menüden "Firma Yönetimi" sekmesine giderek yeni firma ekleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="admin-tenant-table-wrapper">
            <table className="admin-tenant-table">
              <thead>
                <tr>
                  <th>Firma Adı</th>
                  <th>Subdomain</th>
                  <th>Durum</th>
                  <th>Lead</th>
                  <th>Kullanıcı</th>
                  <th>Oluşturulma</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(tenant => {
                  const leadCount = getTenantLeadCount(tenant);
                  const userCount = getTenantUserCount(tenant);
                  return (
                    <tr key={tenant.id}>
                      <td>
                        <div className="admin-tenant-name">
                          <div className="admin-tenant-avatar" style={{ backgroundColor: tenant.primaryColor || '#6366f1' }}>
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                          {tenant.name}
                        </div>
                      </td>
                      <td>
                        <code className="admin-subdomain-badge">{tenantDomain(tenant.slug)}</code>
                      </td>
                      <td>
                        <span className={`admin-status-badge admin-status-${tenant.status}`}>
                          {tenant.status === 'active' ? 'Aktif' : tenant.status === 'suspended' ? 'Askıda' : 'Deneme'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-limit-display">
                          <span>{leadCount}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-limit-display">
                          <span>{userCount}</span>
                          <span className="admin-limit-separator">/</span>
                          <span className="admin-limit-max">{tenant.maxUsers}</span>
                        </div>
                      </td>
                      <td className="admin-date-cell">
                        {new Date(tenant.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
