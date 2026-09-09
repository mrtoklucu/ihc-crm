import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { PlusCircle, Globe, CheckCircle2, ChevronDown, ChevronUp, Activity, ClipboardList, Plane, Hotel, Image as ImageIcon, Trash2, Camera, AlertCircle } from 'lucide-react';
import { getCountryFromPhone, getPhoneSuggestions } from '../utils/phoneUtils';

const predefinedSources = [
  'Acente',
  'Google',
  'İnstagram DM',
  'Mail',
  'Meta',
  'Organik/Kendisi Buldu',
  'Referans',
  'Web Sitesi',
  'Whatsaap',
  'Yandex'
];

const predefinedLanguages = [
  'Türkçe',
  'İngilizce',
  'Almanca',
  'Fransızca',
  'İspanyolca',
  'İtalyanca',
  'Rusça',
  'Arapça',
  'Rumence',
  'Bulgarca',
  'Hollandaca',
  'Diğer'
];

const NewLead = () => {
  const { currentUser, users, addLead, checkPermission, uploadFile, leads } = useContext(AppContext);
  const [success, setSuccess] = useState(false);
  const [duplicateLead, setDuplicateLead] = useState(null);
  const [phoneSuggestions, setPhoneSuggestions] = useState([]);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showExtraInfo, setShowExtraInfo] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    nameSurname: '',
    email: '',
    phone: '',
    country: '',
    countryCode: '',
    gender: '',
    birthDate: '',
    source: '',
    language: '',
    note: '',
    // Extra Info
    communicationSource: '',
    communicationPreference: '',
    referringPatient: '',
    discountGroup: '',
    relatedPersonnel: [], // Array of personnel names
    tags: '',
    // Medical Info
    medical_allergies: '',
    medical_medications: '',
    medical_health_problems: '',
    medical_surgeries: '',
    medical_substances: '',
    medical_autoimmune: '',
    medical_procedures: '',
    medical_treatments: '',
    // Travel & Accommodation
    accommodation_hotel: '',
    accommodation_details: '',
    transfer_details: '',
    travel_arrival_date: '',
    travel_departure_date: '',
    // Gallery
    gallery: [] // array of {url, name}
  });

  // Use registered users for personnel list
  const personnelList = users.map(u => u.name);

  // Check permission
  if (!checkPermission('addLead')) {
    return (
      <div>
        <h1 className="page-title">Yetki Hatası</h1>
        <div className="card">
          <p>Hoş geldiniz, {currentUser.name}.</p>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Yeni bir lead girmek için gerekli yetkiye sahip olmalısınız.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

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
      } else if (value.length >= 10) {
        // Suggest country codes if no plus sign and looks like a full number
        const suggestions = getPhoneSuggestions(value);
        setPhoneSuggestions(suggestions);
        if (suggestions.length > 0) {
          setShowPhoneModal(true);
        }
      }
    }

    // Check for duplicate phone number
    if (name === 'phone' && value.length > 5) {
      const cleanNew = value.replace(/\D/g, '');
      const duplicate = leads.find(l => {
        if (!l.phone) return false;
        const cleanOld = l.phone.replace(/\D/g, '');
        return cleanOld === cleanNew && cleanNew.length > 7; // Only match if it looks like a real number
      });
      setDuplicateLead(duplicate || null);
    } else if (name === 'phone') {
      setDuplicateLead(null);
    }

    setFormData(newFormData);
  };

  const handleSelectSuggestion = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      phone: suggestion.fullName,
      country: suggestion.country.name,
      countryCode: suggestion.country.code
    }));
    setShowPhoneModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = addLead(formData);
    if (success) {
      setSuccess(true);
      setFormData({
        nameSurname: '', email: '', phone: '', country: '', countryCode: '', gender: '', birthDate: '', source: '', language: '', note: '',
        communicationSource: '', communicationPreference: '', referringPatient: '', discountGroup: '', relatedPersonnel: [], tags: '',
        accommodation_hotel: '', accommodation_details: '', transfer_details: '', travel_arrival_date: '', travel_departure_date: '', gallery: []
      });
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }
  };

  return (
    <div>
      <h1 className="page-title">Yeni Lead Ekle</h1>
      
      <div className="card" style={{ maxWidth: '800px' }}>
        {success && (
          <div style={{ padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '8px', marginBottom: '24px', fontWeight: 500 }}>
            Lead başarıyla kaydedildi!
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid-2">
          <div className="form-group">
            <label className="form-label">Ad-Soyad *</label>
            <input 
              required
              name="nameSurname"
              value={formData.nameSurname}
              onChange={handleChange}
              className="form-input" 
              placeholder="Örn: John Doe" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Telefon Numarası *</label>
            <div style={{ position: 'relative' }}>
              <input 
                required
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input" 
                placeholder="+90 5xx xxx xx xx" 
                style={{ paddingRight: '40px' }}
              />
              {formData.countryCode && (
                <img 
                  src={`https://flagcdn.com/w40/${formData.countryCode}.png`} 
                  alt="flag" 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', borderRadius: '2px' }}
                />
              )}
            </div>
            {duplicateLead ? (
              <div style={{ 
                marginTop: '10px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171'
              }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>
                  Bu numara zaten kayıtlı! ({duplicateLead.nameSurname})
                </span>
                <button 
                  type="button"
                  onClick={() => alert(`Bu numara ${duplicateLead.nameSurname} adına kayıtlıdır. Durumu: ${duplicateLead.status}`)}
                  style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#f87171', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Detay
                </button>
              </div>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={12}/> Alan kodu ile girildiğinde ülke ve bayrak otomatik dolar.
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">E-posta</label>
            <input 
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input" 
              placeholder="Örn: john@example.com" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ülke</label>
            <input 
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="form-input" 
              placeholder="Ülke seçimi..." 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Referans Kaynağı *</label>
            <select 
              required
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="form-input"
              style={{ padding: '12px' }}
            >
              <option value="" disabled>Seçiniz...</option>
              {predefinedSources.map((src, idx) => (
                <option key={idx} value={src}>{src}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Cinsiyet</label>
            <select 
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="form-input"
              style={{ padding: '12px' }}
            >
              <option value="">Seçiniz</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadın">Kadın</option>
              <option value="Belirtilmemiş">Belirtilmemiş</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Konuştuğu Dil</label>
            <select 
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="form-input"
              style={{ padding: '12px' }}
            >
              <option value="">Seçiniz</option>
              {predefinedLanguages.map((lang, idx) => (
                <option key={idx} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Doğum Tarihi</label>
            <input 
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="form-input" 
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Not</label>
            <textarea 
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="form-input" 
              rows="2" 
              placeholder="Lead için ekstra notlar..." 
            />
          </div>

          {/* Toggle Button for Extra Info */}
          <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
            <button 
              type="button" 
              onClick={() => setShowExtraInfo(!showExtraInfo)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                backgroundColor: 'rgba(255,255,255,0.03)', 
                border: '1px dashed var(--border-color)', 
                borderRadius: '8px',
                color: 'var(--accent-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {showExtraInfo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              {showExtraInfo ? 'Ek Bilgileri Gizle' : 'Konaklama, Transfer ve Medikal Detaylar (İsteğe Bağlı)'}
            </button>
          </div>

          {showExtraInfo && (
            <>
              {/* Extra Section */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '16px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClipboardList size={18} color="var(--accent-color)" /> Genel Detaylar
                </h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">İletişim Kaynağı</label>
                    <select name="communicationSource" value={formData.communicationSource} onChange={handleChange} className="form-input">
                      <option value="">Seçiniz...</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Telefon">Telefon</option>
                      <option value="E-posta">E-posta</option>
                      <option value="Yüz Yüze">Yüz Yüze</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">İletişim Tercihi</label>
                    <select name="communicationPreference" value={formData.communicationPreference} onChange={handleChange} className="form-input">
                      <option value="">Seçiniz...</option>
                      <option value="Sadece WhatsApp">Sadece WhatsApp</option>
                      <option value="Sadece Arama">Sadece Arama</option>
                      <option value="Mesai Saatleri Dışı">Mesai Saatleri Dışı</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Referans Olan Danışan</label>
                    <input name="referringPatient" value={formData.referringPatient} onChange={handleChange} className="form-input" placeholder="İsim veya Kart no" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">İndirim Grubu</label>
                    <select name="discountGroup" value={formData.discountGroup} onChange={handleChange} className="form-input">
                      <option value="">Yok</option>
                      <option value="Standart">Standart</option>
                      <option value="VIP">VIP</option>
                      <option value="Kampanya">Kampanya</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Etiketler</label>
                    <input name="tags" value={formData.tags} onChange={handleChange} className="form-input" placeholder="Etiketleri virgül ile ayırın (örn: Saç Ekimi, VIP)" />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ marginBottom: '12px' }}>İlgili Personel</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', backgroundColor: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '8px' }}>
                      {personnelList.map((p, idx) => (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.relatedPersonnel.includes(p)}
                            onChange={(e) => {
                              const newList = e.target.checked 
                                ? [...formData.relatedPersonnel, p]
                                : formData.relatedPersonnel.filter(item => item !== p);
                              setFormData({ ...formData, relatedPersonnel: newList });
                            }}
                          />
                          {p}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Section */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '16px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="var(--error)" /> Medikal Bilgiler
                </h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Alerjiniz var mı?</label>
                    <textarea name="medical_allergies" value={formData.medical_allergies} onChange={handleChange} className="form-input" rows="2" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kullanmakta olduğunuz ilaçlar?</label>
                    <textarea name="medical_medications" value={formData.medical_medications} onChange={handleChange} className="form-input" rows="2" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Özel sağlık sorunlarınız/teşhisler?</label>
                    <textarea name="medical_health_problems" value={formData.medical_health_problems} onChange={handleChange} className="form-input" rows="2" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Olduğunuz tüm ameliyatlar?</label>
                    <textarea name="medical_surgeries" value={formData.medical_surgeries} onChange={handleChange} className="form-input" rows="2" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alkol/Sigara/Yabancı Madde kullanımı ve sıklığı?</label>
                    <textarea name="medical_substances" value={formData.medical_substances} onChange={handleChange} className="form-input" rows="2" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Otoimmün bir hastalığınız var mı?</label>
                    <textarea name="medical_autoimmune" value={formData.medical_autoimmune} onChange={handleChange} className="form-input" rows="2" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Yaptırdığınız uygulamalar?</label>
                    <textarea name="medical_procedures" value={formData.medical_procedures} onChange={handleChange} className="form-input" rows="2" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Medikal cihazlarla yaptırdığınız tedaviler?</label>
                    <textarea name="medical_treatments" value={formData.medical_treatments} onChange={handleChange} className="form-input" rows="2" />
                  </div>
                </div>
              </div>

              {/* Travel & Accommodation Section */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '16px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plane size={18} color="var(--accent-color)" /> Transfer & Konaklama Bilgileri
                </h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label"><Hotel size={12}/> Otel Bilgisi</label>
                    <input name="accommodation_hotel" value={formData.accommodation_hotel} onChange={handleChange} className="form-input" placeholder="Otel adı..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Konaklama Detayı</label>
                    <input name="accommodation_details" value={formData.accommodation_details} onChange={handleChange} className="form-input" placeholder="Oda tipi, özel istekler..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Geliş Tarihi</label>
                    <input type="date" name="travel_arrival_date" value={formData.travel_arrival_date} onChange={handleChange} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dönüş Tarihi</label>
                    <input type="date" name="travel_departure_date" value={formData.travel_departure_date} onChange={handleChange} className="form-input" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Transfer Detayları & Güzergah</label>
                    <textarea name="transfer_details" value={formData.transfer_details} onChange={handleChange} className="form-input" rows="2" placeholder="Havalimanı karşılama, VIP araç vb..." />
                  </div>
                </div>
              </div>

              {/* Gallery Section */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '16px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={18} color="var(--accent-color)" /> Galeri / Görseller
                </h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  {formData.gallery.map((img, i) => (
                    <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={img.url} alt="upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, gallery: formData.gallery.filter((_, idx) => idx !== i)})}
                        style={{ position: 'absolute', top: '4px', right: '4px', padding: '2px', background: 'rgba(239, 68, 68, 0.8)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  
                  <label style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    {uploading ? (
                      <div className="admin-login-spinner" style={{ width: '20px', height: '20px' }}></div>
                    ) : (
                      <>
                        <Camera size={20} color="var(--text-secondary)" />
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>Ekle</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        if (files.length === 0) return;
                        setUploading(true);
                        try {
                          const newUploads = [];
                          for (const file of files) {
                            const result = await uploadFile(file);
                            if (result) newUploads.push({ url: result.url, name: result.name });
                          }
                          setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...newUploads] }));
                        } catch (err) {
                          alert("Görsel yüklenemedi!");
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }} disabled={uploading}>
              <PlusCircle size={20} />
              {uploading ? 'Yükleniyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
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

export default NewLead;
