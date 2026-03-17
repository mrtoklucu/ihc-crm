import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { PlusCircle, Globe } from 'lucide-react';

// Common country codes mapping
const countryCodesMap = {
  '+90': { name: 'Türkiye', code: 'tr' },
  '+1': { name: 'ABD/Kanada', code: 'us' },
  '+44': { name: 'İngiltere', code: 'gb' },
  '+49': { name: 'Almanya', code: 'de' },
  '+33': { name: 'Fransa', code: 'fr' },
  '+39': { name: 'İtalya', code: 'it' },
  '+34': { name: 'İspanya', code: 'es' },
  '+7': { name: 'Rusya', code: 'ru' },
  '+971': { name: 'Bae', code: 'ae' },
  '+31': { name: 'Hollanda', code: 'nl' },
  '+966': { name: 'Suudi Arabistan', code: 'sa' },
  '+965': { name: 'Kuveyt', code: 'kw' },
  '+974': { name: 'Katar', code: 'qa' },
  '+32': { name: 'Belçika', code: 'be' },
  '+43': { name: 'Avusturya', code: 'at' },
  '+41': { name: 'İsviçre', code: 'ch' },
  '+46': { name: 'İsveç', code: 'se' },
  '+47': { name: 'Norveç', code: 'no' },
  '+45': { name: 'Danimarka', code: 'dk' },
};

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

const NewLead = () => {
  const { currentUser, addLead, checkPermission } = useContext(AppContext);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nameSurname: '',
    email: '',
    phone: '',
    country: '',
    countryCode: '',
    source: '',
    note: ''
  });

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

    // Auto country logic
    if (name === 'phone' && value) {
      // Very basic detection of country code
      let matched = false;
      // Sort keys by length descending to match longest code first
      const keys = Object.keys(countryCodesMap).sort((a,b) => b.length - a.length);
      for (const code of keys) {
        if (value.startsWith(code)) {
          newFormData.country = countryCodesMap[code].name;
          newFormData.countryCode = countryCodesMap[code].code;
          matched = true;
          break;
        }
      }
      if (!matched) {
        newFormData.countryCode = '';
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addLead(formData);
    setSuccess(true);
    setFormData({
      nameSurname: '', email: '', phone: '', country: '', countryCode: '', source: '', note: ''
    });
    
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
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
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={12}/> Alan kodu ile girildiğinde ülke ve bayrak otomatik dolar.
            </span>
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

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Not</label>
            <textarea 
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="form-input" 
              rows="4" 
              placeholder="Lead için ekstra notlar..." 
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>
              <PlusCircle size={20} />
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewLead;
