import React, { useContext, useState } from 'react';
import { AppointmentContext } from '../../context/AppointmentContext';
import { AppContext } from '../../context/AppContext';
import { Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const CalendarView = () => {
  const { appointments, loading } = useContext(AppointmentContext);
  const { leads, users } = useContext(AppContext);
  
  // Group appointments by date
  const grouped = appointments.reduce((acc, app) => {
    if (!acc[app.date]) acc[app.date] = [];
    acc[app.date].push(app);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort((a,b) => new Date(a) - new Date(b));

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Yükleniyor...</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={24} color="var(--accent-color)" />
          Randevu Takvimi (Günlük Akış)
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm"><ChevronLeft size={16} /></button>
          <button className="btn btn-secondary btn-sm"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {dates.map(date => (
          <div key={date} className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>{new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' })}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{grouped[date].length} Randevu</span>
            </div>
            <div style={{ padding: '12px' }}>
              {grouped[date].sort((a,b) => a.time.localeCompare(b.time)).map(app => (
                <div key={app.id} style={{ padding: '10px', borderRadius: '8px', marginBottom: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--accent-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>{app.time}</span>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.6 }}>{app.type}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{leads.find(l => l.id === app.leadId)?.nameSurname || 'Hasta Bilinmiyor'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <User size={10} style={{ display: 'inline-block', verticalAlign: 'middle' }} /> {users.find(u => u.id === app.consultantId)?.name || 'Danışman Belirsiz'}
                  </div>
                  {app.status === 'completed' && <div style={{ fontSize: '10px', color: '#10b981', marginTop: '6px', textAlign: 'right', fontWeight: 700 }}>✓ Tamamlandı</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {dates.length === 0 && <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>Takvime kayıtlı randevu bulunamadı.</div>}
    </div>
  );
};

export default CalendarView;
