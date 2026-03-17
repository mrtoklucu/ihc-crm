import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ClipboardList, Search, Clock, User } from 'lucide-react';

const Logs = () => {
  const { currentUser, logs } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');

  // Sadece Yetki 5 (Admin) görebilir
  if (currentUser.level !== 5) {
    return (
      <div className="card">
        <h1 className="page-title">Yetki Hatası</h1>
        <p>Bu bölümü sadece sistem yöneticileri görüntüleyebilir.</p>
      </div>
    );
  }

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.detail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('tr-TR')} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Sistem İşlem Günlükleri (Log)</h1>
        <div className="search-box" style={{ width: '300px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="İşlem veya kullanıcı ara..." 
            style={{ paddingLeft: '36px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '16px' }}>Tarih / Saat</th>
              <th style={{ textAlign: 'left', padding: '16px' }}>Kullanıcı</th>
              <th style={{ textAlign: 'left', padding: '16px' }}>İşlem Türü</th>
              <th style={{ textAlign: 'left', padding: '16px' }}>Detay</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <tr key={log.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> {formatDate(log.date)}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <User size={14} className="text-secondary" /> {log.user}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge ${
                      log.action.includes('Silme') ? 'badge-danger' : 
                      log.action.includes('Ekle') ? 'badge-success' : 
                      log.action.includes('Giriş') ? 'badge-primary' : ''
                    }`} style={{ 
                      backgroundColor: log.action.includes('Silme') ? 'rgba(239, 68, 68, 0.1)' : undefined,
                      color: log.action.includes('Silme') ? 'var(--error)' : undefined
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-primary)' }}>
                    {log.detail}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Henüz bir işlem kaydı bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Logs;
