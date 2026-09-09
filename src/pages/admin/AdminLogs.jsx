import React, { useContext, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';

const AdminLogs = () => {
  const { adminLogs, loadingLogs, clearAdminLogs } = useContext(AdminContext);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const actionTypes = [
    { key: 'all', label: 'Tümü', icon: '📋' },
    { key: 'login', label: 'Giriş/Çıkış', icon: '🔐' },
    { key: 'tenant', label: 'Firma İşlemleri', icon: '🏢' },
    { key: 'ticket', label: 'Destek Talepleri', icon: '💬' },
    { key: 'billing', label: 'Faturalandırma', icon: '💳' },
    { key: 'system', label: 'Sistem', icon: '⚙️' },
  ];

  const getActionColor = (action) => {
    if (action.includes('Giriş')) return '#22c55e';
    if (action.includes('Çıkış')) return '#ef4444';
    if (action.includes('Firma') || action.includes('Tenant')) return '#6366f1';
    if (action.includes('Ticket') || action.includes('Destek')) return '#8b5cf6';
    if (action.includes('Fatura') || action.includes('Billing')) return '#f59e0b';
    if (action.includes('Silme') || action.includes('Temizle')) return '#ef4444';
    return '#3b82f6';
  };

  const getActionIcon = (action) => {
    if (action.includes('Giriş')) return '🔓';
    if (action.includes('Çıkış')) return '🔒';
    if (action.includes('Ekleme') || action.includes('Oluştur')) return '➕';
    if (action.includes('Silme') || action.includes('Temizle')) return '🗑️';
    if (action.includes('Güncelle') || action.includes('Düzenle')) return '✏️';
    if (action.includes('Firma')) return '🏢';
    if (action.includes('Ticket') || action.includes('Destek')) return '💬';
    if (action.includes('Askıya') || action.includes('Aktif')) return '🔄';
    return '📝';
  };

  const filteredLogs = (adminLogs || []).filter(log => {
    const matchesFilter = filter === 'all' || (log.category || '').toLowerCase() === filter;
    const matchesSearch = !searchTerm || 
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.detail || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleClear = async () => {
    if (window.confirm('Tüm admin loglarını temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      await clearAdminLogs();
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1>İşlem Logları</h1>
        <p>Süper Admin panelindeki tüm işlemlerin kaydı</p>
      </div>

      {/* Filtreler */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
          {actionTypes.map(type => (
            <button
              key={type.key}
              onClick={() => setFilter(type.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: filter === type.key ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                backgroundColor: filter === type.key ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                color: filter === type.key ? '#a5b4fc' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleClear}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            color: '#f87171',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🗑️ Logları Temizle
        </button>
      </div>

      {/* Arama */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Log ara... (işlem, detay)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(255,255,255,0.03)',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {/* İstatistikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#a5b4fc' }}>{(adminLogs || []).length}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Toplam Log</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.15)', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#86efac' }}>{(adminLogs || []).filter(l => l.category === 'login').length}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Giriş/Çıkış</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#c4b5fd' }}>{(adminLogs || []).filter(l => l.category === 'tenant').length}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Firma İşlemi</div>
        </div>
        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#fcd34d' }}>{(adminLogs || []).filter(l => l.category === 'ticket').length}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Destek İşlemi</div>
        </div>
      </div>

      {/* Log Listesi */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📋</span> 
            İşlem Geçmişi
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>({filteredLogs.length} kayıt)</span>
          </h2>
        </div>

        {loadingLogs ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="admin-login-spinner" style={{ margin: '0 auto', width: '32px', height: '32px', borderColor: 'rgba(99, 102, 241, 0.3)', borderTopColor: '#6366f1' }}></div>
            <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loglar yükleniyor...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ color: 'white', marginBottom: '8px' }}>Log kaydı bulunamadı</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              {filter !== 'all' ? 'Bu kategoriye ait log kaydı yok.' : 'Henüz işlem kaydı oluşturulmamış.'}
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '0 4px' }}>
            {filteredLogs.map((log, index) => (
              <div
                key={log.id || index}
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  alignItems: 'flex-start',
                  transition: 'background 0.15s',
                  borderRadius: '8px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* Icon */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: `${getActionColor(log.action)}15`,
                  border: `1px solid ${getActionColor(log.action)}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0
                }}>
                  {getActionIcon(log.action)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: 'white', fontSize: '14px' }}>{log.action}</span>
                    {log.category && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: `${getActionColor(log.action)}15`,
                        color: getActionColor(log.action),
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: 600
                      }}>
                        {log.category}
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>{log.detail}</p>
                </div>

                {/* Timestamp */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {new Date(log.date).toLocaleDateString('tr-TR')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                    {new Date(log.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
