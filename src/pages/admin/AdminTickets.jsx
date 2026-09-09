import React, { useContext, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { Paperclip, File, X } from 'lucide-react';

const AdminTickets = () => {
  const { supportTickets, loadingTickets, adminReplyTicket, adminCloseTicket } = useContext(AdminContext);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  if (loadingTickets) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="admin-login-spinner" style={{ margin: '0 auto', width: '32px', height: '32px', borderColor: 'rgba(99, 102, 241, 0.3)', borderTopColor: '#6366f1' }}></div>
        <p style={{ marginTop: '16px', color: '#94a3b8' }}>Ticket'lar yükleniyor...</p>
      </div>
    );
  }

  const handleReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || (!replyText.trim() && !selectedFile)) return;

    setIsUploading(true);
    const success = await adminReplyTicket(selectedTicket.id, replyText, selectedFile);
    setIsUploading(false);

    if (success) {
      const newMsg = {
        id: Date.now().toString(),
        sender: 'Süper Admin',
        senderType: 'admin',
        text: replyText,
        attachment: selectedFile ? { name: selectedFile.name, isImage: selectedFile.type.startsWith('image/'), url: URL.createObjectURL(selectedFile) } : null,
        timestamp: new Date().toISOString()
      };

      setReplyText('');
      setSelectedFile(null);
      // Update selected ticket in view
      const updatedTicket = {
        ...selectedTicket,
        status: 'Yanıtlandı',
        messages: [...(selectedTicket.messages || []), newMsg]
      };
      setSelectedTicket(updatedTicket);
    } else {
      alert("Yanıt gönderilemedi.");
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    if (window.confirm('Bu destek talebini kapatmak istediğinize emin misiniz?')) {
      await adminCloseTicket(selectedTicket.id);
      setSelectedTicket({ ...selectedTicket, status: 'Kapandı' });
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>Destek Talepleri (Tickets)</h1>
          <p>Tüm firmalardan gelen destek taleplerini görüntüleyin ve yanıtlayın.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Ticket Listesi */}
        <div style={{ flex: '1', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          {supportTickets.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
              <h3>Henüz destek talebi yok</h3>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {supportTickets.map(ticket => (
                <li 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  style={{ 
                    padding: '20px', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    backgroundColor: selectedTicket?.id === ticket.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: 'white' }}>{ticket.subject}</strong>
                    <span style={{ 
                      fontSize: '11px', 
                      padding: '4px 8px', 
                      borderRadius: '12px',
                      backgroundColor: ticket.status === 'Açık' ? 'rgba(239, 68, 68, 0.2)' : ticket.status === 'Kapandı' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: ticket.status === 'Açık' ? '#fca5a5' : ticket.status === 'Kapandı' ? '#86efac' : '#7dd3fc'
                    }}>
                      {ticket.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>{ticket.tenantName} • <span style={{ color: ticket.category === 'Hata' ? '#fca5a5' : ticket.category === 'Şikayet' ? '#fbbf24' : '#60a5fa' }}>{ticket.category || 'Genel'}</span></span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ticket Detayı */}
        <div style={{ flex: '2', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', height: '600px' }}>
          {selectedTicket ? (
            <>
              <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '18px' }}>{selectedTicket.subject}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Firma: {selectedTicket.tenantName} • 
                    Kategori: <span style={{ color: selectedTicket.category === 'Hata' ? '#fca5a5' : selectedTicket.category === 'Şikayet' ? '#fbbf24' : '#60a5fa', fontWeight: 600 }}>{selectedTicket.category || 'Genel'}</span> • 
                    Durum: {selectedTicket.status}
                  </div>
                </div>
                {selectedTicket.status !== 'Kapandı' && (
                  <button onClick={handleCloseTicket} className="admin-btn admin-btn-sm admin-btn-danger-ghost">Talebi Kapat</button>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(selectedTicket.messages || []).map((msg, idx) => (
                  <div key={msg.id || idx} style={{ 
                    alignSelf: msg.senderType === 'admin' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                  }}>
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-secondary)', 
                      marginBottom: '4px',
                      textAlign: msg.senderType === 'admin' ? 'right' : 'left'
                    }}>
                      {msg.sender} • {new Date(msg.timestamp).toLocaleString('tr-TR')}
                    </div>
                    <div style={{
                      backgroundColor: msg.senderType === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                      color: msg.senderType === 'admin' ? '#e0e7ff' : '#cbd5e1',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: `1px solid ${msg.senderType === 'admin' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                      borderBottomRightRadius: msg.senderType === 'admin' ? '4px' : '12px',
                      borderBottomLeftRadius: msg.senderType === 'admin' ? '12px' : '4px',
                      lineHeight: '1.5'
                    }}>
                      {msg.text}
                      {msg.attachment && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          {msg.attachment.isImage ? (
                            <a href={msg.attachment.url} target="_blank" rel="noreferrer">
                              <img src={msg.attachment.url} alt="attachment" style={{ maxWidth: '100%', borderRadius: '4px', display: 'block' }} />
                            </a>
                          ) : (
                            <a href={msg.attachment.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'underline', fontSize: '12px' }}>
                              <File size={14} /> {msg.attachment.name}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedTicket.status !== 'Kapandı' ? (
                <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {selectedFile && (
                    <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'white' }}>
                        <File size={14} /> {selectedFile.name}
                      </div>
                      <button onClick={() => setSelectedFile(null)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}><X size={14} /></button>
                    </div>
                  )}
                  <form onSubmit={handleReply} style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className="admin-btn" onClick={() => document.getElementById('admin-reply-file').click()} style={{ padding: '6px 12px', minWidth: '40px' }}>
                      <Paperclip size={18} />
                    </button>
                    <input type="file" id="admin-reply-file" style={{ display: 'none' }} onChange={e => setSelectedFile(e.target.files[0])} />
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      placeholder="Cevabınızı yazın..." 
                      style={{ flex: 1 }}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                    />
                    <button type="submit" className="admin-btn admin-btn-primary" disabled={isUploading || (!replyText.trim() && !selectedFile)}>{isUploading ? '...' : 'Gönder'}</button>
                  </form>
                </div>
              ) : (
                <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Bu destek talebi kapatılmıştır. Yeni mesaj gönderilemez.
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              Detayları görmek için soldan bir destek talebi seçin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTickets;
