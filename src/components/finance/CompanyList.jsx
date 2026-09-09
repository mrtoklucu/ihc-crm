import React, { useState, useContext } from 'react';
import { FinanceContext } from '../../context/FinanceContext';
import { Building2, Plus, Phone, Mail, FileText, Search, X } from 'lucide-react';

const CompanyList = () => {
  const { companies, addCompany, loading } = useContext(FinanceContext);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await addCompany(formData);
    if (success) {
      alert('Tedarikçi firma kaydedildi!');
      setShowForm(false);
      setFormData({ name: '', taxId: '', phone: '', email: '', address: '' });
    }
  };

  const filtered = companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Yükleniyor...</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={24} color="var(--accent-color)" />
          Firma Listesi (Tedarikçiler)
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Kapat' : 'Yeni Firma Ekle'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Firma Adı</label>
              <input required className="form-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Örn: Aras Kargo" />
            </div>
            <div className="form-group">
              <label className="form-label">Vergi No / VKNo</label>
              <input className="form-input" value={formData.taxId} onChange={(e) => setFormData({...formData, taxId: e.target.value})} placeholder="10 haneli" />
            </div>
            <div className="form-group">
              <label className="form-label">Telefon</label>
              <input className="form-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="05XX..." />
            </div>
            <div className="form-group">
              <label className="form-label">E-posta</label>
              <input className="form-input" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="info@firma.com" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Adres</label>
              <input className="form-input" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <button className="btn btn-primary" style={{ gridColumn: 'span 2' }}>Kaydet</button>
          </form>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', maxWidth: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input className="form-input" style={{ paddingLeft: '34px' }} placeholder="Firma ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filtered.map(c => (
          <div key={c.id} className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>{c.name}</h3>
            <div style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={14} /> {c.phone || '-'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={14} /> {c.email || '-'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={14} /> VN: {c.taxId || '-'}</div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Detay</button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Firma bulunamadı.</div>}
    </div>
  );
};

export default CompanyList;
