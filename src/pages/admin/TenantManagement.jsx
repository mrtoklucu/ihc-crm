import React, { useState, useContext, useRef } from 'react';
import PasswordInput from '../../components/PasswordInput';
import { AdminContext } from '../../context/AdminContext';
import { getTenantLeadCount, getTenantUserCount } from '../../utils/tenantUtils';
import { APP_DOMAIN, tenantDomain, firebaseConfig } from '../../config/appConfig';

const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
import { Upload, Trash2, User, Globe, Plus, Search, Check, AlertCircle, Eye, Mail, Shield } from 'lucide-react';


// Tiklaninca panoya kopyalanan deger rozeti.
const CopyValue = ({ text, id, copied, onCopy }) => (
  <code
    onClick={() => onCopy(text, id)}
    title="Kopyalamak icin tikla"
    style={{
      cursor: 'pointer', padding: '3px 8px', borderRadius: '4px',
      backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-color)',
      fontSize: '12px', wordBreak: 'break-all'
    }}
  >
    {copied === id ? 'Kopyalandi!' : text}
  </code>
);

/**
 * Firma olusturulduktan sonra gosterilen kurulum adimlari.
 *
 * Firebase Hosting wildcard alan adi desteklemedigi icin her yeni firmanin
 * subdomaini elle tanimlanmak zorunda. Panel yalnizca veritabani kaydini
 * olusturur; asagidaki iki adim yapilmadan firma adresi calismaz.
 */
const TenantSetupSteps = ({ slug, onClose }) => {
  const [copied, setCopied] = useState('');
  const domain = tenantDomain(slug);
  const hostingTarget = `${FIREBASE_PROJECT_ID}.web.app`;

  const copy = (value, key) => {
    navigator.clipboard?.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div className="admin-modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="admin-form-alert admin-form-alert-success" style={{ margin: 0 }}>
        Firma kaydi olusturuldu. Adresin calismasi icin 2 adim daha gerekiyor.
      </div>

      <div style={{
        display: 'flex', gap: '10px', padding: '12px 14px', borderRadius: '8px',
        backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)'
      }}>
        <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
        <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
          <strong>{domain}</strong> henuz yayinda degil. Bu adimlar tamamlanana kadar
          firma giris yapamaz.
        </div>
      </div>

      <div style={{ fontSize: '13px', lineHeight: 1.7 }}>
        <p style={{ fontWeight: 600, marginBottom: '6px' }}>1. Alan adi saglayicisinda DNS kaydi ekle</p>
        <div style={{ paddingLeft: '14px', borderLeft: '2px solid var(--border-color)', marginBottom: '18px' }}>
          Tur: <CopyValue text="CNAME" id="type" copied={copied} onCopy={copy} /><br />
          Sunucu adi: <CopyValue text={domain} id="host" copied={copied} onCopy={copy} /><br />
          Deger: <CopyValue text={hostingTarget} id="target" copied={copied} onCopy={copy} />
        </div>

        <p style={{ fontWeight: 600, marginBottom: '6px' }}>2. Firebase Console'a alan adini ekle</p>
        <div style={{ paddingLeft: '14px', borderLeft: '2px solid var(--border-color)' }}>
          Hosting &rarr; Add custom domain &rarr; <CopyValue text={domain} id="domain" copied={copied} onCopy={copy} />
          <div style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '12px' }}>
            DNS yayilmasi ve SSL sertifikasi birkac saat surebilir.
          </div>
        </div>
      </div>

      <div className="admin-modal-actions">
        <button type="button" className="admin-btn admin-btn-primary" onClick={onClose}>Anladim</button>
      </div>
    </div>
  );
};

const TenantManagement = () => {
  const { tenants, loadingTenants, addTenant, editTenant, removeTenant, toggleTenantStatus, uploadTenantLogo, getTenantUsers, updateTenantUser } = useContext(AdminContext);
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [viewingUsers, setViewingUsers] = useState(null); // Tenant object
  const [tenantUsers, setTenantUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const handleResetUserPassword = async (user) => {
    const newPassword = window.prompt(`${user.name} (${user.email}) için yeni şifre girin:`);
    if (newPassword && newPassword.trim().length >= 4) {
      if (window.confirm('Şifreyi değiştirmek istediğinize emin misiniz?')) {
        const result = await updateTenantUser(viewingUsers.slug, user.id, { password: newPassword });
        if (result.success) {
          alert('Şifre başarıyla güncellendi.');
          // Refresh list
          const users = await getTenantUsers(viewingUsers.slug);
          setTenantUsers(users);
        } else {
          alert('Hata: ' + result.error);
        }
      }
    } else if (newPassword !== null) {
      alert('Şifre en az 4 karakter olmalıdır.');
    }
  };
  const [fileToUpload, setFileToUpload] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    primaryColor: '#6366f1',
    status: 'active',
    appCode: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  // Firma olusturulduktan sonra gosterilecek kurulum adimlari (slug tutulur).
  const [createdSlug, setCreatedSlug] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      logo: '',
      adminEmail: '',
      adminPassword: '',
      maxUsers: 5,
      primaryColor: '#6366f1',
      status: 'active',
      appCode: ''
    });
    setEditingTenant(null);
    setFileToUpload(null);
    setLogoPreview(null);
    setFormError('');
    setFormSuccess('');
    setUploading(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (tenant) => {
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      logo: tenant.logo || '',
      maxUsers: tenant.maxUsers,
      primaryColor: tenant.primaryColor || '#6366f1',
      status: tenant.status,
      appCode: tenant.appCode || ''
    });
    setEditingTenant(tenant);
    setLogoPreview(tenant.logo || null);
    setShowForm(true);
    setFormError('');
    setFormSuccess('');
  };

  const handleOpenUsers = async (tenant) => {
    setViewingUsers(tenant);
    setLoadingUsers(true);
    const users = await getTenantUsers(tenant.slug);
    setTenantUsers(users);
    setLoadingUsers(false);
  };

  const handleClose = () => {
    setShowForm(false);
    setCreatedSlug(null);
    resetForm();
  };

  const handleSlugChange = (value) => {
    // Slug için sadece küçük harf, rakam ve tire
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileToUpload(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setUploading(true);

    if (!formData.name.trim()) {
      setFormError('Firma adı zorunludur.');
      setUploading(false);
      return;
    }
    if (!formData.slug.trim()) {
      setFormError('Subdomain zorunludur.');
      setUploading(false);
      return;
    }

    let currentLogoUrl = formData.logo;

    try {
      if (fileToUpload) {
        const uploadedUrl = await uploadTenantLogo(formData.slug, fileToUpload);
        if (uploadedUrl) currentLogoUrl = uploadedUrl;
      }

      if (editingTenant) {
        console.log("Executing editTenant for:", editingTenant.slug);
        const result = await editTenant(editingTenant.slug, {
          name: formData.name,
          logo: currentLogoUrl,
          maxUsers: Number(formData.maxUsers),
          primaryColor: formData.primaryColor,
          status: formData.status,
          appCode: formData.appCode
        });
        if (result.success) {
          setFormSuccess('Firma başarıyla güncellendi!');
          setTimeout(() => handleClose(), 1500);
        } else {
          setFormError(result.error);
        }
      } else {
        // Yeni ekleme
        if (!formData.adminEmail.trim()) {
          setFormError('Admin e-posta adresi zorunludur.');
          setUploading(false);
          return;
        }
        if (!formData.adminPassword.trim()) {
          setFormError('Admin şifresi zorunludur.');
          setUploading(false);
          return;
        }

        const result = await addTenant({ 
          ...formData, 
          logo: currentLogoUrl,
          maxUsers: Number(formData.maxUsers) 
        });
        if (result.success) {
          // Subdomain otomatik olusmadigi icin modali kapatmiyoruz;
          // yoneticiye kalan elle adimlari gosteriyoruz.
          setCreatedSlug(formData.slug);
        } else {
          setFormError(result.error);
        }
      }
    } catch (err) {
      setFormError('Firma kaydedilirken bir hata oluştu: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (slug) => {
    await removeTenant(slug);
    setDeleteConfirm(null);
  };

  const statusLabels = {
    active: 'Aktif',
    suspended: 'Askıda',
    trial: 'Deneme'
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>Firma Yönetimi</h1>
          <p>CRM hizmeti verdiğiniz firmaları yönetin</p>
        </div>
        <div className="admin-page-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="admin-search-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              placeholder="Firma veya subdomain ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>
          <button className="admin-btn admin-btn-primary" onClick={handleOpenAdd}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Yeni Firma Ekle
          </button>
        </div>
      </div>

      {/* Firma Kartları */}
      {loadingTenants ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="admin-login-spinner" style={{ margin: '0 auto', width: '32px', height: '32px', borderColor: 'rgba(99, 102, 241, 0.3)', borderTopColor: '#6366f1' }}></div>
          <p style={{ marginTop: '16px', color: '#94a3b8' }}>Firmalar yükleniyor...</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">🏢</div>
          <h3>Henüz firma eklenmedi</h3>
          <p>Yukarıdaki "Yeni Firma Ekle" butonuna tıklayarak ilk firmanızı ekleyin.</p>
        </div>
      ) : (
        <div className="admin-tenant-cards">
          {tenants.filter(t => 
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            t.slug.toLowerCase().includes(searchQuery.toLowerCase())
          ).map(tenant => {
            const leadCount = getTenantLeadCount(tenant);
            const userCount = getTenantUserCount(tenant);
            const userPercent = tenant.maxUsers > 0 ? Math.round((userCount / tenant.maxUsers) * 100) : 0;

            return (
              <div className="admin-tenant-card" key={tenant.id} style={{ '--tenant-color': tenant.primaryColor || '#6366f1' }}>
                <div className="admin-tenant-card-header">
                  <div className="admin-tenant-card-info">
                    <div className="admin-tenant-avatar-lg" style={{ backgroundColor: tenant.primaryColor || '#6366f1', overflow: 'hidden' }}>
                      {tenant.logo ? (
                        <img src={tenant.logo} alt={tenant.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        tenant.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3>{tenant.name}</h3>
                      <code className="admin-subdomain-badge-sm">{tenantDomain(tenant.slug)}</code>
                      {tenant.appCode && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                           App Code: <strong style={{ color: 'var(--accent-color)' }}>{tenant.appCode}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`admin-status-badge admin-status-${tenant.status}`}>
                    {statusLabels[tenant.status] || tenant.status}
                  </span>
                </div>

                <div className="admin-tenant-card-stats">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>Toplam Lead</span>
                    <strong style={{ color: 'white' }}>{leadCount}</strong>
                  </div>
                  <div className="admin-tenant-stat">
                    <div className="admin-tenant-stat-header">
                      <span>Kullanıcılar</span>
                      <span>{userCount} / {tenant.maxUsers}</span>
                    </div>
                    <div className="admin-progress-bar">
                      <div 
                        className="admin-progress-fill" 
                        style={{ 
                          width: `${Math.min(userPercent, 100)}%`,
                          backgroundColor: userPercent > 90 ? '#ef4444' : userPercent > 70 ? '#f59e0b' : '#22c55e'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="admin-tenant-card-meta">
                  <span title="Kayıt Tarihi">📅 {new Date(tenant.createdAt).toLocaleDateString('tr-TR')}</span>
                  {tenant.adminEmail && <span title="Admin E-posta">📧 {tenant.adminEmail}</span>}
                </div>

                <div className="admin-tenant-card-actions">
                  <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => handleOpenUsers(tenant)}>
                    <Eye size={14} /> Kullanıcılar
                  </button>
                  <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => handleOpenEdit(tenant)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Düzenle
                  </button>
                  <button 
                    className={`admin-btn admin-btn-sm ${tenant.status === 'active' ? 'admin-btn-warning' : 'admin-btn-success'}`}
                    onClick={() => toggleTenantStatus(tenant.slug)}
                  >
                    {tenant.status === 'active' ? '⏸️ Askıya Al' : '▶️ Aktifleştir'}
                  </button>
                  {deleteConfirm === tenant.slug ? (
                    <div className="admin-delete-confirm">
                      <span>Emin misiniz?</span>
                      <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(tenant.slug)}>Sil</button>
                      <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => setDeleteConfirm(null)}>İptal</button>
                    </div>
                  ) : (
                    <button className="admin-btn admin-btn-sm admin-btn-danger-ghost" onClick={() => setDeleteConfirm(tenant.slug)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Sil
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ekleme/Düzenleme Modal */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={handleClose}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingTenant ? 'Firma Düzenle' : 'Yeni Firma Ekle'}</h2>
              <button className="admin-modal-close" onClick={handleClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {formError && (
              <div className="admin-form-alert admin-form-alert-error">{formError}</div>
            )}
            {formSuccess && (
              <div className="admin-form-alert admin-form-alert-success">{formSuccess}</div>
            )}

            {createdSlug ? (
              <TenantSetupSteps slug={createdSlug} onClose={handleClose} />
            ) : (
            <form onSubmit={handleSubmit} className="admin-modal-form">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Firma Adı *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Istanbul Hair Center"
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Subdomain *</label>
                  <div className="admin-input-addon">
                    <input
                      type="text"
                      className="admin-form-input"
                      value={formData.slug}
                      onChange={e => handleSlugChange(e.target.value)}
                      placeholder="istanbulhaircenter"
                      required
                      disabled={!!editingTenant}
                    />
                    <span className="admin-input-addon-text">.{APP_DOMAIN}</span>
                  </div>
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">App Giriş Kodu (Mobil Uygulama İçin)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.appCode}
                    onChange={e => setFormData(prev => ({ ...prev, appCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                    placeholder="Örn: IHC2024"
                    maxLength={10}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Sadece mobil uygulamada şirket tespiti için kullanılacaktır.
                  </p>
                </div>
              </div>

              <div className="admin-form-group" style={{ marginBottom: '24px' }}>
                <label className="admin-form-label">Firma Logosu</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '12px', 
                    backgroundColor: 'var(--input-bg)', 
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Upload size={24} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        type="button" 
                        className="admin-btn admin-btn-sm admin-btn-ghost"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={14} /> Logo Seç
                      </button>
                      {logoPreview && (
                        <button 
                          type="button" 
                          className="admin-btn admin-btn-sm admin-btn-danger-ghost"
                          onClick={() => {
                            setLogoPreview(null);
                            setFileToUpload(null);
                            setFormData(prev => ({ ...prev, logo: '' }));
                          }}
                        >
                          <Trash2 size={14} /> Kaldır
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      SVG, PNG veya JPG. Önerilen boyut 200x200px.
                    </p>
                  </div>
                </div>
              </div>

              {!editingTenant && (
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Admin E-posta *</label>
                    <input
                      type="email"
                      className="admin-form-input"
                      value={formData.adminEmail}
                      onChange={e => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                      placeholder="admin@firma.com"
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Admin Şifre *</label>
                    <PasswordInput
                      className="admin-form-input"
                      value={formData.adminPassword}
                      onChange={e => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Kullanıcı Limiti</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={formData.maxUsers}
                    onChange={e => setFormData(prev => ({ ...prev, maxUsers: e.target.value }))}
                    min="1"
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Tema Rengi</label>
                  <div className="admin-color-picker">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={e => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    />
                    <span>{formData.primaryColor}</span>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Durum</label>
                  <select
                    className="admin-form-input"
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Aktif</option>
                    <option value="trial">Deneme</option>
                    <option value="suspended">Askıda</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={handleClose}>İptal</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={uploading}>
                  {uploading ? (
                    <>
                      <div className="admin-login-spinner" style={{ width: '14px', height: '14px', marginRight: '8px' }}></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    editingTenant ? 'Güncelle' : 'Firma Oluştur'
                  )}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
      {/* Kullanıcı Listesi Modal */}
      {viewingUsers && (
        <div className="admin-modal-overlay" onClick={() => setViewingUsers(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Eye size={20} style={{ color: 'var(--accent-color)' }} />
                <div>
                  <h2 style={{ fontSize: '18px' }}>{viewingUsers.name} - Kullanıcı Listesi</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Firma bünyesindeki tüm aktif yetkilendirilmeler</p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setViewingUsers(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '450px', overflowY: 'auto', padding: '10px' }}>
              {loadingUsers ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div className="admin-login-spinner" style={{ margin: '0 auto', width: '24px', height: '24px' }}></div>
                  <p style={{ marginTop: '12px', color: '#94a3b8', fontSize: '13px' }}>Kullanıcı verileri çekiliyor...</p>
                </div>
              ) : tenantUsers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p>Bu firmada kayıtlı kullanıcı bulunamadı.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tenantUsers.map((user, idx) => (
                    <div key={user.id || idx} style={{ 
                      padding: '16px', 
                      backgroundColor: 'var(--input-bg)', 
                      borderRadius: '12px', 
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                         <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light-bg)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user.name?.charAt(0) || 'U'}
                         </div>
                         <div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>{user.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={12} /> {user.email}
                            </div>
                         </div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <div style={{ 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          color: user.level >= 4 ? 'var(--accent-color)' : 'var(--success)', 
                          backgroundColor: user.level >= 4 ? 'rgba(212, 175, 55, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Shield size={10} /> {user.role || 'Personel'} (Lvl {user.level})
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleResetUserPassword(user); }}
                          className="admin-btn admin-btn-sm admin-btn-ghost"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          🔑 Şifre Sıfırla
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '20px', display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="admin-btn admin-btn-ghost" onClick={() => setViewingUsers(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
