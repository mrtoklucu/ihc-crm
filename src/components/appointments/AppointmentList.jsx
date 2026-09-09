import React, { useContext, useState } from 'react';
import { AppointmentContext } from '../../context/AppointmentContext';
import { AppContext } from '../../context/AppContext';
import { Calendar, User, Clock, Search, List, CheckCircle, XCircle, MoreVertical } from 'lucide-react';

const AppointmentList = () => {
  const { appointments, loading, updateAppointmentStatus } = useContext(AppointmentContext);
  const { leads, users } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = appointments.filter(app => {
    const lead = leads.find(l => l.id === app.leadId);
    const consultant = users.find(u => u.id === app.consultantId);
    return lead?.nameSurname.toLowerCase().includes(searchTerm.toLowerCase()) || 
           consultant?.name.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a,b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));

  const getStatusBadge = (id, status) => {
    switch(status) {
      case 'scheduled': return <span className="badge badge-warning" style={{ fontSize: '10px' }}>Planlandı</span>;
      case 'completed': return <span className="badge badge-success" style={{ fontSize: '10px' }}>Tamamlandı</span>;
      case 'cancelled': return <span className="badge badge-error" style={{ fontSize: '10px' }}>İptal</span>;
      default: return <span className="badge" style={{ fontSize: '10px' }}>{status}</span>;
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Yükleniyor...</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <List size={24} color="var(--accent-color)" />
          Randevu Kayıtları
        </h2>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', maxWidth: '400px', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '40px' }}
            placeholder="Hasta veya danışman ismi ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-tenant-table-wrapper">
        <table className="admin-tenant-table">
          <thead>
            <tr>
              <th>Hasta</th>
              <th>Danışman</th>
              <th>Tarih & Saat</th>
              <th>Tür</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(app => (
              <tr key={app.id}>
                <td style={{ fontWeight: 600 }}>{leads.find(l => l.id === app.leadId)?.nameSurname || 'Bilinmeyen'}</td>
                <td style={{ fontSize: '13px' }}>{users.find(u => u.id === app.consultantId)?.name || 'Atanmamış'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                    <Calendar size={14} color="var(--accent-color)" /> {new Date(app.date).toLocaleDateString('tr-TR')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: 0.7 }}>
                    <Clock size={12} /> {app.time}
                  </div>
                </td>
                <td style={{ fontSize: '12px', textTransform: 'capitalize' }}>{app.type}</td>
                <td>{getStatusBadge(app.id, app.status)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {app.status === 'scheduled' && (
                      <button 
                        onClick={() => updateAppointmentStatus(app.id, 'completed')} 
                        className="btn btn-secondary btn-sm" 
                        style={{ color: '#10b981', padding: '6px' }}
                        title="Geldi / Tamamlandı"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                    {app.status === 'scheduled' && (
                      <button 
                        onClick={() => updateAppointmentStatus(app.id, 'cancelled')} 
                        className="btn btn-secondary btn-sm" 
                        style={{ color: '#ef4444', padding: '6px' }}
                        title="Randevu İptal"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Kayıtlı randevu bulunamadı.</div>}
      </div>
    </div>
  );
};

export default AppointmentList;
