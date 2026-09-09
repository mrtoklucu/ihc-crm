import React, { useContext, useState, useEffect } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { db } from '../../config/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { 
  CreditCard, Calendar, Clock, AlertTriangle, CheckCircle2, 
  Package, Search, PlusCircle, History, XCircle, Settings,
  ArrowRight, MousePointer2, Calculator
} from 'lucide-react';

const Billing = () => {
  const { tenants, editTenant, loadingTenants } = useContext(AdminContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [packageType, setPackageType] = useState('monthly'); // 'monthly', 'yearly', 'custom'
  const [customDays, setCustomDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchHistory = async (tenant) => {
    setLoadingHistory(true);
    setSelectedTenant(tenant);
    try {
      const historyRef = collection(db, 'tenants', tenant.slug, 'subscription_history');
      const q = query(historyRef, orderBy('assignedAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsHistoryOpen(true);
    } catch (err) {
      console.error("Geçmiş yükleme hatası:", err);
      alert("Abonelik geçmişi yüklenemedi.");
    }
    setLoadingHistory(false);
  };

  const handleOpenModal = (tenant) => {
    setSelectedTenant(tenant);
    setPackageType('monthly');
    setIsModalOpen(true);
  };

  const saveToHistory = async (tenantSlug, data) => {
    try {
      const historyRef = collection(db, 'tenants', tenantSlug, 'subscription_history');
      await addDoc(historyRef, {
        ...data,
        assignedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Geçmişe kaydedilemedi:", err);
    }
  };

  const handleAssignPackage = async () => {
    if (!selectedTenant || isSubmitting) return;

    setIsSubmitting(true);
    const now = new Date();
    let endDate = new Date(now);
    
    // Eğer hali hazırda bir vadesi varsa ve bugün dolmadıysa, üzerine ekle
    const currentEnd = selectedTenant.subscriptionEndDate ? new Date(selectedTenant.subscriptionEndDate) : now;
    const baseDate = currentEnd > now ? currentEnd : now;
    endDate = new Date(baseDate);

    let label = "";
    if (packageType === 'monthly') {
      endDate.setDate(baseDate.getDate() + 30);
      label = "Aylık Paket";
    } else if (packageType === 'yearly') {
      endDate.setDate(baseDate.getDate() + 365);
      label = "Yıllık Paket";
    } else {
      endDate.setDate(baseDate.getDate() + parseInt(customDays));
      label = `Özel Paket (${customDays} Gün)`;
    }

    const graceEndDate = new Date(endDate);
    graceEndDate.setDate(endDate.getDate() + 7);

    const subscriptionData = {
      subscriptionType: packageType,
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate: endDate.toISOString(),
      graceEndDate: graceEndDate.toISOString(),
      status: 'active'
    };

    const result = await editTenant(selectedTenant.slug, subscriptionData);
    
    if (result.success) {
      await saveToHistory(selectedTenant.slug, {
        type: packageType,
        action: 'package_assignment',
        label,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        graceEndDate: graceEndDate.toISOString(),
        daysAdded: packageType === 'monthly' ? 30 : (packageType === 'yearly' ? 365 : customDays)
      });
      alert(`${selectedTenant.name} için ${label} başarıyla tanımlandı.`);
      setIsModalOpen(false);
    } else {
      alert("Hata: " + result.error);
    }
    setIsSubmitting(false);
  };

  const handleCancelSubscription = async (tenant) => {
    if (!window.confirm(`${tenant.name} aboneliğini tamamen iptal etmek istediğinize emin misiniz? Firma askıya alınacaktır.`)) return;

    setIsSubmitting(true);
    const result = await editTenant(tenant.slug, {
      subscriptionType: 'none',
      subscriptionEndDate: null,
      graceEndDate: null,
      status: 'suspended'
    });

    if (result.success) {
      await saveToHistory(tenant.slug, {
        type: 'cancellation',
        action: 'subscription_cancelled',
        label: 'Abonelik İptali',
        details: 'Paket manuel olarak iptal edildi.'
      });
      alert("Abonelik iptal edildi.");
      setIsHistoryOpen(false);
    }
    setIsSubmitting(false);
  };

  const calculateDaysLeft = (endDate) => {
    if (!endDate) return null;
    const diff = new Date(endDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="admin-billing-container">
      <div className="admin-page-header">
        <div>
          <h1>Abonelik & Finansal Yönetim</h1>
          <p>Firmaların paketlerini, manuel eklemeleri ve ödeme geçmişlerini buradan yönetebilirsiniz.</p>
        </div>
        <div className="admin-search-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Firma ara..." 
            className="admin-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Firma Listesi</h2>
        </div>
        
        <div className="admin-tenant-table-wrapper">
          <table className="admin-tenant-table">
            <thead>
              <tr>
                <th>Firma</th>
                <th>Paket</th>
                <th>Vade (Bitiş)</th>
                <th>Durum</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map(tenant => {
                const daysLeft = calculateDaysLeft(tenant.subscriptionEndDate);
                const isGrace = daysLeft !== null && daysLeft <= 0 && calculateDaysLeft(tenant.graceEndDate) > 0;
                const isExpired = daysLeft !== null && calculateDaysLeft(tenant.graceEndDate) <= 0;

                return (
                  <tr key={tenant.id}>
                    <td>
                      <div className="admin-tenant-name">
                        <div className="admin-tenant-avatar" style={{ backgroundColor: tenant.primaryColor || '#6366f1' }}>
                          {tenant.logo ? <img src={tenant.logo} alt="L" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'8px' }} /> : tenant.name.charAt(0)}
                        </div>
                        <div>
                          <div>{tenant.name}</div>
                          <div className="admin-subdomain-badge-sm">{tenant.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {tenant.subscriptionType ? (
                        <span style={{ fontWeight: 600 }}>
                          {tenant.subscriptionType === 'monthly' ? 'Aylık' : (tenant.subscriptionType === 'yearly' ? 'Yıllık' : 'Özel')}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <div>{tenant.subscriptionEndDate ? new Date(tenant.subscriptionEndDate).toLocaleDateString('tr-TR') : '-'}</div>
                      {daysLeft !== null && (
                        <div style={{ fontSize: '11px', color: daysLeft <= 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                           {daysLeft > 0 ? `${daysLeft} gün kaldı` : 'Süre doldu'}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`admin-status-badge ${
                        tenant.status === 'suspended' || isExpired ? 'admin-status-suspended' : 
                        (isGrace ? 'admin-status-trial' : 'admin-status-active')
                      }`}>
                        {isExpired ? 'SÜRE BİTTİ' : (isGrace ? 'ÖDEME BEKLENİYOR' : (tenant.status === 'active' ? 'AKTİF' : 'ASKIDA'))}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => fetchHistory(tenant)} title="Geçmiş">
                          <History size={14} />
                        </button>
                        <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => handleOpenModal(tenant)}>
                          <PlusCircle size={14} /> Paket
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paket Atama Modalı */}
      {isModalOpen && selectedTenant && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="admin-modal-header">
              <h2 style={{ fontSize: '18px' }}>Paket Tanımla: {selectedTenant.name}</h2>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}><XCircle size={20} /></button>
            </div>

            <div className="admin-modal-body" style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
                {['monthly', 'yearly', 'custom'].map(type => (
                  <div 
                    key={type}
                    onClick={() => setPackageType(type)}
                    style={{ 
                      padding: '16px 10px', borderRadius: '12px', border: `2px solid ${packageType === type ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)'}`,
                      backgroundColor: packageType === type ? 'rgba(212, 175, 55, 0.05)' : 'rgba(0,0,0,0.1)',
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{type==='monthly' ? '🌙' : (type==='yearly'?'🔆':'✏️')}</div>
                    <div style={{ fontWeight: 700, fontSize: '12px' }}>{type==='monthly' ? 'Aylık' : (type==='yearly'?'Yıllık':'Manuel')}</div>
                  </div>
                ))}
              </div>

              {packageType === 'custom' && (
                <div className="admin-form-group" style={{ marginBottom: '20px' }}>
                  <label className="admin-form-label">Eklenecek Gün Sayısı</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar className="admin-input-icon" size={16} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', opacity:0.5 }} />
                    <input 
                      type="number" 
                      className="admin-form-input" 
                      style={{ paddingLeft: '40px' }}
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div style={{ padding: '16px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  <Clock size={16} className="text-secondary" />
                  <span>Tahmini Yeni Vade: <strong>{
                    packageType === 'monthly' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() :
                    (packageType === 'yearly' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString() :
                    new Date(Date.now() + parseInt(customDays || 0) * 24 * 60 * 60 * 1000).toLocaleDateString())
                  }</strong></span>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer" style={{ padding: '20px', display: 'flex', gap: '10px' }}>
              <button className="admin-btn admin-btn-ghost" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>İptal</button>
              <button className="admin-btn admin-btn-primary" style={{ flex: 2 }} onClick={handleAssignPackage} disabled={isSubmitting}>Aktif Et</button>
            </div>
          </div>
        </div>
      )}

      {/* Geçmiş ve İptal Modalı */}
      {isHistoryOpen && selectedTenant && (
        <div className="admin-modal-overlay" onClick={() => setIsHistoryOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <History style={{ color: 'var(--accent-color)' }} />
                <h2 style={{ fontSize: '18px' }}>{selectedTenant.name} Abonelik Geçmişi</h2>
              </div>
              <button className="admin-modal-close" onClick={() => setIsHistoryOpen(false)}><XCircle size={20} /></button>
            </div>

            <div className="admin-modal-body" style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.map(item => (
                  <div key={item.id} style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, color: item.type === 'cancellation' ? 'var(--error)' : 'var(--success)' }}>{item.label}</span>
                      <span style={{ fontSize: '11px', opacity: 0.5 }}>{new Date(item.assignedAt).toLocaleString()}</span>
                    </div>
                    {item.endDate && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Vade: {new Date(item.endDate).toLocaleDateString()} (+7 Gün Grace)
                      </div>
                    )}
                    {item.details && <div style={{ fontSize: '12px', marginTop: '4px' }}>{item.details}</div>}
                  </div>
                ))}
                {history.length === 0 && <div className="admin-empty-state">Henüz geçmiş kaydı yok.</div>}
              </div>
            </div>

            <div className="admin-modal-footer" style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                className="admin-btn admin-btn-danger-ghost admin-btn-sm" 
                onClick={() => handleCancelSubscription(selectedTenant)}
                disabled={isSubmitting || selectedTenant.status === 'suspended'}
              >
                <XCircle size={14} /> Paketi İptal Et (Askıya Al)
              </button>
              <button className="admin-btn admin-btn-ghost" onClick={() => setIsHistoryOpen(false)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-billing-container { padding: 40px; }
        .text-secondary { color: var(--text-secondary); }
      `}</style>
    </div>
  );
};

export default Billing;
