import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ShieldAlert, UserPlus, Settings } from 'lucide-react';

const Users = () => {
  const { currentUser, users, roles, addRole, addUser } = useContext(AppContext);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleLevel, setNewRoleLevel] = useState(1);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: ''
  });

  if (currentUser.level !== 5) {
    return (
      <div>
        <h1 className="page-title">Yetki Hatası</h1>
        <p>Siz bu sayfayı görüntülemeye yetkili değilsiniz.</p>
      </div>
    );
  }

  const handleAddRole = (e) => {
    e.preventDefault();
    if (newRoleName && newRoleLevel) {
      addRole(newRoleName, newRoleLevel);
      alert('Yeni Yetki Eklendi!');
      setNewRoleName('');
    }
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (newUser.name && newUser.email && newUser.password && newUser.role) {
      addUser(newUser);
      alert('Kullanıcı Başarıyla Eklendi!');
      setNewUser({ name: '', email: '', password: '', role: '' });
    }
  };

  return (
    <div>
      <h1 className="page-title">Sistem & Yetki Yönetimi</h1>
      
      <div className="grid-2">
        {/* Role Management */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Settings size={20} className="text-secondary" />
            Yetki Seviyeleri (1-5)
          </h2>
          
          <table style={{ marginBottom: '24px' }}>
            <thead>
              <tr>
                <th>Seviye</th>
                <th>Rol Adı</th>
              </tr>
            </thead>
            <tbody>
              {roles.sort((a,b) => b.level - a.level).map((r, idx) => (
                <tr key={idx}>
                  <td><span className="badge badge-success">Lvl {r.level}</span></td>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <form onSubmit={handleAddRole} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Yeni Rol Üret</h3>
            <div className="form-group">
              <label className="form-label">Rol Adı</label>
              <input 
                required
                className="form-input" 
                value={newRoleName} 
                onChange={(e) => setNewRoleName(e.target.value)} 
                placeholder="Örn: Süper Admin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Yetki Seviyesi (1-5)</label>
              <input 
                required
                type="number"
                min="1"
                max="5"
                className="form-input" 
                value={newRoleLevel} 
                onChange={(e) => setNewRoleLevel(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
              <ShieldAlert size={16} />
              Yetkiyi Kaydet
            </button>
          </form>
        </div>

        {/* User Management */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <UserPlus size={20} className="text-secondary" />
            Yeni Kullanıcı Oluştur
          </h2>
          
          <form onSubmit={handleAddUser}>
            <div className="form-group">
              <label className="form-label">Ad Soyad</label>
              <input 
                required
                className="form-input" 
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                placeholder="Mehmet Can"
              />
            </div>
            <div className="form-group">
              <label className="form-label">E-posta</label>
              <input 
                type="email"
                required
                className="form-input" 
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="ornek@gmail.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Şifre</label>
              <input 
                required
                type="password"
                className="form-input" 
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sistem Yetkisi / Rolü</label>
              <select 
                required
                className="form-input"
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="" disabled>Seçiniz...</option>
                {roles.map((r, idx) => (
                  <option key={idx} value={r.name}>{r.name} (Lvl {r.level})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              <UserPlus size={16} />
              Kullanıcı Kaydet
            </button>
          </form>

          <h3 style={{ marginTop: '32px', marginBottom: '16px', fontSize: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            Mevcut Kullanıcılar
          </h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>Rol / Seviye</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{u.email}</div>
                    </td>
                    <td>
                      <span className="badge">{u.role} - Lvl {u.level}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Users;
