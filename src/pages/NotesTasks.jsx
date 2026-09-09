import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Trash2, Phone, MessageSquare, MicOff, CheckCircle2, XCircle } from 'lucide-react';

const NotesTasks = () => {
  const { leads, users } = useContext(AppContext);

  // Flatten all history items from all leads into a single list of notes
  const allNotes = useMemo(() => {
    const list = [];
    leads.forEach(lead => {
      if (lead.history && Array.isArray(lead.history)) {
        lead.history.forEach((h, index) => {
          // If the history item has a note that isn't just system generated
          if (h.note && h.note !== 'Lead havuzuna düştü.') {
            list.push({
              id: `${lead.id}-${index}`,
              leadId: lead.id,
              leadName: lead.nameSurname || 'İsimsiz',
              note: h.note,
              type: h.note.toLowerCase().includes('ara') ? 'Arama Notu' : 'Genel',
              reminderDate: h.reminderDate || h.date, // Placeholder if no explicit reminder
              staff: h.author || 'Bilinmiyor',
              creator: h.author || 'Bilinmiyor',
              createdAt: h.date,
              segment: h.status || lead.status,
              isVoiceNote: false,
              isCompleted: false
            });
          }
        });
      }
    });
    // Sort by date desc
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [leads]);

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    let color = '#94a3b8';
    if (statusLower.includes('bekliyor')) color = '#f59e0b';
    if (statusLower.includes('kuruldu')) color = '#10b981';
    if (statusLower.includes('uygun değil')) color = '#ef4444';
    if (statusLower.includes('teklif')) color = '#3b82f6';

    return (
      <span style={{ 
        padding: '4px 8px', 
        borderRadius: '4px', 
        fontSize: '11px', 
        backgroundColor: `${color}15`, 
        color: color,
        border: `1px solid ${color}30`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin:0 }}>Notlar & Görevler</h2>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Toplam {allNotes.length} kayıt</div>
      </div>

      <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Danışan</th>
              <th style={{ width: '30%' }}>Not</th>
              <th>Not Tipi</th>
              <th>Hatırlatma Tarihi</th>
              <th>Personel</th>
              <th>Oluşturan</th>
              <th>Kayıt Tarihi</th>
              <th>Segment</th>
              <th>Durum</th>
              <th>Sesli Not</th>
              <th style={{ textAlign: 'right' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {allNotes.map(note => (
              <tr key={note.id}>
                <td style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{note.leadName}</td>
                <td>
                  <div style={{ fontSize: '13px', lineHeight: '1.4', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {note.note}
                  </div>
                </td>
                <td>
                   <span style={{ 
                     padding: '2px 8px', borderRadius: '4px', fontSize: '10px', 
                     backgroundColor: note.type === 'Arama Notu' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                     color: note.type === 'Arama Notu' ? '#10b981' : 'var(--text-secondary)',
                     border: '1px solid rgba(255,255,255,0.05)'
                   }}>
                     {note.type}
                   </span>
                </td>
                <td style={{ fontSize: '12px' }}>
                  {new Date(note.reminderDate).toLocaleDateString('tr-TR')} <br/>
                  <small style={{ opacity: 0.6 }}>{new Date(note.reminderDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</small>
                </td>
                <td style={{ fontSize: '13px' }}>{note.staff}</td>
                <td style={{ fontSize: '13px' }}>{note.creator}</td>
                <td style={{ fontSize: '12px' }}>
                  {new Date(note.createdAt).toLocaleDateString('tr-TR')} <br/>
                  <small style={{ opacity: 0.6 }}>{new Date(note.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</small>
                </td>
                <td>{getStatusBadge(note.segment)}</td>
                <td>
                  <div style={{ width: '32px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px' }}></div>
                  </div>
                </td>
                <td><XCircle size={16} color="#ef4444" /></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-secondary" style={{ padding: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: 'none' }}>
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                </td>
              </tr>
            ))}
            {allNotes.length === 0 && (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Herhangi bir not bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotesTasks;
