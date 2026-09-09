import React, { useState } from 'react';
import { getTenantByAppCode, rememberTenantSlug } from '../utils/tenantUtils';
import logo from '../assets/ihc_logo.webp';

/**
 * Mobil uygulamanin ilk acilis ekrani.
 *
 * Native uygulamada subdomain olmadigi icin firma tespit edilemez.
 * Kullanici super admin panelinde firmaya atanan erisim kodunu girer,
 * kod bir kez dogrulandiktan sonra cihazda saklanir ve tekrar sorulmaz.
 */
const AppCodeGate = ({ onResolved }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState({ loading: false, error: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status.loading) return;

    setStatus({ loading: true, error: null });
    try {
      const tenant = await getTenantByAppCode(code);

      if (!tenant) {
        setStatus({ loading: false, error: 'Bu koda ait bir firma bulunamadı. Kodu kontrol edip tekrar deneyin.' });
        return;
      }
      if (tenant.status === 'suspended') {
        setStatus({ loading: false, error: 'Bu firmanın sistemi şu anda askıya alınmış durumda.' });
        return;
      }

      rememberTenantSlug(tenant.slug);
      onResolved(tenant);
    } catch {
      setStatus({ loading: false, error: 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.' });
    }
  };

  return (
    <div className="tenant-not-found" style={{ padding: '24px' }}>
      <div className="tenant-not-found-card" style={{ maxWidth: '380px' }}>
        <img src={logo} alt="" style={{ height: '52px', marginBottom: '24px' }} />

        <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>Firma Kodu</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: 1.5 }}>
          Uygulamayı kullanmaya başlamak için firmanıza ait erişim kodunu girin.
          Kodu yöneticinizden alabilirsiniz.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            className="form-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="ÖRN: IHC2026"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={20}
            style={{
              textAlign: 'center', fontSize: '22px', letterSpacing: '3px',
              fontWeight: 700, padding: '16px', marginBottom: '16px'
            }}
          />

          {status.error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)',
              padding: '12px', borderRadius: '8px', fontSize: '13px',
              marginBottom: '16px', lineHeight: 1.4
            }}>
              {status.error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={status.loading || code.length < 3}
            style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
          >
            {status.loading ? 'Kontrol ediliyor...' : 'Devam Et'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AppCodeGate;
