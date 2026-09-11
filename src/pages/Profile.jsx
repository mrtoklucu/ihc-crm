import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { I18nContext } from '../context/I18nContext';
import { User, Lock, Mail, Globe, ShieldCheck, ShieldAlert } from 'lucide-react';

const Profile = () => {
  const { currentUser, updateUser, requestPasswordReset, emailVerified, sendVerificationEmail } = useContext(AppContext);
  const { t, currentLang, changeLanguage, languages } = useContext(I18nContext);
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('tr');
  const [resetSent, setResetSent] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const handlePasswordReset = async () => {
    setResetBusy(true);
    await requestPasswordReset(currentUser.email);
    setResetBusy(false);
    setResetSent(true);
  };

  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email);
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

    // Sifre bu formdan gonderilmiyor; e-posta onayli ayri akista degisiyor.
    const ok = await updateUser(currentUser.id, { email, language });
    if (!ok) return;

    changeLanguage(language);
    alert('Profil başarıyla güncellendi!');
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

            {/* Kalici durum gostergesi: bant yalnizca dogrulanmamisken cikiyor,
                burasi her zaman gorunur ki durum belirsiz kalmasin. */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
              marginTop: '10px', padding: '10px 12px', borderRadius: '8px',
              background: emailVerified ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${emailVerified ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
            }}>
              {emailVerified ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>
                  <ShieldCheck size={16} /> E-posta doğrulandı
                </span>
              ) : (
                <>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>
                    <ShieldAlert size={16} /> E-posta doğrulanmadı
                  </span>
                  {verifySent ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Doğrulama e-postası gönderildi.
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)' }}
                      onClick={async () => { if (await sendVerificationEmail()) setVerifySent(true); }}
                    >
                      Doğrulama e-postası gönder
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> {t('password')}
            </label>
            {/* Sifre burada dogrudan degistirilmiyor: degisikligin hesabin
                sahibinden geldigini dogrulamak icin kayitli adrese baglanti
                gonderiliyor, yeni sifre orada belirleniyor. */}
            <div style={{
              padding: '14px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)'
            }}>
              {resetSent ? (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--success)', lineHeight: 1.6 }}>
                  Şifre belirleme bağlantısı <strong>{currentUser.email}</strong> adresine
                  gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.
                </p>
              ) : (
                <>
                  <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Güvenlik için şifre buradan doğrudan değiştirilmiyor.
                    Kayıtlı adresinize bağlantı gönderilir, yeni şifrenizi orada belirlersiniz.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handlePasswordReset}
                    disabled={resetBusy}
                  >
                    {resetBusy ? 'Gönderiliyor...' : 'Şifre değiştirme bağlantısı gönder'}
                  </button>
                </>
              )}
            </div>
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
