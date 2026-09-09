import React, { useState, useContext } from 'react';
import { FinanceContext } from '../../context/FinanceContext';
import { AppContext } from '../../context/AppContext';
import { Upload, DollarSign, Building2, Tag, FileText, Calendar } from 'lucide-react';

const RecordExpense = () => {
  const { addExpense, companies } = useContext(FinanceContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyId: '',
    amount: '',
    currency: 'TRY',
    category: 'general', // general, rent, salary, marketing, tax
    description: '',
    invoiceDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await addExpense(formData);
    if (success) {
      alert('Gider başarıyla kaydedildi!');
      setFormData({ companyId: '', amount: '', currency: 'TRY', category: 'general', description: '', invoiceDate: new Date().toISOString().split('T')[0] });
    }
    setLoading(false);
  };

  const categories = [
    { id: 'general', label: 'Genel Gider' },
    { id: 'rent', label: 'Kira' },
    { id: 'salary', label: 'Personel Maaşı' },
    { id: 'marketing', label: 'Pazarlama/Reklam' },
    { id: 'tax', label: 'Vergi/SGK' },
    { id: 'utility', label: 'Elektrik/Su/İnternet' },
    { id: 'supply', label: 'Malzeme/Ürün Alımı' }
  ];

  return (
    <div className="admin-section" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="admin-section-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={24} color="#ef4444" />
          Yeni Gider Kaydı
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={14} /> Tedarikçi Firma
            </label>
            <select
              required
              className="form-input"
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
            >
              <option value="">Lütfen seçim yapın...</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={14} /> Gider Tutarı
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                required
                type="number"
                className="form-input"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <select 
                className="form-input" 
                style={{ width: '100px' }}
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="TRY">₺ TRY</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={14} /> Gider Kategorisi
            </label>
            <select
              className="form-input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Fatura/İşlem Tarihi
            </label>
            <input
              required
              type="date"
              className="form-input"
              value={formData.invoiceDate}
              onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} /> Gider Açıklaması
          </label>
          <textarea
            className="form-input"
            style={{ height: '100px' }}
            placeholder="Gidere dair eklemek istediğiniz notlar..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          ></textarea>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 700, backgroundColor: '#ef4444', borderColor: '#ef4444' }}>
          {loading ? 'Kaydediliyor...' : 'Gideri Kaydet'}
        </button>
      </form>
    </div>
  );
};

export default RecordExpense;
