import React, { useContext, useState } from 'react';
import PasswordInput from '../components/PasswordInput';
import { AppContext } from '../context/AppContext';
import { Share, UserCheck, Download, Search, Filter, Shield, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { LEAD_STATUSES, getStatusStyle } from '../config/leadStatuses';

const predefinedStatuses = LEAD_STATUSES;
const predefinedSources = [
  'Acente', 'Google', 'İnstagram DM', 'Mail', 'Meta', 
  'Organik/Kendisi Buldu', 'Referans', 'Web Sitesi', 'Whatsaap', 'Yandex'
];
const predefinedLanguages = [
  'Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'İspanyolca', 
  'İtalyanca', 'Rusça', 'Arapça', 'Rumence', 'Bulgarca', 'Hollandaca', 'Diğer'
];

const countryCodesMap = {
  '+90': 'tr', '+1': 'us', '+44': 'gb', '+49': 'de', '+33': 'fr', 
  '+39': 'it', '+34': 'es', '+7': 'ru', '+971': 'ae', '+31': 'nl',
  '+966': 'sa', '+965': 'kw', '+974': 'qa', '+32': 'be', '+43': 'at',
  '+41': 'ch', '+46': 'se', '+47': 'no', '+45': 'dk'
};

const Leads = () => {
  const { currentUser, leads, users, assignLead, deleteLead, checkPermission, tenantConfig } = useContext(AppContext);
  // Durum renkleri firma ayarindan; tanimli degilse varsayilan eslesme kullanilir.
  const statusCategories = tenantConfig?.statusCategories;
  const [selectedAssignee, setSelectedAssignee] = useState({});
  const navigate = useNavigate();

  const [searchStr, setSearchStr] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterConsultant, setFilterConsultant] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [exportError, setExportError] = useState('');
  const pageSize = 30;

  // Sales consultants
  const salesConsultants = users.filter(u => u.level === 2);

  // Filter leads based on role
  let roleFilteredLeads = [];
  if (checkPermission('manageUsers') || checkPermission('assignLead')) {
    roleFilteredLeads = leads.filter(l => l.status !== 'Havuzda');
  } else if (currentUser.level === 2 || currentUser.level === 3) {
    roleFilteredLeads = leads.filter(l => l.assigneeId === currentUser.id && l.status !== 'Havuzda');
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
    const userId = selectedAssignee[leadId];
    if (userId) {
      assignLead(leadId, userId);
      alert('Lead başarıyla satış danışmanına atandı!');
    } else {
      alert('Lütfen bir satış danışmanı seçin.');
    }
  };

  const handleDelete = (leadId, name) => {
    if (window.confirm(`${name} isimli leadi silmek istediğinize emin misiniz?`)) {
      deleteLead(leadId);
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
      'Dil': l.language || '-',
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

  const filteredLeads = roleFilteredLeads.filter(l => {
    const fullStr = String(l.nameSurname + ' ' + (l.email || '') + ' ' + (l.phone || '')).toLowerCase();
    const matchSearch = fullStr.includes(searchStr.toLowerCase());
    const matchStatus = filterStatus ? (l.status || 'Aranmayı Bekliyor') === filterStatus : true;
    const matchSource = filterSource ? l.source === filterSource : true;
    const matchLanguage = filterLanguage ? l.language === filterLanguage : true;
    const matchConsultant = filterConsultant 
      ? (filterConsultant === 'null' ? l.assigneeId === null : String(l.assigneeId) === String(filterConsultant)) 
      : true;
    return matchSearch && matchStatus && matchSource && matchLanguage && matchConsultant;
  }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const visibleLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        <h1 className="page-title" style={{ marginBottom: 0 }}>Lead Listesi</h1>
        {checkPermission('exportExcel') && (
          <button onClick={() => setIsExportModalOpen(true)} className="btn btn-secondary btn-sm" style={{ borderColor: '#10b981', color: '#10b981' }}>
            <Download size={16} /> Excel İndir
          </button>
        )}
      </div>

      {/* Export Security Modal */}
      {isExportModalOpen && (
        <div className="modal-overlay" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' 
        }}>
          <div className="card" style={{ width: '400px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Shield size={32} color="#10b981" />
              </div>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Güvenlik Doğrulaması</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>Excel çıktısı almak için kimliğinizi doğrulamanız gerekmektedir.</p>
            </div>

            {exportError && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', textAlign: 'center' }}>
                {exportError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">E-posta Adresiniz</label>
              <input 
                type="email" 
                className="form-input" 
                value={confirmEmail} 
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="ornek@mail.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Şifreniz</label>
              <PasswordInput
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                onClick={() => {
                  setIsExportModalOpen(false);
                  setConfirmEmail('');
                  setConfirmPassword('');
                  setExportError('');
                }} 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
              >
                İptal
              </button>
              <button 
                onClick={() => {
                  if (confirmEmail === currentUser.email && confirmPassword === currentUser.password) {
                    handleExport();
                    setIsExportModalOpen(false);
                    setConfirmEmail('');
                    setConfirmPassword('');
                    setExportError('');
                  } else {
                    setExportError('E-posta veya şifre hatalı!');
                  }
                }} 
                className="btn btn-primary" 
                style={{ flex: 1, backgroundColor: '#10b981', borderColor: '#10b981' }}
              >
                Onayla ve İndir
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px' }}>
          <Search size={16} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="İsim, telefon, e-posta ara..." 
            value={searchStr}
            onChange={e => { setSearchStr(e.target.value); setCurrentPage(1); }}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', padding: '12px', width: '100%', outline: 'none' }}
          />
        </div>
        
        <div className="lead-filters" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={16} color="var(--text-secondary)" />
          <select 
            value={filterStatus} 
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="form-input" 
            style={{ padding: '10px' }}
          >
            <option value="">Tüm Durumlar</option>
            {predefinedStatuses.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
          </select>

          <select 
            value={filterSource} 
            onChange={e => { setFilterSource(e.target.value); setCurrentPage(1); }}
            className="form-input" 
            style={{ padding: '10px' }}
          >
            <option value="">Tüm Kaynaklar</option>
            {predefinedSources.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
          </select>

          <select 
            value={filterLanguage} 
            onChange={e => { setFilterLanguage(e.target.value); setCurrentPage(1); }}
            className="form-input" 
            style={{ padding: '10px' }}
          >
            <option value="">Tüm Diller</option>
            {predefinedLanguages.map((l, idx) => <option key={idx} value={l}>{l}</option>)}
          </select>

          {(checkPermission('manageUsers') || checkPermission('assignLead')) && (
            <select 
              value={filterConsultant} 
              onChange={e => { setFilterConsultant(e.target.value); setCurrentPage(1); }}
              className="form-input" 
              style={{ padding: '10px' }}
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

      <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        Toplam <strong>{filteredLeads.length}</strong> kayıt bulundu. (Sayfa {currentPage} / {totalPages || 1})
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
                <th style={{ width: '80px' }}>ID</th>
                <th>Ad-Soyad</th>
                <th>Ülke</th>
                <th>Telefon</th>
                <th>Dil</th>
                <th>Kaynak</th>
                <th>Durum</th>
                <th>Kayıt Tarihi</th>
                <th>Atama</th>
                {checkPermission('deleteLead') && <th>İşlem</th>}
              </tr>
            </thead>
            <tbody>
              {visibleLeads.map(lead => {
                const isAssigned = lead.assigneeId !== null;
                const assigneeUser = isAssigned ? users.find(u => u.id === lead.assigneeId) : null;
                
                return (
                  <tr key={lead.id} className="cursor-pointer-row">
                    <td onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer', fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      #{String(lead.id).substring(0, 6).toUpperCase()}
                    </td>
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
                    <td onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                      {lead.language ? <span style={{ fontSize: '13px' }}>{lead.language}</span> : <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>-</span>}
                    </td>
                    <td onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}><span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{lead.source}</span></td>
                    <td onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                      <span className="badge" style={getStatusStyle(lead.status || 'Aranmayı Bekliyor', statusCategories)}>
                        {lead.status || 'Aranmayı Bekliyor'}
                      </span>
                    </td>
                    <td onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>{new Date(lead.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td>
                      {checkPermission('assignLead') ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            className="form-input"
                            style={{ padding: '6px', width: 'auto', fontSize: '13px', minWidth: '130px' }}
                            value={selectedAssignee[lead.id] || lead.assigneeId || ''}
                            onChange={(e) => {
                               setSelectedAssignee({...selectedAssignee, [lead.id]: e.target.value});
                               if (isAssigned) {
                                  assignLead(lead.id, e.target.value);
                               }
                            }}
                          >
                            <option value="" disabled>Danışman Seçin</option>
                            {salesConsultants.map(sc => (
                              <option key={sc.id} value={sc.id}>{sc.name}</option>
                            ))}
                          </select>
                          {!isAssigned && (
                            <button 
                              onClick={() => handleAssign(lead.id)} 
                              className="btn btn-primary btn-sm"
                              style={{ padding: '6px 12px' }}
                            >
                              <Share size={14} /> Atama Yap
                            </button>
                          )}
                          {isAssigned && (
                             <span style={{ fontSize: '11px', color: 'var(--success)', whiteSpace: 'nowrap' }}>
                               {assigneeUser?.name}
                             </span>
                          )}
                        </div>
                      ) : (
                        // No assign permission
                        <span className="badge badge-success">{isAssigned ? `Atandı: ${assigneeUser?.name}` : 'Atanmamış'}</span>
                      )}
                    </td>
                    {checkPermission('deleteLead') && (
                      <td>
                        <button 
                          onClick={() => handleDelete(lead.id, lead.nameSurname)}
                          className="btn btn-sm" 
                          style={{ padding: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                          title="Leadi Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px', marginBottom: '40px' }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="btn btn-secondary btn-sm"
          >
            Önceki
          </button>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              // Show limited page numbers if there are too many
              if (totalPages > 7) {
                if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 2) {
                  if (pageNum === currentPage - 3 || pageNum === currentPage + 3) return <span key={pageNum}>...</span>;
                  return null;
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ minWidth: '36px', padding: '8px' }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="btn btn-secondary btn-sm"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
};

export default Leads;
