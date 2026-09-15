import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import {
  getAllReleaseNotes, createReleaseNote, updateReleaseNote,
  publishReleaseNote, unpublishReleaseNote, deleteReleaseNote,
} from '../../utils/releaseNotes';

/**
 * Guncelleme notu yazma ve yayinlama.
 *
 * Yayinlanan not tum firmalarin panelinde ayni anda gorunur: kullanicilarin
 * zil menusune dusen ve Guncelleme Notlari sayfasinda listelenen kaynak burasi.
 * Taslak olarak kaydedilen not kimseye gorunmez.
 */
const AdminReleaseNotes = () => {
  const { adminUser } = useContext(AdminContext);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', version: '', body: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setNotes(await getAllReleaseNotes());
      setError('');
    } catch (err) {
      setError('Notlar yüklenemedi: ' + err.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ title: '', version: '', body: '' });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setError('Başlık ve içerik zorunlu.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (editingId) await updateReleaseNote(editingId, form);
      else await createReleaseNote(form);
      resetForm();
      await load();
    } catch (err) {
      setError('Kaydedilemedi: ' + err.message);
    }
    setBusy(false);
  };

  const handlePublish = async (note) => {
    const question = note.published
      ? 'Bu not yayından kaldırılsın mı? Kullanıcıların panelinde görünmeyecek.'
      : 'Bu not yayınlansın mı? Tüm firmaların paneline anında düşecek.';
    if (!window.confirm(question)) return;

    setBusy(true);
    try {
      if (note.published) await unpublishReleaseNote(note.id);
      else await publishReleaseNote(note.id);
      await load();
    } catch (err) {
      setError('İşlem başarısız: ' + err.message);
    }
    setBusy(false);
  };

  const handleDelete = async (note) => {
    if (!window.confirm(`"${note.title}" kalıcı olarak silinsin mi?`)) return;
    setBusy(true);
    try {
      await deleteReleaseNote(note.id);
      if (editingId === note.id) resetForm();
      await load();
    } catch (err) {
      setError('Silinemedi: ' + err.message);
    }
    setBusy(false);
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setForm({ title: note.title || '', version: note.version || '', body: note.body || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (adminUser?.role !== 'superadmin') {
    return <div className="admin-card"><p>Bu bölüm için yetkiniz yok.</p></div>;
  }

  return (
    <div>
      <h1 className="admin-page-title">Güncelleme Notları</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
        Buradan yazdığınız notlar, <strong>Yayınla</strong> dediğinizde tüm firmaların paneline düşer:
        kullanıcıların bildirim ziline ve Güncelleme Notları sayfasına. Taslaklar kimseye görünmez.
      </p>

      {error && (
        <div style={{ padding: '12px', marginBottom: '16px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <div className="admin-card" style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>
          {editingId ? 'Notu Düzenle' : 'Yeni Not'}
        </h3>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            style={{ flex: '1 1 260px' }}
            placeholder="Başlık — örn. Mükerrer lead engellemesi"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="form-input"
            style={{ flex: '0 1 140px' }}
            placeholder="Sürüm (isteğe bağlı)"
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
          />
        </div>

        <textarea
          className="form-input"
          style={{ width: '100%', minHeight: '160px', resize: 'vertical', lineHeight: 1.6 }}
          placeholder={'İçerik. Her satır ayrı madde olarak gösterilir.\n\nÖrnek:\nAynı numara ikinci kez lead olarak eklenemiyor.\nTekrar başvurular mevcut kayda işleniyor.'}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={busy}>
            {busy ? 'Kaydediliyor...' : editingId ? 'Değişiklikleri Kaydet' : 'Taslak Olarak Kaydet'}
          </button>
          {editingId && (
            <button className="btn btn-secondary" onClick={resetForm} disabled={busy}>
              Vazgeç
            </button>
          )}
        </div>
      </div>

      <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Notlar ({notes.length})</h3>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Yükleniyor...</p>
      ) : notes.length === 0 ? (
        <div className="admin-card"><p style={{ color: 'var(--text-secondary)', margin: 0 }}>Henüz not yok.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notes.map(note => (
            <div key={note.id} className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <div>
                  <strong style={{ fontSize: '15px' }}>{note.title}</strong>
                  {note.version && (
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      v{note.version}
                    </span>
                  )}
                </div>
                <span
                  className="badge"
                  style={note.published
                    ? { background: 'rgba(16,185,129,0.12)', color: 'var(--success)' }
                    : { background: 'rgba(148,163,184,0.15)', color: 'var(--text-secondary)' }}
                >
                  {note.published ? 'Yayında' : 'Taslak'}
                </span>
              </div>

              <p style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>
                {note.body}
              </p>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Oluşturuldu: {note.createdAt ? new Date(note.createdAt).toLocaleString('tr-TR') : '—'}
                {note.publishedAt && ` · Yayınlandı: ${new Date(note.publishedAt).toLocaleString('tr-TR')}`}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-sm"
                  onClick={() => handlePublish(note)}
                  disabled={busy}
                  style={note.published
                    ? { background: 'rgba(148,163,184,0.15)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }
                    : { background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.35)' }}
                >
                  {note.published ? 'Yayından Kaldır' : 'Yayınla'}
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => startEdit(note)} disabled={busy}>
                  Düzenle
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => handleDelete(note)}
                  disabled={busy}
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReleaseNotes;
