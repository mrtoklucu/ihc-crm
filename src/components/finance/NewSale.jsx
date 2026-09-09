import React, { useState, useContext } from 'react';
import { FinanceContext } from '../../context/FinanceContext';
import { AppContext } from '../../context/AppContext';
import { CreditCard, User, DollarSign, Calendar, FileText, ShoppingCart } from 'lucide-react';

const NewSale = () => {
  const { addSale } = useContext(FinanceContext);
  const { leads } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leadId: '',
    amount: '',
    currency: 'TRY',
    status: 'collected', // collected, pending, cancelled
    description: '',
    paymentMethod: 'cash'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await addSale(formData);
    if (success) {
      alert('Satış başarıyla kaydedildi!');
      setFormData({ leadId: '', amount: '', currency: 'TRY', status: 'collected', description: '', paymentMethod: 'cash' });
    }
    setLoading(false);
  };

  return (
    <div className="admin-section" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="admin-section-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={24} color="var(--accent-color)" />
          Yeni Satış Kaydı
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> Müşteri (Lead) Seçimi
            </label>
            <select
              required
              className="form-input"
              value={formData.leadId}
              onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
            >
              <option value="">Lütfen seçim yapın...</option>
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>{lead.nameSurname}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={14} /> Satış Tutarı
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
              <CreditCard size={14} /> Ödeme Durumu
            </label>
            <select
              className="form-input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="collected">Ödeme Alındı (Tahsil Edildi)</option>
              <option value="pending">Ödeme Bekliyor</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Ödeme Yöntemi
            </label>
            <select
              className="form-input"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            >
              <option value="cash">Nakit</option>
              <option value="credit_card">Kredi Kartı</option>
              <option value="bank_transfer">Banka Havalesi (EFT)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} /> Satış Açıklaması
          </label>
          <textarea
            className="form-input"
            style={{ height: '100px' }}
            placeholder="Satışa dair eklemek istediğiniz notlar..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          ></textarea>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 700 }}>
          {loading ? 'Kaydediliyor...' : 'Satışı Kaydet'}
        </button>
      </form>
    </div>
  );
};

export default NewSale;
