import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, User, Phone, Mail, Globe, Clock, History, FileText, CheckCircle, Edit2, Save, X, CheckCircle2, ChevronDown, ChevronUp, Activity, ClipboardList, Plane, Hotel, Image as ImageIcon, Trash2, Camera } from 'lucide-react';
import { getCountryFromPhone, getPhoneSuggestions } from '../utils/phoneUtils';
import { LEAD_STATUSES, getStatusStyle } from '../config/leadStatuses';

const statuses = LEAD_STATUSES;

const predefinedLanguages = [
  'Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'İspanyolca', 
  'İtalyanca', 'Rusça', 'Arapça', 'Rumence', 'Bulgarca', 'Hollandaca', 'Diğer'
];

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leads, users, currentUser, addLeadHistory, updateLeadData, assignLead, deleteLead, checkPermission, uploadFile, fetchLeadById, tenantConfig } = useContext(AppContext);
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [phoneSuggestions, setPhoneSuggestions] = useState([]);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [uploading, setUploading] = useState(false);

  const lead = leads.find(l => String(l.id) === String(id));

  // Bildirimden gelen lead acilistaki listede olmayabilir; o durumda tek kayit
  // olarak cekilir. Her lead icin en fazla bir istek yapilir: kayit gercekten
  // yoksa efekt tekrar tekrar denemesin diye denenen id bir ref'te tutulur.
  const fetchAttemptedFor = useRef(null);
  useEffect(() => {
    if (lead) return;
    if (fetchAttemptedFor.current === id) return;
    fetchAttemptedFor.current = id;
    fetchLeadById(id);
  }, [id, lead, fetchLeadById]);

  useEffect(() => {
    if (lead) {
      if (lead.status) setNewStatus(lead.status);
      
      setEditFormData({
        nameSurname: lead.nameSurname || '',
        phone: lead.phone || '',
        email: lead.email || '',
        gender: lead.gender || '',
        language: lead.language || '',
        // Extra fields
        communicationSource: lead.communicationSource || '',
        communicationPreference: lead.communicationPreference || '',
        referringPatient: lead.referringPatient || '',
        discountGroup: lead.discountGroup || '',
        relatedPersonnel: lead.relatedPersonnel || [],
        tags: lead.tags || '',
        medical_allergies: lead.medical_allergies || '',
        medical_medications: lead.medical_medications || '',
        medical_health_problems: lead.medical_health_problems || '',
        medical_surgeries: lead.medical_surgeries || '',
        medical_substances: lead.medical_substances || '',
        medical_procedures: lead.medical_procedures || '',
        medical_treatments: lead.medical_treatments || '',
        accommodation_hotel: lead.accommodation_hotel || '',
        accommodation_details: lead.accommodation_details || '',
        transfer_details: lead.transfer_details || '',
        travel_arrival_date: lead.travel_arrival_date || '',
        travel_departure_date: lead.travel_departure_date || '',
        gallery: lead.gallery || []
      });
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const success = await updateLeadData(lead.id, editFormData);
    if (success) {
      setIsEditing(false);
      alert('Lead bilgileri başarıyla güncellendi.');
    }
  };

  const handleDeleteLead = async () => {
    if (window.confirm(`${lead.nameSurname} isimli leadi TAMAMEN silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      const success = await deleteLead(lead.id);
      if (success) {
        alert('Lead başarıyla silindi.');
        navigate('/leads');
      }
    }
  };

  const handleReassign = async (uId) => {
    if (uId) {
      await assignLead(lead.id, uId);
      alert('Lead yeni danışmana başarıyla atandı.');
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...editFormData, [name]: value };

    // Auto country detection or suggestion logic
    if (name === 'phone' && value) {
      if (value.startsWith('+')) {
        const countryInfo = getCountryFromPhone(value);
        if (countryInfo) {
          newFormData.country = countryInfo.name;
          newFormData.countryCode = countryInfo.code;
        } else {
          newFormData.countryCode = '';
        }
        setPhoneSuggestions([]);
        setShowPhoneModal(false);
      } else if (value.length >= 10 && !value.startsWith('+')) {
        // Suggest country codes if no plus sign and looks like a full number
        const suggestions = getPhoneSuggestions(value);
        setPhoneSuggestions(suggestions);
        if (suggestions.length > 0) {
          setShowPhoneModal(true);
        }
      }
    }
    setEditFormData(newFormData);
  };

  const handleSelectSuggestion = (suggestion) => {
    setEditFormData(prev => ({
      ...prev,
      phone: suggestion.fullName,
      country: suggestion.country.name,
      countryCode: suggestion.country.code
    }));
    setShowPhoneModal(false);
  };

  const currentStatusIndex = statuses.indexOf(lead.status || 'Aranmayı Bekliyor');
  const progressPercent = Math.max(10, (currentStatusIndex / (statuses.length - 1)) * 100);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/leads')} className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>Müşteri Detay Yöneticisi <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '8px' }}>#{String(lead.id).toUpperCase()}</span></h1>
      </div>

      <div className="grid-2">
        {/* Left Column - Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status Progress Bar */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '15px' }}>
              <CheckCircle size={18} color="var(--accent-color)" /> Müşteri Durumu:{' '}
              <span className="badge" style={getStatusStyle(lead.status || 'Aranmayı Bekliyor', tenantConfig?.statusCategories)}>
                {lead.status || 'Yeni'}
              </span>
            </h3>
            <div style={{ width: '100%', backgroundColor: 'var(--bg-color)', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: getStatusStyle(lead.status || 'Aranmayı Bekliyor', tenantConfig?.statusCategories).color, transition: 'all 0.3s' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>Yeni Kayıt</span>
              <span>Süreç Tamamlandı</span>
            </div>
          </div>

          {/* Lead Details */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', margin: 0 }}>
                <User size={20} className="text-secondary" /> Müşteri Profili
              </h2>
              {canEdit && !isEditing && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {checkPermission('deleteLead') && (
                    <button onClick={handleDeleteLead} className="btn btn-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                      <Trash2 size={14} /> Sil
                    </button>
                  )}
                  <button onClick={() => setIsEditing(true)} className="btn btn-sm" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                    <Edit2 size={14} /> Düzenle
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ad Soyad</label>
                  <input type="text" name="nameSurname" className="form-input" value={editFormData.nameSurname} onChange={handleEditChange} required />
                </div>
                
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Telefon</label>
                    <div style={{ position: 'relative' }}>
                      <input type="text" name="phone" className="form-input" value={editFormData.phone} onChange={handleEditChange} required style={{ paddingRight: '40px' }} />
                      {editFormData.countryCode && (
                        <img 
                          src={`https://flagcdn.com/w40/${editFormData.countryCode}.png`} 
                          alt="flag" 
                          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', borderRadius: '2px' }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">E-posta</label>
                    <input type="email" name="email" className="form-input" value={editFormData.email} onChange={handleEditChange} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Cinsiyet</label>
                    <select name="gender" className="form-input" value={editFormData.gender} onChange={handleEditChange}>
                      <option value="">Belirtilmedi</option>
                      <option value="Erkek">Erkek</option>
                      <option value="Kadın">Kadın</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Doğum Tarihi</label>
                    <input type="date" name="birthDate" className="form-input" value={editFormData.birthDate} onChange={handleEditChange} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Kaynak</label>
                    <input type="text" name="source" className="form-input" value={editFormData.source} onChange={handleEditChange} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Konuştuğu Dil</label>
                    <select name="language" className="form-input" value={editFormData.language} onChange={handleEditChange}>
                      <option value="">Belirtilmedi</option>
                      {predefinedLanguages.map((lang, idx) => (
                        <option key={idx} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    {/* Spacer or another field if needed */}
                  </div>
                </div>

                {/* Extra Fields in Edit Mode */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowExtraFields(!showExtraFields)} className="btn btn-secondary btn-sm" style={{ width: '100%', borderStyle: 'dashed' }}>
                    {showExtraFields ? 'Detaylı Bilgileri Gizle' : 'Detaylı Bilgileri Düzenle'}
                  </button>
                  
                  {showExtraFields && (
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="grid-2">
                         <div className="form-group">
                           <label className="form-label">İletişim Kaynağı</label>
                           <input type="text" name="communicationSource" className="form-input" value={editFormData.communicationSource} onChange={handleEditChange} />
                         </div>
                         <div className="form-group">
                           <label className="form-label">İletişim Tercihi</label>
                           <input type="text" name="communicationPreference" className="form-input" value={editFormData.communicationPreference} onChange={handleEditChange} />
                         </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Referans Olan Danışan / Etiketler</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <input type="text" name="referringPatient" className="form-input" value={editFormData.referringPatient} onChange={handleEditChange} placeholder="Referans" />
                          <input type="text" name="tags" className="form-input" value={editFormData.tags} onChange={handleEditChange} placeholder="Etiketler" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Medikal Durum (Özeti)</label>
                        <textarea name="medical_health_problems" className="form-input" rows="2" value={editFormData.medical_health_problems} onChange={handleEditChange} placeholder="Temel sağlık sorunları..." />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Konaklama & Transfer</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input name="accommodation_hotel" className="form-input" value={editFormData.accommodation_hotel} onChange={handleEditChange} placeholder="Otel Adı" />
                          <input type="date" name="travel_arrival_date" className="form-input" value={editFormData.travel_arrival_date} onChange={handleEditChange} />
                        </div>
                        <textarea name="transfer_details" className="form-input" rows="2" value={editFormData.transfer_details} onChange={handleEditChange} placeholder="Transfer detayları..." />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Galeri / Görseller</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {editFormData.gallery?.map((img, i) => (
                            <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden' }}>
                              <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button type="button" onClick={() => setEditFormData({...editFormData, gallery: editFormData.gallery.filter((_, idx) => idx !== i)})} style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', padding: '2px' }}><Trash2 size={10}/></button>
                            </div>
                          ))}
                          <label style={{ width: '60px', height: '60px', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            {uploading ? '...' : <Camera size={16}/>}
                            <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                              const files = Array.from(e.target.files);
                              setUploading(true);
                              const newUploads = [];
                              for (const f of files) {
                                const res = await uploadFile(f);
                                if (res) newUploads.push({ url: res.url, name: res.name });
                              }
                              setEditFormData(prev => ({ ...prev, gallery: [...(prev.gallery || []), ...newUploads] }));
                              setUploading(false);
                            }} />
                          </label>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ marginBottom: '12px' }}>İlgili Personel</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', backgroundColor: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px' }}>
                          {users.map((u, idx) => (
                            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={editFormData.relatedPersonnel?.includes(u.name)}
                                onChange={(e) => {
                                  let newList = editFormData.relatedPersonnel || [];
                                  if (e.target.checked) {
                                    newList = [...newList, u.name];
                                  } else {
                                    newList = newList.filter(item => item !== u.name);
                                  }
                                  setEditFormData({ ...editFormData, relatedPersonnel: newList });
                                }}
                              />
                              {u.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button type="button" className="btn btn-sm" onClick={() => setIsEditing(false)} style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <X size={16} /> İptal
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Save size={16} /> Kaydet
                  </button>
                </div>
              </form>
            ) : (
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

                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Konuştuğu Dil</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-color)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                      {lead.language || 'Belirtilmedi'}
                    </span>
                  </div>
                </div>
                
                <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Kayıt Tarihi</span><div>{new Date(lead.createdAt).toLocaleString('tr-TR')}</div></div>

                <div>
                   <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>Satış Temsilcisi</span>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{assigneeUser ? assigneeUser.name : 'Atanmamış'}</div>
                      {checkPermission('assignLead') && (
                        <select 
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer', outline: 'none' }}
                          value={lead.assigneeId || ''}
                          onChange={(e) => handleReassign(e.target.value)}
                        >
                          <option value="" disabled>Temsilciyi Değiştir</option>
                          {users.filter(u => u.level === 2).map(sc => (
                            <option key={sc.id} value={sc.id}>{sc.name}</option>
                          ))}
                        </select>
                      )}
                   </div>
                </div>

                {lead.note && (
                  <div style={{ marginTop: '8px', padding: '12px', backgroundColor: 'var(--bg-color)', borderLeft: '3px solid var(--text-secondary)', borderRadius: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>İlk Kayıt Notu</span>
                    <div style={{ fontSize: '13px' }}>{lead.note}</div>
                  </div>
                )}

                {/* Extra Display Sections */}
                {((lead.communicationSource) || (lead.medical_health_problems) || (lead.accommodation_hotel) || (lead.gallery?.length > 0)) && (
                   <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '16px' }}>
                      <button onClick={() => setShowExtraFields(!showExtraFields)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                        {showExtraFields ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} {showExtraFields ? 'Detayları Kapat' : 'Ek Bilgileri & Galeri Göster'}
                      </button>

                      {showExtraFields && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                          {lead.communicationSource && <div><span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>İletişim:</span> {lead.communicationSource} - {lead.communicationPreference}</div>}
                          
                          {(lead.accommodation_hotel || lead.transfer_details) && (
                            <div style={{ padding: '10px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '4px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-color)', fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}>
                                <Plane size={10} /> KONAKLAMA & TRANSFER
                              </div>
                              {lead.accommodation_hotel && <div><strong>Otel:</strong> {lead.accommodation_hotel} {lead.travel_arrival_date ? `(${new Date(lead.travel_arrival_date).toLocaleDateString('tr-TR')})` : ''}</div>}
                              {lead.transfer_details && <div style={{ marginTop: '4px' }}>{lead.transfer_details}</div>}
                            </div>
                          )}

                          {lead.gallery && lead.gallery.length > 0 && (
                            <div>
                               <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Galeri ({lead.gallery.length} Görsel)</div>
                               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                 {lead.gallery.map((img, i) => (
                                   <a key={i} href={img.url} target="_blank" rel="noreferrer">
                                     <img src={img.url} alt="" style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                                   </a>
                                 ))}
                               </div>
                            </div>
                          )}
                          {lead.tags && <div><span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Etiketler:</span> {lead.tags}</div>}
                          {lead.relatedPersonnel && lead.relatedPersonnel.length > 0 && (
                            <div>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>İlgili Personel:</span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                {lead.relatedPersonnel.map((p, i) => <span key={i} className="badge" style={{ fontSize: '10px' }}>{p}</span>)}
                              </div>
                            </div>
                          )}
                          
                          {lead.medical_health_problems && (
                            <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error)', fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}>
                                <Activity size={10} /> TIBBİ BİLGİ ÖZETİ
                              </div>
                              {lead.medical_health_problems}
                              {lead.medical_medications && <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--text-secondary)' }}>İlaçlar:</span> {lead.medical_medications}</div>}
                            </div>
                          )}
                        </div>
                      )}
                   </div>
                )}
              </div>
            )}
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
      {/* Phone Suggestion Modal */}
      {showPhoneModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '16px', textAlign: 'center' }}>Hangi numarayı yazmak istediniz?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>
              Numaranın başında alan kodu bulunamadı. Lütfen size uygun olanı seçiniz veya manuel devam ediniz.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {phoneSuggestions.map((s, idx) => (
                <div key={idx} className="suggestion-card" onClick={() => handleSelectSuggestion(s)}>
                  <div className="suggestion-info">
                    <img src={`https://flagcdn.com/w40/${s.country.code}.png`} alt="flag" className="suggestion-flag" />
                    <div>
                      <div className="suggestion-number">{s.fullName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.country.name} (+{s.prefix.replace('+', '')})</div>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ padding: '8px 16px' }}>
                    Bu Numarayı Kullan
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button 
                onClick={() => setShowPhoneModal(false)}
                className="btn btn-secondary" 
                style={{ fontSize: '14px' }}
              >
                Pencereyi Kapat ve Yazmaya Devam Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetail;
