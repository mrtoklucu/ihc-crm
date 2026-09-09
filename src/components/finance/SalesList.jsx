import React, { useContext, useState } from 'react';
import { FinanceContext } from '../../context/FinanceContext';
import { AppContext } from '../../context/AppContext';
import { ShoppingCart, User, Calendar, CreditCard, Search, DollarSign } from 'lucide-react';

const SalesList = () => {
  const { sales, loading } = useContext(FinanceContext);
  const { leads } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = sales.filter(sale => {
    const lead = leads.find(l => l.id === sale.leadId);
    const leadName = lead ? lead.nameSurname.toLowerCase() : '';
    const description = sale.description ? sale.description.toLowerCase() : '';
    return leadName.includes(searchTerm.toLowerCase()) || description.includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'collected': return <span className="badge badge-success">Tahsil Edildi</span>;
      case 'pending': return <span className="badge badge-warning">Bekliyor</span>;
      case 'cancelled': return <span className="badge badge-error">İptal Edildi</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Yükleniyor...</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={24} color="var(--accent-color)" />
          Satış Listesi
        </h2>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px' }}
            placeholder="Müşteri veya açıklama ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-tenant-table-wrapper">
        <table className="admin-tenant-table">
          <thead>
            <tr>
              <th>Müşteri</th>
              <th>Tutar</th>
              <th>Durum</th>
              <th>Ödeme Yöntemi</th>
              <th>Tarih</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => (
              <tr key={sale.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{leads.find(l => l.id === sale.leadId)?.nameSurname || 'Bilinmeyen'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{sale.description}</div>
                </td>
                <td style={{ fontWeight: 800 }}>{formatCurrency(sale.amount, sale.currency)}</td>
                <td>{getStatusBadge(sale.status)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <CreditCard size={14} /> {sale.paymentMethod === 'cash' ? 'Nakit' : (sale.paymentMethod === 'credit_card' ? 'Kredi Kartı' : 'Havale/EFT')}
                  </div>
                </td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {new Date(sale.date).toLocaleDateString('tr-TR')}
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm">Detay</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSales.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Satış kaydı bulunamadı.</div>}
      </div>
    </div>
  );
};

export default SalesList;
