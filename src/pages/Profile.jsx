import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { I18nContext } from '../context/I18nContext';
import { User, Lock, Mail, Globe } from 'lucide-react';

const Profile = () => {
  const { currentUser, updateUser } = useContext(AppContext);
  const { t, currentLang, changeLanguage, languages } = useContext(I18nContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('tr');

  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email);
      // Sifre artik Firebase Auth'ta ve okunamiyor; alan bos baslar, yalnizca
      // kullanici yeni bir sifre yazarsa degistirilir.
      setPassword('');
      setLanguage(currentUser.language || currentLang);
    }
  }, [currentUser]);

  if (!currentUser || currentUser.level === 1) {
    return (
      <div>
        <h1 className="page-title">Yetki Hatası</h1>
        <div className="card"><p>Profil düzenleme yetkiniz bulunmamaktadır (Misafir vb).</p></div>
      </div>
    );
  }

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (password && password.length < 8) {
      alert('Şifre en az 8 karakter olmalı.');
      return;
    }

    // Sifre yalnizca doldurulduysa gonderilir; bos birakilirsa degismez.
    const changes = { email, language };
    if (password) changes.password = password;

    const ok = await updateUser(currentUser.id, changes);
    if (!ok) return;

    changeLanguage(language);
    setPassword('');
    alert(password ? 'Profil ve şifre güncellendi!' : 'Profil başarıyla güncellendi!');
  };

  return (
    <div>
      <h1 className="page-title">{t('profile')}</h1>
      
      <div className="card" style={{ maxWidth: '500px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '18px' }}>
          <User size={20} className="text-secondary" /> {t('settings')}
        </h2>
        
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> {t('email')}
            </label>
            <input 
              type="email"
              required
              className="form-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> {t('password')}
            </label>
            <input 
              type="text"
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Değiştirmek istemiyorsanız boş bırakın"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} /> {t('language')}
            </label>
            <select 
              className="form-input" 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ padding: '12px' }}
            >
              <option value="tr">Türkçe (Main)</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="ru">Русский</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Not: Adınız veya yetki seviyeniz gibi sistem kritik bilgileriniz ancak yetkili bir Yönetici (Koordinatör/Admin) tarafından güncellenebilir.
          </p>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {t('save')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
