import React, { useContext } from 'react';
import { FinanceContext } from '../../context/FinanceContext';
import { Banknote, TrendingUp, TrendingDown, Clock, DollarSign, Wallet } from 'lucide-react';

const CashDesk = () => {
  const { sales, expenses, cashDesk, loading } = useContext(FinanceContext);

  const totalSales = sales.reduce((acc, s) => acc + (s.status === 'collected' ? Number(s.amount) : 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const balance = totalSales - totalExpenses;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  const recentOps = [
    ...sales.map(s => ({ ...s, type: 'in' })),
    ...expenses.map(e => ({ ...e, type: 'out' }))
  ].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Yükleniyor...</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Banknote size={24} color="var(--accent-color)" />
          Kasa & Bakiye Özeti
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '24px', backgroundColor: 'var(--accent-color)', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Güncel Kasa Bakiyesi</div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>{formatCurrency(balance)}</div>
        </div>
        <div className="card" style={{ padding: '24px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
          <div style={{ fontSize: '14px', color: '#10b981', marginBottom: '8px' }}>Toplam Gelir (Tahsil Edilen)</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>{formatCurrency(totalSales)}</div>
        </div>
        <div className="card" style={{ padding: '24px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
          <div style={{ fontSize: '14px', color: '#ef4444', marginBottom: '8px' }}>Toplam Gider</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444' }}>{formatCurrency(totalExpenses)}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '18px' }}>
          <Clock size={20} color="var(--text-secondary)" />
          Son Hareketler
        </h3>
        <div className="admin-tenant-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="admin-tenant-table">
            <thead>
              <tr>
                <th>Tür</th>
                <th>İşlem / Açıklama</th>
                <th>Tarih</th>
                <th style={{ textAlign: 'right' }}>Tutar</th>
              </tr>
            </thead>
            <tbody>
              {recentOps.map((op, idx) => (
                <tr key={idx}>
                  <td>
                    {op.type === 'in' ? 
                      <span className="badge" style={{ backgroundColor: '#10b98115', color: '#10b981', fontSize: '10px' }}><TrendingUp size={10} /> GELİR</span> :
                      <span className="badge" style={{ backgroundColor: '#ef444415', color: '#ef4444', fontSize: '10px' }}><TrendingDown size={10} /> GİDER</span>
                    }
                  </td>
                  <td>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{op.description || (op.type === 'in' ? 'Satış Tahsilatı' : 'Gider Ödemesi')}</div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(op.date).toLocaleDateString('tr-TR')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: op.type === 'in' ? '#10b981' : '#ef4444' }}>
                    {op.type === 'in' ? '+' : '-'}{formatCurrency(op.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentOps.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Henüz hareket yok.</div>}
        </div>
      </div>
    </div>
  );
};

export default CashDesk;
