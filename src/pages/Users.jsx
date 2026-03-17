import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ShieldAlert, UserPlus, Settings } from 'lucide-react';

const Users = () => {
  const { currentUser, users, roles, addRole, addUser, updateUser, deleteUser, updateRolePermissions } = useContext(AppContext);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleLevel, setNewRoleLevel] = useState(1);
  const [editingUserId, setEditingUserId] = useState(null);

  const permissionList = [
    { key: 'viewDashboard', label: 'Analiz Paneli Görüntüleme' },
    { key: 'viewLeads', label: 'Lead Listesi Görüntüleme' },
    { key: 'addLead', label: 'Yeni Lead Ekleme' },
    { key: 'editLead', label: 'Lead Detay/Not Düzenleme' },
    { key: 'assignLead', label: 'Lead Atama Yapabilme' },
    { key: 'exportExcel', label: 'Excel Dışa Aktarma' },
    { key: 'manageUsers', label: 'Yetki/Kullanıcı Yönetimi' },
    { key: 'viewLogs', label: 'Log Geçmişi Görüntüleme' },
    { key: 'editProfile', label: 'Profil Düzenleyebilme' }
  ];

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
    if (editingUserId) {
      const roleDef = roles.find(r => r.name === newUser.role);
      updateUser(editingUserId, { 
        ...newUser, 
        level: roleDef ? roleDef.level : 1 
      });
      alert('Kullanıcı Başarıyla Güncellendi!');
      setEditingUserId(null);
    } else {
      if (newUser.name && newUser.email && newUser.password && newUser.role) {
        addUser(newUser);
        alert('Kullanıcı Başarıyla Eklendi!');
      }
    }
    setNewUser({ name: '', email: '', password: '', role: '' });
  };

  const handleEditClick = (u) => {
    setEditingUserId(u.id);
    setNewUser({
      name: u.name,
      email: u.email,
      password: u.password,     
      role: u.role
    });
  };

  const handleDeleteClick = (userId) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      deleteUser(userId);
    }
  };

  const handlePermissionChange = (roleLevel, permKey, value) => {
    const role = roles.find(r => r.level === roleLevel);
    const newPermissions = { ...role.permissions, [permKey]: value };
    updateRolePermissions(roleLevel, newPermissions);
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
            {editingUserId ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Oluştur'}
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
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <UserPlus size={16} />
                {editingUserId ? 'Kullanıcıyı Güncelle' : 'Kullanıcı Kaydet'}
              </button>
              {editingUserId && (
                <button type="button" className="btn btn-secondary" onClick={() => {setEditingUserId(null); setNewUser({name:'',email:'',password:'',role:''})}}>İptal</button>
              )}
            </div>
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
                  <th>İşlem</th>
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
                    <td style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => handleEditClick(u)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }}>
                        Düzenle
                      </button>
                      <button onClick={() => handleDeleteClick(u.id)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Permission Matrix */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Settings size={20} className="text-secondary" />
          Detaylı Yetki Matrisi
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="permission-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Yetki / Özellik</th>
                {roles.sort((a,b) => a.level - b.level).map(role => (
                  <th key={role.level} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    {role.name} <br/> 
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Lvl {role.level}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionList.map(perm => (
                <tr key={perm.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{perm.label}</td>
                  {roles.sort((a,b) => a.level - b.level).map(role => (
                    <td key={`${role.level}-${perm.key}`} style={{ padding: '12px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={role.permissions?.[perm.key] || false}
                        onChange={(e) => handlePermissionChange(role.level, perm.key, e.target.checked)}
                        disabled={role.level === 5} // Admin permissions always true & locked
                        style={{ cursor: role.level === 5 ? 'not-allowed' : 'pointer', width: '18px', height: '18px' }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
