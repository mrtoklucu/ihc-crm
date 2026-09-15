import React, { useEffect, useState, useContext } from 'react';
import { BellRing } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { getPublishedReleaseNotes, markNotesAsRead } from '../../utils/releaseNotes';

/**
 * Guncelleme notlari listesi.
 *
 * Notlar eskiden bu dosyanin icinde sabit bir diziydi ve aylardir
 * guncellenmemisti. Artik super admin panelinden yazilip yayinlanan
 * kayitlardan geliyor.
 */
const ReleaseNotes = () => {
  const { currentUser } = useContext(AppContext);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const published = await getPublishedReleaseNotes();
        if (!alive) return;
        setNotes(published);
        // Sayfa acildiysa notlar gorulmus sayilir; zildeki sayac sifirlanir.
        markNotesAsRead(currentUser?.id, published.map((n) => n.id));
      } catch (err) {
        if (alive) setError('Notlar yüklenemedi: ' + err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [currentUser?.id]);

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Yükleniyor...</p>;
  }

  if (error) {
    return <p style={{ color: 'var(--error)', fontSize: '13px' }}>{error}</p>;
  }

  if (notes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
        <BellRing size={28} style={{ opacity: 0.4, marginBottom: '12px' }} />
        <p style={{ fontSize: '13px', margin: 0 }}>Henüz yayınlanmış bir güncelleme notu yok.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {notes.map((note) => (
        <div
          key={note.id}
          style={{
            padding: '20px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <strong style={{ fontSize: '15px' }}>{note.title}</strong>
            {note.version && (
              <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                v{note.version}
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {note.publishedAt ? new Date(note.publishedAt).toLocaleDateString('tr-TR') : ''}
            </span>
          </div>

          {/* Her satir ayri madde: yazan kisi bicimlendirmeyle ugrasmasin. */}
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {String(note.body || '')
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, i) => (
                <li key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {line}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ReleaseNotes;
