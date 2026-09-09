import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Settings as SettingsIcon, Users, SlidersHorizontal, Check, BellDot, Palette } from 'lucide-react';
import { LEAD_STATUSES, STATUS_CATEGORIES, DEFAULT_STATUS_CATEGORIES } from '../config/leadStatuses';
import ReleaseNotes from '../components/settings/ReleaseNotes';

// Kullanicilar sayfasindaki liste ile ayni olmali.
const CONSULTANT_LANGUAGES = [
  'Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'İspanyolca', 'İtalyanca',
  'Rusça', 'Arapça', 'Rumence', 'Bulgarca', 'Hollandaca'
];

const ASSIGN_STRATEGIES = [
  { id: 'least-loaded', title: 'En az yüklü danışmana',
    desc: 'Açık lead sayısı en düşük olana gider. İş yükünü kendiliğinden dengeler.' },
  { id: 'round-robin', title: 'Sırayla (round-robin)',
    desc: 'Danışmanlara sırayla dağıtılır. Herkes eşit sayıda lead alır.' },
  { id: 'random', title: 'Rastgele',
    desc: 'Uygun danışmanlar arasından rastgele seçilir.' },
];

const Settings = () => {
  const { users, currentUser, checkPermission, tenantConfig, updateTenantConfig, updateStatusCategories } = useContext(AppContext);
  console.log("Settings rendering, currentUser:", currentUser?.level);
  const [activeTab, setActiveTab] = useState('assignment'); // 'assignment' or 'general'

  // Otomatik atama ayarlari tenant dokumaninda saklanir.
  const autoAssign = tenantConfig?.autoAssign || {};
  const assignEnabled = autoAssign.enabled !== false;
  const assignStrategy = autoAssign.strategy || 'least-loaded';
  const [saving, setSaving] = useState(false);

  // Lead durumlarinin olumlu/notr/olumsuz eslesmesi. Kaydedilene kadar yerelde
  // tutulur; kayitli ayar yoksa varsayilan eslesme baslangic olur.
  const [statusMap, setStatusMap] = useState(() => ({
    ...DEFAULT_STATUS_CATEGORIES,
    ...(tenantConfig?.statusCategories || {}),
  }));
  const [statusSaved, setStatusSaved] = useState(false);

  const saveStatusCategories = async () => {
    setSaving(true);
    const ok = await updateStatusCategories(statusMap);
    setSaving(false);
    if (ok) {
      setStatusSaved(true);
      setTimeout(() => setStatusSaved(false), 2500);
    }
  };

  const saveAutoAssign = async (patch) => {
    setSaving(true);
    await updateTenantConfig({
      autoAssign: { ...autoAssign, enabled: assignEnabled, strategy: assignStrategy, ...patch }
    });
    setSaving(false);
  };

  // Her dil icin o dili konusan aktif danismanlar.
  const languageCoverage = CONSULTANT_LANGUAGES.map(lang => ({
    lang,
    people: users
      .filter(u => u.status !== 'passive' && Array.isArray(u.languages) && u.languages.includes(lang))
      .map(u => u.name)
  }));

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    showSourceInSearch: false,
    autoPoolLeads: true,
    showAssigneeToConsultants: false,
    numberControl: 'Danışan',
    duplicateNumberAction: 'Eski danışanı kullanmayı dene (*)',
    updateAssigneeDuringProcess: 'Hayır',
    updateSegmentAsReturnLead: 'Hayır'
  });

  if (!currentUser || !checkPermission('manageUsers')) {
    console.log("Permission check failed:", currentUser?.level);
    return (
      <div className="card">
        <p>Bu sayfayı görüntülemek için yeterli yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
      {/* Settings Navigation */}
      <div className="card" style={{ width: '280px', padding: '16px', height: 'fit-content' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          CRM Ayarları
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('assignment')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === 'assignment' ? 'rgba(212,175,55,0.1)' : 'transparent',
              color: activeTab === 'assignment' ? 'var(--accent-color)' : 'var(--text-secondary)',
              textAlign: 'left', fontWeight: activeTab === 'assignment' ? '600' : '400', transition: 'all 0.2s'
            }}
          >
            <Users size={18} /> Otomatik Atama Kuralları
          </button>
          <button 
            onClick={() => setActiveTab('general')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === 'general' ? 'rgba(212,175,55,0.1)' : 'transparent',
              color: activeTab === 'general' ? 'var(--accent-color)' : 'var(--text-secondary)',
              textAlign: 'left', fontWeight: activeTab === 'general' ? '600' : '400', transition: 'all 0.2s'
            }}
          >
            <SlidersHorizontal size={18} /> Genel Ayarlar
          </button>
          <button
            onClick={() => setActiveTab('statuses')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === 'statuses' ? 'rgba(212,175,55,0.1)' : 'transparent',
              color: activeTab === 'statuses' ? 'var(--accent-color)' : 'var(--text-secondary)',
              textAlign: 'left', fontWeight: activeTab === 'statuses' ? '600' : '400', transition: 'all 0.2s'
            }}
          >
            <Palette size={18} /> Durum Renkleri
          </button>
          <button 
            onClick={() => setActiveTab('release-notes')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === 'release-notes' ? 'rgba(212,175,55,0.1)' : 'transparent',
              color: activeTab === 'release-notes' ? 'var(--accent-color)' : 'var(--text-secondary)',
              textAlign: 'left', fontWeight: activeTab === 'release-notes' ? '600' : '400', transition: 'all 0.2s'
            }}
          >
            <BellDot size={18} /> Güncelleme Notları
          </button>
        </div>
      </div>

      {/* Settings Content Area */}
      <div style={{ flex: 1 }}>
        {activeTab === 'statuses' ? (
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Durum Renkleri</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
              Her lead durumunu olumlu, nötr veya olumsuz olarak işaretleyin. Seçtiğiniz kategori
              lead listesindeki rozetin rengini belirler. Değişiklik tüm kullanıcılar için geçerlidir.
            </p>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {Object.values(STATUS_CATEGORIES).map(c => (
                <span key={c.key} className="badge" style={{ background: c.background, color: c.color }}>
                  {c.label}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '460px', overflowY: 'auto', paddingRight: '4px' }}>
              {LEAD_STATUSES.map(status => {
                const current = statusMap[status] || 'neutral';
                return (
                  <div key={status} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '12px', padding: '8px 12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)', flexWrap: 'wrap'
                  }}>
                    <span className="badge" style={{
                      background: STATUS_CATEGORIES[current].background,
                      color: STATUS_CATEGORIES[current].color
                    }}>
                      {status}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {Object.values(STATUS_CATEGORIES).map(c => (
                        <button
                          key={c.key}
                          onClick={() => setStatusMap(prev => ({ ...prev, [status]: c.key }))}
                          style={{
                            padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                            fontWeight: current === c.key ? 700 : 500,
                            background: current === c.key ? c.background : 'transparent',
                            color: current === c.key ? c.color : 'var(--text-secondary)',
                            border: `1px solid ${current === c.key ? c.color : 'var(--border-color)'}`
                          }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={saveStatusCategories} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setStatusMap({ ...DEFAULT_STATUS_CATEGORIES })}
                disabled={saving}
              >
                Varsayılana dön
              </button>
              {statusSaved && (
                <span style={{ color: 'var(--success)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} /> Kaydedildi
                </span>
              )}
            </div>
          </div>
        ) : activeTab === 'assignment' ? (
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>Otomatik Atama</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 28px 0' }}>
              Web API ve Facebook entegrasyonlarından gelen lead'ler, müşterinin diline göre
              o dili konuşan danışmanlara otomatik dağıtılır. Panelden elle eklenen lead'ler
              havuzda kalır.
            </p>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px', borderRadius: '10px', marginBottom: '28px',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Otomatik atama aktif</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Kapatırsan tüm lead'ler havuzda bekler.
                </div>
              </div>
              <button
                onClick={() => saveAutoAssign({ enabled: !assignEnabled })}
                disabled={saving}
                style={{
                  width: '52px', height: '28px', borderRadius: '14px', border: 'none',
                  cursor: saving ? 'wait' : 'pointer', position: 'relative',
                  backgroundColor: assignEnabled ? 'var(--accent-color)' : 'var(--border-color)',
                  transition: 'background-color 0.2s'
                }}
              >
                <span style={{
                  position: 'absolute', top: '3px', left: assignEnabled ? '27px' : '3px',
                  width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#fff',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Dağıtım Yöntemi</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
              Aynı dili konuşan birden fazla danışman varsa lead'in kime gideceğini belirler.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
              {ASSIGN_STRATEGIES.map(({ id, title, desc }) => (
                <button
                  key={id}
                  onClick={() => saveAutoAssign({ strategy: id })}
                  disabled={saving}
                  style={{
                    textAlign: 'left', padding: '14px 16px', borderRadius: '10px',
                    cursor: saving ? 'wait' : 'pointer',
                    border: assignStrategy === id ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                    backgroundColor: assignStrategy === id ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
                    {assignStrategy === id && <Check size={15} style={{ color: 'var(--accent-color)' }} />}
                    {title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{desc}</div>
                </button>
              ))}
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Dil Kapsamı</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
              Hangi dilde kaç danışman var. Danışmanı olmayan dillerdeki lead'ler havuzda bekler.
            </p>

            <div className="table-container" style={{ borderRadius: '10px' }}>
              <table>
                <thead>
                  <tr><th>Dil</th><th>Danışman</th><th style={{ textAlign: 'right' }}>Durum</th></tr>
                </thead>
                <tbody>
                  {languageCoverage.map(({ lang, people }) => (
                    <tr key={lang}>
                      <td style={{ fontWeight: 600 }}>{lang}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {people.length > 0 ? people.join(', ') : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '10px',
                          color: people.length > 0 ? '#10b981' : 'var(--text-secondary)',
                          backgroundColor: people.length > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.05)'
                        }}>
                          {people.length > 0 ? `${people.length} kişi` : 'Kapsanmıyor'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px' }}>
              Danışmanların dillerini <strong>Kullanıcılar</strong> sayfasından düzenleyebilirsin.
            </p>
          </div>
        ) : activeTab === 'general' ? (
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '32px' }}>Genel Ayarlar</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Dinamik aramada referans kaynağı alanı ve referans kaynağı filtresi gösterilsin</span>
                <input type="checkbox" checked={generalSettings.showSourceInSearch} onChange={() => setGeneralSettings({...generalSettings, showSourceInSearch: !generalSettings.showSourceInSearch})} />
              </div>
              
              <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Değişmesi beklenen gün sayısı geçen lead'leri havuza otomatik aktar</span>
                <input type="checkbox" checked={generalSettings.autoPoolLeads} onChange={() => setGeneralSettings({...generalSettings, autoPoolLeads: !generalSettings.autoPoolLeads})} />
              </div>

              <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Danışan kayıt/düzenle ekranlarında temsilci seçimini temsilcilere göster?</span>
                <input type="checkbox" checked={generalSettings.showAssigneeToConsultants} onChange={() => setGeneralSettings({...generalSettings, showAssigneeToConsultants: !generalSettings.showAssigneeToConsultants})} />
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <label style={{ fontSize: '14px' }}>Leadi manuel olarak kaydederken numara kontrolü</label>
                   <select className="form-input" style={{ width: '250px' }} value={generalSettings.numberControl} onChange={e => setGeneralSettings({...generalSettings, numberControl: e.target.value})}>
                     <option>Danışan</option>
                     <option>Lead</option>
                     <option>Hepsi</option>
                   </select>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <label style={{ fontSize: '14px' }}>Yeni leadin numarası zaten içeride kayıtlı ise</label>
                   <select className="form-input" style={{ width: '250px' }} value={generalSettings.duplicateNumberAction} onChange={e => setGeneralSettings({...generalSettings, duplicateNumberAction: e.target.value})}>
                     <option>Eski danışanı kullanmayı dene (*)</option>
                     <option>Yeni kayıt oluştur</option>
                   </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <label style={{ fontSize: '14px' }}>İşlem Sırasında Temsilciyi Güncelle</label>
                   <select className="form-input" style={{ width: '250px' }} value={generalSettings.updateAssigneeDuringProcess} onChange={e => setGeneralSettings({...generalSettings, updateAssigneeDuringProcess: e.target.value})}>
                     <option>Hayır</option>
                     <option>Evet</option>
                   </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <label style={{ fontSize: '14px' }}>Segmenti Tekrar Gelen Lead Olarak Güncelle</label>
                   <select className="form-input" style={{ width: '250px' }} value={generalSettings.updateSegmentAsReturnLead} onChange={e => setGeneralSettings({...generalSettings, updateSegmentAsReturnLead: e.target.value})}>
                     <option>Hayır</option>
                     <option>Evet</option>
                   </select>
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.1)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                * Sistemde 1'den fazla danışan bulunuyor ise en son kaydı güncellenmiş olan danışan kullanılacaktır.
              </div>

              <div style={{ textAlign: 'right', marginTop: '12px' }}>
                <button className="btn btn-primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}>Kaydet</button>
              </div>
            </div>
          </div>
        ) : (
          <ReleaseNotes />
        )}
      </div>
    </div>
  );
};

export default Settings;
