import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { User, Lock, Mail } from 'lucide-react';

const Profile = () => {
  const { currentUser, updateUser } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email);
      setPassword(currentUser.password);
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

  const handleUpdate = (e) => {
    e.preventDefault();
    
    // We update only what the user wants: password/email
    updateUser(currentUser.id, { email, password });
    alert('Profil başarıyla güncellendi!');
  };

  return (
    <div>
      <h1 className="page-title">Profilim</h1>
      
      <div className="card" style={{ maxWidth: '500px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '18px' }}>
          <User size={20} className="text-secondary" /> Profil Bilgilerini Güncelle
        </h2>
        
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> E-posta Adresiniz
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
              <Lock size={14} /> Yeni Şifreniz
            </label>
            <input 
              type="text"
              required
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Giriş yaparken kullandığınız şifre"
            />
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Not: Adınız veya yetki seviyeniz gibi sistem kritik bilgileriniz ancak yetkili bir Yönetici (Koordinatör/Admin) tarafından güncellenebilir.
          </p>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Değişiklikleri Kaydet
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
