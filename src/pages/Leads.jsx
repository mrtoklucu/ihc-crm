import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Share, UserCheck } from 'lucide-react';

const Leads = () => {
  const { currentUser, leads, users, assignLead } = useContext(AppContext);
  const [selectedAssignee, setSelectedAssignee] = useState({});

  // Sales consultants
  const salesConsultants = users.filter(u => u.level === 2);

  // Filter leads based on role
  let visibleLeads = [];
  if (currentUser.level >= 4) {
    // 4 and 5 see all leads
    visibleLeads = leads;
  } else if (currentUser.level === 2) {
    // 2 sees only their assigned leads
    visibleLeads = leads.filter(l => l.assigneeId === currentUser.id);
  } else {
    // Levels 1 and 3 don't see anything explicitly per prompt, or we can just say "yetkiniz yok"
    return (
      <div>
        <h1 className="page-title">Lead Listesi</h1>
        <div className="card">
          <p>Bu sayfayı görüntülemek için yeterli yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  const handleAssign = (leadId) => {
    const userId = parseInt(selectedAssignee[leadId]);
    if (userId) {
      assignLead(leadId, userId);
      alert('Lead başarıyla satış danışmanına atandı!');
    } else {
      alert('Lütfen bir satış danışmanı seçin.');
    }
  };

  return (
    <div>
      <h1 className="page-title">Lead Listesi</h1>

      <div className="card table-container">
        {visibleLeads.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            Henüz size ait veya atanmamış bir lead bulunamadı.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ad-Soyad</th>
                <th>Ülke</th>
                <th>Telefon</th>
                <th>Kaynak</th>
                <th>Kayıt Tarihi</th>
                <th>Durum / Atama</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeads.map(lead => {
                const isAssigned = lead.assigneeId !== null;
                const assigneeUser = isAssigned ? users.find(u => u.id === lead.assigneeId) : null;
                
                return (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{lead.nameSurname}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{lead.email}</div>
                    </td>
                    <td>{lead.country || '-'}</td>
                    <td>{lead.phone}</td>
                    <td><span className="badge">{lead.source}</span></td>
                    <td>{new Date(lead.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td>
                      {currentUser.level >= 4 ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {!isAssigned ? (
                            <>
                              <select
                                className="form-input"
                                style={{ padding: '6px', width: 'auto', fontSize: '13px' }}
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
                                <Share size={14} /> Atama Yap
                              </button>
                            </>
                          ) : (
                            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <UserCheck size={14} /> Atandı: {assigneeUser?.name}
                            </span>
                          )}
                        </div>
                      ) : (
                        // Lvl 2 view
                        <span className="badge badge-success">Sizin Müşteriniz</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Leads;
