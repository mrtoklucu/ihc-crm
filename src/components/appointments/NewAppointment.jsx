import React, { useState, useContext } from 'react';
import { AppointmentContext } from '../../context/AppointmentContext';
import { AppContext } from '../../context/AppContext';
import { Calendar, Clock, User, FileText, PlusCircle, UserPlus, Tag } from 'lucide-react';

const NewAppointment = () => {
  const { addAppointment } = useContext(AppointmentContext);
  const { leads, users } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leadId: '',
    consultantId: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    type: 'physical', // physical, online, follow-up
    note: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await addAppointment(formData);
    if (success) {
      alert('Randevu başarıyla oluşturuldu!');
      setFormData({ 
        leadId: '', 
        consultantId: '', 
        date: new Date().toISOString().split('T')[0], 
        time: '10:00', 
        type: 'physical', 
        note: '' 
      });
    }
    setLoading(false);
  };

  const types = [
    { id: 'physical', label: 'Ön Muayene (Fiziksel)' },
    { id: 'online', label: 'Online Görüşme' },
    { id: 'surgery', label: 'Operasyon' },
    { id: 'follow-up', label: 'Kontrol (Follow-up)' },
    { id: 'other', label: 'Diğer' }
  ];

  return (
    <div className="admin-section" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="admin-section-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <PlusCircle size={24} color="var(--accent-color)" />
          Yeni Randevu Kaydı
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> Hasta / Lead Seçimi
            </label>
            <select
              required
              className="form-input"
              value={formData.leadId}
              onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
            >
              <option value="">Lütfen seçim yapın...</option>
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>{lead.nameSurname}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={14} /> Danışman / Doktor
            </label>
            <select
              required
              className="form-input"
              value={formData.consultantId}
              onChange={(e) => setFormData({ ...formData, consultantId: e.target.value })}
            >
              <option value="">Lütfen seçim yapın...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Tarih
            </label>
            <input
              required
              type="date"
              className="form-input"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> Saat
            </label>
            <input
              required
              type="time"
              className="form-input"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={14} /> Randevu Türü
            </label>
            <select
              className="form-input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {types.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} /> Ek Notlar
          </label>
          <textarea
            className="form-input"
            style={{ height: '100px' }}
            placeholder="Randevu içeriğine dair detaylı notlar..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          ></textarea>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 700 }}>
          {loading ? 'Yükleniyor...' : 'Randevuyu Onayla'}
        </button>
      </form>
    </div>
  );
};

export default NewAppointment;
