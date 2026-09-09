import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { I18nContext } from '../context/I18nContext';
import { Trash2, UserPlus, Share2, Search, Filter, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const LeadPool = () => {
  const { leads, users, assignLead, deleteLead, checkPermission, currentUser } = useContext(AppContext);
  const { t } = useContext(I18nContext);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState({});

  // Only show leads in pool
  const poolLeads = useMemo(() => {
    return leads.filter(l => l.status === 'Havuzda').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [leads]);

  // Filter based on search and source
  const filteredLeads = useMemo(() => {
    return poolLeads.filter(lead => {
      const searchMatch = lead.nameSurname.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (lead.phone && lead.phone.includes(searchTerm)) ||
                          (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const sourceMatch = !filterSource || lead.source === filterSource;
      return searchMatch && sourceMatch;
    });
  }, [poolLeads, searchTerm, filterSource]);

  const salesConsultants = users.filter(u => u.level === 2);

  const handleAssign = async (leadId) => {
    const userId = selectedAssignee[leadId];
    if (!userId) {
      alert("Lütfen bir danışman seçin.");
      return;
    }
    
    const assignee = users.find(u => u.id === userId);
    if (window.confirm(`${assignee?.name} isimli danışmana bu lead'i atamak ve havuzdan onaylamak istiyor musunuz?`)) {
      await assignLead(leadId, userId);
      // Remove from pool is handled by the state update in context which changes status from 'Havuzda'
    }
  };

  const handleDelete = async (leadId, name) => {
    if (window.confirm(`${name} isimli lead'i havuzdan kalıcı olarak silmek istiyor musunuz?`)) {
      await deleteLead(leadId);
    }
  };

  if (!checkPermission('assignLead') && !checkPermission('manageUsers')) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
        <h2>Yetkiniz Yok</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Bu sayfaya erişmek için gerekli yetkilere sahip değilsiniz.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{t('leadPool')}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Yeni gelen ve entegrasyon üzerinden düşen onaylanmamış leadleri yönetin.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '12px 20px', borderRadius: '12px', border: '1px solid #fbbf2430' }}>
          <Clock size={20} color="#fbbf24" />
          <span style={{ color: '#fbbf24', fontWeight: 600 }}>{poolLeads.length} Lead Bekliyor</span>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="İsim, telefon veya e-posta ile ara..." 
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="form-input" 
            style={{ width: '200px' }}
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
          >
            <option value="">Tüm Kaynaklar</option>
            <option value="Manual">Manuel Giriş</option>
            <option value="Facebook">Facebook</option>
            <option value="TikTok">TikTok</option>
            <option value="WebSite">Web Site</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {filteredLeads.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--text-secondary)' }}>Havuzda bekleyen lead bulunmamaktadır.</h3>
          </div>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Ad Soyad</th>
                <th>İletişim</th>
                <th>Kaynak</th>
                <th>Geliş Tarihi</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-secondary)' }}>
                      #{String(lead.id).substring(0, 6).toUpperCase()}
                    </td>
                    <td>
                      <Link to={`/leads/${lead.id}`} style={{ fontWeight: 600, color: 'var(--accent-color)', textDecoration: 'none' }}>
                        {lead.nameSurname}
                      </Link>
                    </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{lead.phone}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{lead.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-secondary">{lead.source || 'Belirtilmedi'}</span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(lead.createdAt).toLocaleString('tr-TR')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <select
                        className="form-input"
                        style={{ padding: '6px', width: '160px', fontSize: '12px' }}
                        value={selectedAssignee[lead.id] || ''}
                        onChange={(e) => setSelectedAssignee({...selectedAssignee, [lead.id]: e.target.value})}
                      >
                        <option value="" disabled>Danışman Seçin</option>
                        {salesConsultants.map(sc => (
                          <option key={sc.id} value={sc.id}>{sc.name}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleAssign(lead.id)} 
                        className="btn btn-primary btn-sm"
                        style={{ padding: '6px 12px' }}
                      >
                        <UserPlus size={14} /> Onayla ve Ata
                      </button>
                      <button 
                         onClick={() => handleDelete(lead.id, lead.nameSurname)}
                         className="btn btn-secondary btn-sm"
                         style={{ padding: '6px', border: '1px solid #ef444430', color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LeadPool;
