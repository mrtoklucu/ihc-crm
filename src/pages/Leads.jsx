import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Share, UserCheck, Download, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const predefinedStatuses = [
  "Aranmayı Bekliyor", "Aradım, Açmadı", "Aramayı Reddeti", "Başka Bir Klinikle Anlaşmış", 
  "Lokasyon Olumsuz", "Randevu Oluşturuldu", "İletişim Eksik", "Destek Tedavisine Uygun", 
  "Dil Sorunu", "Engelledi/Engelledim", "Fiyatı Pahalı Buldu", "Fotoğraf Alındı, Teklif Verildi", 
  "Fotoğraf Bekleniyor", "İletişim Kurulamıyor", "İleri Tarihte Düşünüyor", "İletişimdeyim", 
  "İletişime Geçiyorum", "İlgisiz", "Randevu İptal Edildi", "Kaporalı Randevu Oluşturuldu", 
  "Mesaj Attım, Bekleniyor", "Operasyona Girdi", "Operasyona Uygun Değil", "Saç Ekimi Düşünmüyor", 
  "Sadece Fiyat Sordu", "Teklif Verildi, Kararsız", "Teklif Verildi, Olumlu", "Teklife Dönüş Yapmadı", 
  "Telesekretere Bağlanıyor", "Yanlış Başvuru", "Yanlış Numara", "Yüzyüze Görüşme", "Tekrar Gelen Lead"
];
const predefinedSources = [
  'Acente', 'Google', 'İnstagram DM', 'Mail', 'Meta', 
  'Organik/Kendisi Buldu', 'Referans', 'Web Sitesi', 'Whatsaap', 'Yandex'
];

const countryCodesMap = {
  '+90': 'tr', '+1': 'us', '+44': 'gb', '+49': 'de', '+33': 'fr', 
  '+39': 'it', '+34': 'es', '+7': 'ru', '+971': 'ae', '+31': 'nl',
  '+966': 'sa', '+965': 'kw', '+974': 'qa', '+32': 'be', '+43': 'at',
  '+41': 'ch', '+46': 'se', '+47': 'no', '+45': 'dk'
};

const Leads = () => {
  const { currentUser, leads, users, assignLead, checkPermission } = useContext(AppContext);
  const [selectedAssignee, setSelectedAssignee] = useState({});
  const navigate = useNavigate();

  const [searchStr, setSearchStr] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterConsultant, setFilterConsultant] = useState('');

  // Sales consultants
  const salesConsultants = users.filter(u => u.level === 2);

  // Filter leads based on role
  let roleFilteredLeads = [];
  if (checkPermission('manageUsers') || checkPermission('assignLead')) {
    roleFilteredLeads = leads;
  } else if (currentUser.level === 2 || currentUser.level === 3) {
    roleFilteredLeads = leads.filter(l => l.assigneeId === currentUser.id);
  } else {
    // Other levels without explicit access
    if (!checkPermission('viewLeads')) {
      return (
        <div>
          <h1 className="page-title">Lead Listesi</h1>
          <div className="card">
            <p>Bu sayfayı görüntülemek için yeterli yetkiniz bulunmamaktadır.</p>
          </div>
        </div>
      );
    }
    roleFilteredLeads = leads;
  }

  const handleAssign = (leadId) => {
    const userId = parseInt(selectedAssignee[leadId]);
    if (userId) {
      assignLead(leadId, userId);
      alert('Lead başarıyla satış danışmanına atandı!');
    } else {
      alert('Lütfen bir satış danışmanı seçin.');
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(visibleLeads.map(l => ({
      'ID': l.id,
      'Ad Soyad': l.nameSurname,
      'Email': l.email,
      'Telefon': l.phone,
      'Ülke': l.country,
      'Kaynak': l.source,
      'Durum': l.status || 'Aranmayı Bekliyor',
      'Cinsiyet': l.gender || '-',
      'Doğum Tarihi': l.birthDate || '-',
      'Yaş': l.birthDate ? (new Date().getFullYear() - new Date(l.birthDate).getFullYear()) : '-',
      'Kayıt Tarihi': new Date(l.createdAt).toLocaleDateString('tr-TR'),
      'Atanan': l.assigneeId ? users.find(u => u.id === l.assigneeId)?.name : 'Atanmamış'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "IHC_Leads_Data.xlsx");
  };

  const visibleLeads = roleFilteredLeads.filter(l => {
    const fullStr = String(l.nameSurname + ' ' + l.email + ' ' + l.phone).toLowerCase();
    const matchSearch = fullStr.includes(searchStr.toLowerCase());
    const matchStatus = filterStatus ? (l.status || 'Aranmayı Bekliyor') === filterStatus : true;
    const matchSource = filterSource ? l.source === filterSource : true;
    const matchConsultant = filterConsultant 
      ? (filterConsultant === 'null' ? l.assigneeId === null : l.assigneeId === parseInt(filterConsultant)) 
      : true;
    return matchSearch && matchStatus && matchSource && matchConsultant;
  }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getFlagCode = (lead) => {
    if (lead.countryCode) return lead.countryCode;
    if (!lead.phone) return null;
    const codes = Object.keys(countryCodesMap).sort((a,b) => b.length - a.length);
    for (const code of codes) {
      if (lead.phone.startsWith(code)) return countryCodesMap[code];
    }
    return null;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Lead Listesi</h1>
        {checkPermission('exportExcel') && (
          <button onClick={handleExport} className="btn btn-secondary btn-sm" style={{ borderColor: '#10b981', color: '#10b981' }}>
            <Download size={16} /> Excel İndir
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px' }}>
          <Search size={16} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="İsim, telefon, e-posta ara..." 
            value={searchStr}
            onChange={e => setSearchStr(e.target.value)}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', padding: '12px', width: '100%', outline: 'none' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={16} color="var(--text-secondary)" />
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="form-input" 
            style={{ padding: '10px', width: 'auto' }}
          >
            <option value="">Tüm Durumlar</option>
            {predefinedStatuses.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
          </select>

          <select 
            value={filterSource} 
            onChange={e => setFilterSource(e.target.value)}
            className="form-input" 
            style={{ padding: '10px', width: 'auto' }}
          >
            <option value="">Tüm Kaynaklar</option>
            {predefinedSources.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
          </select>

          {(checkPermission('manageUsers') || checkPermission('assignLead')) && (
            <select 
              value={filterConsultant} 
              onChange={e => setFilterConsultant(e.target.value)}
              className="form-input" 
              style={{ padding: '10px', width: 'auto' }}
            >
              <option value="">Tüm Danışmanlar</option>
              <option value="null">Atanmamış</option>
              {salesConsultants.map(sc => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="card table-container">
        {visibleLeads.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            Henüz size ait veya atanmamış bir lead bulunamadı.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ad-Soyad</th>
                <th>Ülke</th>
                <th>Telefon</th>
                <th>Kaynak</th>
                <th>Durum</th>
                <th>Kayıt Tarihi</th>
                <th>Atama</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeads.map(lead => {
                const isAssigned = lead.assigneeId !== null;
                const assigneeUser = isAssigned ? users.find(u => u.id === lead.assigneeId) : null;
                
                return (
                  <tr key={lead.id} className="cursor-pointer-row">
                    <td onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent-color)' }}>{lead.nameSurname}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{lead.email}</div>
                    </td>
                    <td onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getFlagCode(lead) && (
                          <img 
                            src={`https://flagcdn.com/w40/${getFlagCode(lead)}.png`} 
                            alt="flag" 
                            style={{ width: '18px', borderRadius: '2px' }}
                          />
                        )}
                        {lead.country || '-'}
                      </div>
                    </td>
                    <td onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>{lead.phone}</td>
                    <td onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}><span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{lead.source}</span></td>
                    <td onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                      <span className="badge" style={{ 
                        background: (['Randevu Oluşturuldu', 'Kaporalı Randevu Oluşturuldu', 'Operasyona Girdi', 'Teklif Verildi, Olumlu'].includes(lead.status)) ? 'rgba(16, 185, 129, 0.1)' : (['Aramayı Reddeti', 'İptal', 'Engelledi/Engelledim', 'Randevu İptal Edildi'].includes(lead.status)) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                        color: (['Randevu Oluşturuldu', 'Kaporalı Randevu Oluşturuldu', 'Operasyona Girdi', 'Teklif Verildi, Olumlu'].includes(lead.status)) ? 'var(--success)' : (['Aramayı Reddeti', 'İptal', 'Engelledi/Engelledim', 'Randevu İptal Edildi'].includes(lead.status)) ? 'var(--error)' : 'var(--accent-color)'
                      }}>
                        {lead.status || 'Aranmayı Bekliyor'}
                      </span>
                    </td>
                    <td onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>{new Date(lead.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td>
                      {checkPermission('assignLead') ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {!isAssigned ? (
                            <>
                              <select
                                className="form-input"
                                style={{ padding: '6px', width: 'auto', fontSize: '13px' }}
                                value={selectedAssignee[lead.id] || ''}
                                onChange={(e) => setSelectedAssignee({...selectedAssignee, [lead.id]: e.target.value})}
                              >
                                <option value="" disabled>Danışman Seçin</option>
                                {salesConsultants.map(sc => (
                                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => handleAssign(lead.id)} 
                                className="btn btn-primary btn-sm"
                                style={{ padding: '6px 12px' }}
                              >
                                <Share size={14} /> Atama Yap
                              </button>
                            </>
                          ) : (
                            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <UserCheck size={14} /> Atandı: {assigneeUser?.name}
                            </span>
                          )}
                        </div>
                      ) : (
                        // No assign permission
                        <span className="badge badge-success">{isAssigned ? `Atandı: ${assigneeUser?.name}` : 'Atanmamış'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Leads;
