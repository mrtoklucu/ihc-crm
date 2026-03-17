import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, User, Phone, Mail, Globe, Clock, History, FileText, CheckCircle } from 'lucide-react';

const statuses = [
  "Aranmayı Bekliyor", "Aradım, Açmadı", "Aramayı Reddeti", "Başka Bir Klinikle Anlaşmış", 
  "Lokasyon Olumsuz", "Randevu Oluşturuldu", "İletişim Eksik", "Destek Tedavisine Uygun", 
  "Dil Sorunu", "Engelledi/Engelledim", "Fiyatı Pahalı Buldu", "Fotoğraf Alındı, Teklif Verildi", 
  "Fotoğraf Bekleniyor", "İletişim Kurulamıyor", "İleri Tarihte Düşünüyor", "İletişimdeyim", 
  "İletişime Geçiyorum", "İlgisiz", "Randevu İptal Edildi", "Kaporalı Randevu Oluşturuldu", 
  "Mesaj Attım, Bekleniyor", "Operasyona Girdi", "Operasyona Uygun Değil", "Saç Ekimi Düşünmüyor", 
  "Sadece Fiyat Sordu", "Teklif Verildi, Kararsız", "Teklif Verildi, Olumlu", "Teklife Dönüş Yapmadı", 
  "Telesekretere Bağlanıyor", "Yanlış Başvuru", "Yanlış Numara", "Yüzyüze Görüşme", "Tekrar Gelen Lead"
];

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leads, users, currentUser, addLeadHistory, checkPermission } = useContext(AppContext);
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const lead = leads.find(l => l.id === parseInt(id));

  useEffect(() => {
    if (lead && lead.status) {
      setNewStatus(lead.status);
    }
  }, [lead]);

  // Authorization check
  if (!lead) {
    return (
      <div>
        <h1 className="page-title">Hata</h1>
        <div className="card"><p>Lead bulunamadı.</p></div>
      </div>
    );
  }

  // Authorization check
  const isAssignedToMe = lead.assigneeId === currentUser.id;
  const isAuthorized = checkPermission('manageUsers') || checkPermission('assignLead') || (checkPermission('viewLeads') && isAssignedToMe);
  
  if (!isAuthorized) {
    return (
      <div>
        <h1 className="page-title">Yetki Hatası</h1>
        <div className="card"><p>Bu lead detayını görüntülemeye yetkiniz bulunmamaktadır.</p></div>
      </div>
    );
  }

  const canEdit = checkPermission('editLead');

  const assigneeUser = lead.assigneeId ? users.find(u => u.id === lead.assigneeId) : null;

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote && !newStatus) return;
    
    addLeadHistory(lead.id, newNote || 'Durum Güncellendi', newStatus);
    setNewNote('');
    alert('Not eklendi/Durumu güncellendi!');
  };

  const currentStatusIndex = statuses.indexOf(lead.status || 'Aranmayı Bekliyor');
  const progressPercent = Math.max(10, (currentStatusIndex / (statuses.length - 1)) * 100);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/leads')} className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>Müşteri Detay Yöneticisi</h1>
      </div>

      <div className="grid-2">
        {/* Left Column - Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status Progress Bar */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '15px' }}>
              <CheckCircle size={18} color="var(--accent-color)" /> Müşteri Durumu: {lead.status || 'Yeni'}
            </h3>
            <div style={{ width: '100%', backgroundColor: 'var(--bg-color)', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: lead.status === 'İptal' ? 'var(--error)' : lead.status === 'Satış' ? 'var(--success)' : 'var(--accent-color)', transition: 'all 0.3s' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>Yeni Kayıt</span>
              <span>Süreç Tamamlandı</span>
            </div>
          </div>

          {/* Lead Details */}
          <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '18px' }}>
              <User size={20} className="text-secondary" /> Müşteri Profili
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Ad Soyad</span><div style={{ fontSize: '16px', fontWeight: 600 }}>{lead.nameSurname}</div></div>
              
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Telefon</span><div>{lead.phone}</div></div>
                <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}><Mail size={12} style={{ display: 'inline', marginRight: 4 }} />E-posta</span><div>{lead.email || '-'}</div></div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Cinsiyet / Yaş</span>
                  <div>
                    {lead.gender || 'Belirtilmedi'} 
                    {lead.birthDate && ` • ${new Date().getFullYear() - new Date(lead.birthDate).getFullYear()} Yaş (${new Date(lead.birthDate).toLocaleDateString('tr-TR')})`}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                  <Globe size={12} style={{ display: 'inline', marginRight: 4 }} />Ülke / Kaynak
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {lead.countryCode && (
                    <img 
                      src={`https://flagcdn.com/w40/${lead.countryCode}.png`} 
                      alt="flag" 
                      style={{ width: '18px', borderRadius: '2px' }}
                    />
                  )}
                  {lead.country || 'Belirtilmedi'} • <span className="badge">{lead.source}</span>
                </div>
              </div>
              
              <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Kayıt Tarihi</span><div>{new Date(lead.createdAt).toLocaleString('tr-TR')}</div></div>

              <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Satış Temsilcisi</span><div style={{ color: 'var(--accent-color)' }}>{assigneeUser ? assigneeUser.name : 'Atanmamış'}</div></div>

              {lead.note && (
                <div style={{ marginTop: '8px', padding: '12px', backgroundColor: 'var(--bg-color)', borderLeft: '3px solid var(--text-secondary)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>İlk Kayıt Notu</span>
                  <div style={{ fontSize: '13px' }}>{lead.note}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Notes / History */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '18px' }}>
            <History size={20} className="text-secondary" /> İşlem & Not Geçmişi
          </h2>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {lead.history && lead.history.length > 0 ? (
              lead.history.slice().reverse().map((h, i) => (
                <div key={i} style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span><strong>{h.author}</strong> not bıraktı</span>
                    <span>{new Date(h.date).toLocaleString('tr-TR')}</span>
                  </div>
                  <div style={{ marginBottom: '8px', fontSize: '14px' }}>{h.note}</div>
                  <span className="badge" style={{ fontSize: '10px' }}>Durum: {h.status || 'Yeni'}</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>Henüz bir not veya geçmiş bulunmuyor.</p>
            )}
          </div>

          {canEdit && (
            <form onSubmit={handleAddNote} style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <div className="form-group">
                <label className="form-label">Süreç Durumu</label>
                <select 
                  className="form-input" 
                  value={newStatus} 
                  onChange={e => setNewStatus(e.target.value)}
                >
                  {statuses.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Yeni Not Ekle</label>
                <textarea 
                  className="form-input" 
                  rows="3" 
                  placeholder="Müşteri ile bugün görüşüldü, eşine soracak..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <FileText size={16} /> Durumu & Notu Kaydet
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
