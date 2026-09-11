import React, { useState, useContext } from 'react';
import { Capacitor } from '@capacitor/core';
import { Download } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';
import { AppContext } from '../context/AppContext';
import bgImg from '../assets/login_page_background.webp';
import fallbackLogoImg from '../assets/ihc_logo.webp';
import zbtLogo from '../assets/zbt_media_beyaz_logo.webp';

const Login = () => {
  const { login, tenantConfig, tenantSlug, requestPasswordReset } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Sifre sifirlama: aciklandiginda e-posta alani ustteki formdan devralinir.
  const [resetOpen, setResetOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Önce e-posta adresinizi yazın.');
      return;
    }
    setResetBusy(true);
    setError('');
    await requestPasswordReset(email);
    setResetBusy(false);
    setResetSent(true);
  };

  // login artik Firebase Auth'a gittigi icin asenkron.
  const handleLogin = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const success = await login(email, password);
    setBusy(false);
    if (!success) {
      setError('Hatalı e-posta veya şifre.');
    }
  };

  const getBrandInfo = () => {
    if (tenantConfig) {
      return {
        name: tenantConfig.name,
        color: tenantConfig.primaryColor || '#6366f1',
        isDefault: false
      };
    }
    return { name: 'CRM Sistemi', color: '#6366f1', isDefault: true };
  };

  const brand = getBrandInfo();

  // Mobil uygulamanın kendi içinde indirme butonu anlamsız; sadece tarayıcıda gösterilir.
  const showAppDownload = !Capacitor.isNativePlatform();

  return (
    <div className="auth-container" style={{ 
      backgroundImage: `url(${tenantConfig?.backgroundImage || bgImg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 0 }}></div>
      <div className="card" style={{ maxWidth: '400px', width: '90%', zIndex: 1, backgroundColor: 'rgba(30, 30, 30, 0.85)', backdropFilter: 'blur(10px)', border: `1px solid ${brand.color}40`, boxShadow: `0 10px 40px ${brand.color}20` }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {tenantConfig?.logo ? (
            <img src={tenantConfig.logo} alt={brand.name} style={{ height: '70px', objectFit: 'contain', marginBottom: '16px' }} />
          ) : brand.isDefault ? (
            <img src={fallbackLogoImg} alt="IHC Logo" style={{ height: '70px', objectFit: 'contain', marginBottom: '16px' }} />
          ) : (
            <div style={{ 
              width: '80px', height: '80px', margin: '0 auto 16px', borderRadius: '16px',
              backgroundColor: brand.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {brand.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <h2 style={{ margin: '0 0 4px', fontSize: '20px', color: 'white' }}>{brand.name}</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px' }}>Kurumsal CRM Güvenli Giriş Portalı</p>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">E-posta Adresi</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ornek@gmail.com"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Şifre</label>
            <PasswordInput
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={busy}>
            {busy ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          {resetSent ? (
            <p style={{ fontSize: '12px', color: 'var(--success)', lineHeight: 1.6, margin: 0 }}>
              Adresiniz kayıtlıysa şifre sıfırlama bağlantısı gönderildi.
              Gelen kutunuzu ve spam klasörünü kontrol edin.
            </p>
          ) : resetOpen ? (
            <div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: '10px' }}>
                Yukarıdaki alana e-posta adresinizi yazın, size şifre belirleme
                bağlantısı gönderelim.
              </p>
              <button
                type="button"
                className="btn"
                onClick={handleReset}
                disabled={resetBusy}
                style={{ width: '100%', background: 'transparent', color: 'white', border: `1px solid ${brand.color}` }}
              >
                {resetBusy ? 'Gönderiliyor...' : 'Sıfırlama bağlantısı gönder'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              Şifremi unuttum
            </button>
          )}
        </div>

        {showAppDownload && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 12px' }}>
              Android telefonunuzdan kullanmak için
            </p>
            <a
              href="/app/zbtcrm.apk"
              download="ZBT-CRM.apk"
              className="btn"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', textDecoration: 'none',
                backgroundColor: 'transparent', color: 'white',
                border: `1px solid ${brand.color}`
              }}
            >
              <Download size={16} />
              Android Uygulamasını İndir
            </a>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', margin: '10px 0 0', lineHeight: 1.5 }}>
              Kurulum sırasında &quot;bilinmeyen kaynak&quot; uyarısı çıkarsa izin verin.
              Uygulama ilk açılışta firma kodu ister.
            </p>
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
            <a href="/privacy.html" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>Gizlilik Politikası</a>
            <span>•</span>
            <a href="/terms.html" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>Kullanım Şartları</a>
            <span>•</span>
            <a href="/kvkk.html" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>KVKK Bilgilendirmesi</a>
          </div>

          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px', lineHeight: '1.5' }}>
            © {new Date().getFullYear()} ZBT CRM Systems. All rights reserved.<br/>
            Bu portal yalnızca yetkili kurumsal personelin kullanımı içindir. 
            Yetkisiz erişim teşebbüsleri hukuki takibe tabi tutulacaktır.
          </p>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Powered by</span>
          <img src={zbtLogo} alt="ZBT Media Logo" style={{ height: '20px', opacity: 0.8, filter: 'grayscale(1) brightness(1.5)' }} />
        </div>
      </div>
    </div>
  );
};

export default Login;
