import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Sifre alani. Sagindaki goz ikonuyla icerigi acip kapatir.
 *
 * Normal bir <input> gibi kullanilir; className ve diger butun ozellikler
 * oldugu gibi input'a aktarilir, boylece hem CRM hem admin panelindeki
 * farkli stiller korunur.
 */
const PasswordInput = ({ className = '', style = {}, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={className}
        style={{ ...style, paddingRight: '42px', width: '100%' }}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
        title={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
        style={{
          position: 'absolute', right: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '34px', height: '34px',
          background: 'none', border: 'none', borderRadius: '6px',
          cursor: 'pointer', color: 'var(--text-secondary)', padding: 0
        }}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
};

export default PasswordInput;
