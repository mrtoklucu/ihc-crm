import React, { useContext, useState } from 'react';
import PasswordInput from '../../components/PasswordInput';
import { AdminContext } from '../../context/AdminContext';

const AdminUsers = () => {
  const { adminUsers, addAdminUser, deleteAdminUser, adminUser, addAdminLog } = useContext(AdminContext);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'support' });
  const [error, setError] = useState('');

  const roles = [
    { key: 'support', label: 'Support', level: 1, color: '#3b82f6', icon: '💬', description: 'Sadece destek taleplerini görüntüleyebilir' },
    { key: 'muhasebe', label: 'Muhasebe', level: 2, color: '#f59e0b', icon: '💳', description: 'Sadece faturalandırma sayfasını görüntüleyebilir' },
    { key: 'superadmin', label: 'Süper Admin', level: 3, color: '#8b5cf6', icon: '👑', description: 'Tüm sayfalara tam erişim' },
  ];

  const getRoleInfo = (roleKey) => roles.find(r => r.key === roleKey) || roles[0];

  const handleAdd = async () => {
    setError('');
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError('Tüm alanları doldurun.');
      return;
    }
    if (newUser.password.length < 4) {
      setError('Şifre en az 4 karakter olmalıdır.');
      return;
    }
    const existing = (adminUsers || []).find(u => u.email === newUser.email);
    if (existing) {
      setError('Bu e-posta ile zaten bir kullanıcı mevcut.');
      return;
    }

    const result = await addAdminUser(newUser);
    if (result.success) {
      setShowModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'support' });
      addAdminLog('Kullanıcı Ekleme', `Yeni admin kullanıcısı eklendi: ${newUser.name} (${newUser.email}) - Rol: ${getRoleInfo(newUser.role).label}`, 'system');
    } else {
      setError(result.error || 'Bir hata oluştu.');
    }
  };

  const handleDelete = async (user) => {
    if (user.email === adminUser?.email) {
      alert('Kendi hesabınızı silemezsiniz!');
      return;
    }
    if (window.confirm(`${user.name} (${user.email}) kullanıcısını silmek istediğinizden emin misiniz?`)) {
      const result = await deleteAdminUser(user.id);
      if (result.success) {
        addAdminLog('Kullanıcı Silme', `Admin kullanıcısı silindi: ${user.name} (${user.email})`, 'system');
      }
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Kullanıcı Yönetimi</h1>
          <p>Süper Admin paneline erişim sağlayan kullanıcıları yönetin</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Kullanıcı Ekle
        </button>
      </div>

      {/* Rol Açıklamaları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {roles.map(role => (
          <div key={role.key} style={{
            padding: '20px',
            borderRadius: '14px',
            backgroundColor: `${role.color}08`,
            border: `1px solid ${role.color}20`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{role.icon}</div>
            <div style={{ fontWeight: 700, color: role.color, fontSize: '15px', marginBottom: '4px' }}>
              Seviye {role.level} — {role.label}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>{role.description}</div>
          </div>
        ))}
      </div>

      {/* Kullanıcı Listesi */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>👥</span>
            Kayıtlı Kullanıcılar
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>({(adminUsers || []).length} kişi)</span>
          </h2>
        </div>

        {(!adminUsers || adminUsers.length === 0) ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
            <h3 style={{ color: 'white', marginBottom: '8px' }}>Henüz kullanıcı yok</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Yukarıdaki butonu kullanarak yeni kullanıcı ekleyebilirsiniz.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-tenant-table">
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>E-posta</th>
                  <th>Rol</th>
                  <th>Seviye</th>
                  <th>Oluşturulma</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {(adminUsers || []).map(user => {
                  const roleInfo = getRoleInfo(user.role);
                  const isSelf = user.email === adminUser?.email;
                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: `linear-gradient(135deg, ${roleInfo.color}40, ${roleInfo.color}20)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px', fontWeight: 700, color: roleInfo.color,
                            border: `1px solid ${roleInfo.color}30`
                          }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'white', fontSize: '14px' }}>{user.name}</div>
                            {isSelf && <span style={{ fontSize: '10px', color: '#22c55e' }}>● Siz</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '13px' }}>{user.email}</td>
                      <td>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: `${roleInfo.color}15`,
                          color: roleInfo.color,
                          border: `1px solid ${roleInfo.color}30`
                        }}>
                          {roleInfo.icon} {roleInfo.label}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '28px', height: '28px', borderRadius: '8px',
                          backgroundColor: `${roleInfo.color}15`, color: roleInfo.color,
                          fontWeight: 700, fontSize: '14px',
                          border: `1px solid ${roleInfo.color}30`
                        }}>
                          {roleInfo.level}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td>
                        {!isSelf ? (
                          <button
                            onClick={() => handleDelete(user)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              backgroundColor: 'rgba(239, 68, 68, 0.08)',
                              color: '#f87171',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Sil
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#475569' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Kullanıcı Ekleme Modalı */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div style={{
            backgroundColor: '#1a1a2e', borderRadius: '16px',
            padding: '32px', width: '90%', maxWidth: '440px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'white', marginBottom: '24px', fontSize: '18px' }}>
              ➕ Yeni Kullanıcı Ekle
            </h3>

            {error && (
              <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>Ad Soyad</label>
                <input
                  type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Örn: Ahmet Yılmaz"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>E-posta</label>
                <input
                  type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                  placeholder="ornek@gmail.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>Şifre</label>
                <PasswordInput
                  value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                  placeholder="••••••••"
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>Rol</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {roles.map(role => (
                    <button
                      key={role.key}
                      onClick={() => setNewUser({...newUser, role: role.key})}
                      style={{
                        flex: 1, padding: '12px 8px', borderRadius: '10px',
                        border: newUser.role === role.key ? `2px solid ${role.color}` : '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: newUser.role === role.key ? `${role.color}15` : 'rgba(255,255,255,0.02)',
                        color: newUser.role === role.key ? role.color : '#64748b',
                        cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        textAlign: 'center', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{role.icon}</div>
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'transparent', color: '#94a3b8',
                  cursor: 'pointer', fontSize: '14px'
                }}
              >
                İptal
              </button>
              <button
                onClick={handleAdd}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600
                }}
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
