import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Paperclip, File, X, Image as ImageIcon } from 'lucide-react';

const Support = () => {
  const { tickets, addTicket, addTicketReply } = useContext(AppContext);
  const [showAddForm, setShowAddForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Hata');
  const [message, setMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    try {
      setIsUploading(true);
      const success = await addTicket(subject, message, category, selectedFile);
      if (success) {
        setShowAddForm(false);
        setSubject('');
        setCategory('Hata');
        setMessage('');
        setSelectedFile(null);
      } else {
        alert("Bilet gönderilirken bir sorun oluştu. Lütfen tekrar deneyin.");
      }
    } catch (err) {
      console.error(err);
      alert("Bir hata oluştu: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || (!replyText.trim() && !selectedFile)) return;

    try {
      setIsUploading(true);
      const success = await addTicketReply(selectedTicket.id, replyText, selectedFile);
      
      if (success) {
        const newMsg = {
          id: Date.now().toString(),
          senderType: 'user',
          text: replyText,
          attachment: selectedFile ? { name: selectedFile.name, isImage: selectedFile.type.startsWith('image/'), url: URL.createObjectURL(selectedFile) } : null,
          timestamp: new Date().toISOString()
        };
        
        setReplyText('');
        setSelectedFile(null);
        setSelectedTicket({
          ...selectedTicket,
          messages: [...(selectedTicket.messages || []), newMsg]
        });
      } else {
        alert("Yanıt gönderilemedi.");
      }
    } catch (err) {
      console.error(err);
      alert("Yanıt gönderilirken bir hata oluştu.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Destek Taleplerim</h1>
          <p className="page-subtitle">Yaşadığınız sorunları veya talepleri yönetime iletin.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          + Yeni Ticket Oluştur
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
          <h3>Yeni Destek Talebi</h3>
          <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Konu Başlığı</label>
              <input 
                type="text" 
                className="form-input" 
                value={subject} 
                onChange={e => setSubject(e.target.value)}
                placeholder="Örn: X Modülünde Hata Alıyorum"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select 
                className="form-input" 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                required
              >
                <option value="Hata">Hata</option>
                <option value="Öneri">Öneri</option>
                <option value="Şikayet">Şikayet</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mesajınız</label>
              <textarea 
                className="form-input" 
                rows="4"
                value={message} 
                onChange={e => setMessage(e.target.value)}
                placeholder="Yaşadığınız problemi detaylıca anlatın..."
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Ek Dosya / Görsel (Opsiyonel)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="file" 
                  id="ticket-file"
                  style={{ display: 'none' }} 
                  onChange={e => setSelectedFile(e.target.files[0])}
                />
                <button type="button" className="btn" onClick={() => document.getElementById('ticket-file').click()} style={{ backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Paperclip size={16} /> Dosya Seç
                </button>
                {selectedFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--accent-color)' }}>
                    <File size={14} /> {selectedFile.name} 
                    <button type="button" onClick={() => setSelectedFile(null)} style={{ border: 'none', background: 'transparent', color: 'var(--error)', cursor: 'pointer', padding: 0 }}><X size={14} /></button>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => { setShowAddForm(false); setSelectedFile(null); }} style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>İptal</button>
              <button type="submit" className="btn btn-primary" disabled={isUploading}>{isUploading ? 'Gönderiliyor...' : 'Gönder'}</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: '500px' }}>
        {/* Sol Panel: Ticket Listesi */}
        <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          {tickets.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Henüz destek talebiniz bulunmuyor.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {tickets.map(t => (
                <li 
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  style={{ 
                    padding: '16px 20px', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    backgroundColor: selectedTicket?.id === t.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    borderLeft: selectedTicket?.id === t.id ? '3px solid var(--primary-color)' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{t.subject}</strong>
                    <span style={{ 
                      fontSize: '11px', 
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      backgroundColor: t.status === 'Açık' ? 'rgba(56, 189, 248, 0.2)' : t.status === 'Yanıtlandı' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
                      color: t.status === 'Açık' ? '#7dd3fc' : t.status === 'Yanıtlandı' ? '#86efac' : '#94a3b8'
                    }}>
                      {t.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                    <span>{new Date(t.createdAt).toLocaleDateString('tr-TR')}</span>
                    <span>•</span>
                    <span style={{ color: t.category === 'Hata' ? '#fca5a5' : t.category === 'Şikayet' ? '#fbbf24' : '#60a5fa' }}>{t.category || 'Genel'}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sağ Panel: Ticket Detayı */}
        <div className="card" style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: 0 }}>
          {selectedTicket ? (
            <>
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>{selectedTicket.subject}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Talep ID: #{selectedTicket.id.substring(0,6)} • 
                  Kategori: <span style={{ color: selectedTicket.category === 'Hata' ? '#fca5a5' : selectedTicket.category === 'Şikayet' ? '#fbbf24' : '#60a5fa', fontWeight: 600 }}>{selectedTicket.category || 'Genel'}</span> • 
                  Durum: {selectedTicket.status}
                </div>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                {(selectedTicket.messages || []).map((msg, idx) => (
                  <div key={msg.id || idx} style={{ 
                    alignSelf: msg.senderType === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                  }}>
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-secondary)', 
                      marginBottom: '4px',
                      textAlign: msg.senderType === 'user' ? 'right' : 'left'
                    }}>
                      {msg.senderType === 'user' ? 'Siz' : 'Süper Admin'} • {new Date(msg.timestamp).toLocaleString('tr-TR')}
                    </div>
                    <div style={{
                      backgroundColor: msg.senderType === 'user' ? 'var(--primary-color)' : 'var(--card-bg)',
                      color: 'white',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: msg.senderType === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      borderBottomRightRadius: msg.senderType === 'user' ? '4px' : '12px',
                      borderBottomLeftRadius: msg.senderType === 'user' ? '12px' : '4px',
                      lineHeight: '1.5'
                    }}>
                      {msg.text}
                      {msg.attachment && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                        <File size={14} /> {selectedFile.name}
                      </div>
                      <button onClick={() => setSelectedFile(null)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><X size={14} /></button>
                    </div>
                  )}
                  <form onSubmit={handleReply} style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className="btn" onClick={() => document.getElementById('reply-file').click()} style={{ padding: '8px', minWidth: '40px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      <Paperclip size={18} />
                    </button>
                    <input type="file" id="reply-file" style={{ display: 'none' }} onChange={e => setSelectedFile(e.target.files[0])} />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Yanıtınızı buraya yazın..." 
                      style={{ flex: 1 }}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" disabled={isUploading || (!replyText.trim() && !selectedFile)}>{isUploading ? '...' : 'Gönder'}</button>
                  </form>
                </div>
              ) : (
                <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Bu talep üst yönetim tarafından kapatılmıştır. Yeni mesaj gönderilemez.
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              Detayları ve mesajları görmek için sol taraftan bir talep seçin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
