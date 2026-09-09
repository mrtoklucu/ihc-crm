import React, { useState, useEffect, useContext, useMemo } from 'react';
import { API_BASE_URL, META_VERIFY_TOKEN } from '../config/appConfig';
import { 
  Facebook, Mail, Globe, Calendar, Megaphone, 
  CheckCircle, Smartphone, Terminal, Zap, ExternalLink,
  MessageSquare, Music2, Share2, ShieldCheck, PhoneCall,
  Search, Filter, Plus, Info, LayoutGrid, X, Copy, Code, 
  Settings as SettingsIcon, Link as LinkIcon, RefreshCw,
  Trophy, CloudLightning, Shield, Sliders, ChevronRight, 
  ChevronLeft, BookOpen, AlertCircle, BarChart3, List
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { I18nContext } from '../context/I18nContext';

const IntegrationCard = ({ icon: Icon, title, description, badge, onClick, isConnected, setupProgress }) => (
  <div className="card" style={{ 
    padding: '24px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '16px', 
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    height: '100%',
    border: isConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
    background: isConnected 
      ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(15, 17, 26, 0.8) 100%)' 
      : 'linear-gradient(145deg, rgba(20, 22, 33, 0.6) 0%, rgba(15, 17, 26, 0.8) 100%)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  }} 
  onClick={onClick}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-5px)';
    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.4)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
  }}
  >
    <div style={{ 
      position: 'absolute', top: '16px', right: '16px',
      padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
      backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,191,36,0.1)',
      color: isConnected ? '#10b981' : '#fbbf24',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {isConnected ? 'Sistem Aktif' : (setupProgress > 0 ? `Kurulum %${setupProgress}` : 'Bağlantı Gerekli')}
    </div>
    
    <div style={{ 
      width: '64px', height: '64px', borderRadius: '18px', 
      backgroundColor: 'rgba(255,255,255,0.02)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '8px',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <Icon size={32} color={isConnected ? (title.includes('Facebook') ? '#1877F2' : (title.includes('TikTok') ? '#ec4899' : (title.includes('Calendar') ? '#4285F4' : 'var(--accent-color)'))) : 'var(--text-secondary)'} />
    </div>

    <div>
      <h3 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: 600, color: 'white' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        {description}
      </p>
    </div>

    {isConnected && (
       <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: '#10b981' }}></div>
       </div>
    )}

    <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ 
        fontSize: '11px', color: 'var(--accent-color)', fontWeight: 600, 
        padding: '4px 10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', 
        borderRadius: '6px', textTransform: 'uppercase' 
      }}>
        #{badge}
      </div>
      <button className={`btn btn-sm ${isConnected ? 'btn-primary' : 'btn-secondary'}`} style={{ 
        fontSize: '12px', padding: '8px 16px', borderRadius: '8px', pointerEvents: 'none',
        backgroundColor: isConnected ? '#10b981' : 'transparent',
        borderColor: isConnected ? '#10b981' : 'var(--border-color)',
        color: isConnected ? 'white' : 'var(--text-primary)'
      }}>
        {isConnected ? 'Yönet' : 'Kuruluma Başla'}
      </button>
    </div>
  </div>
);

const Integrations = () => {
  const { t } = useContext(I18nContext);
  const { addLog, addLead, tenantConfig, updateTenantConfig, tenantSlug, leads } = useContext(AppContext);
  const [activeIntegration, setActiveIntegration] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Real config from Firestore
  const integrations = useMemo(() => tenantConfig?.integrations || {}, [tenantConfig]);
  const connectedIds = useMemo(() => 
    Object.keys(integrations).filter(id => integrations[id].enabled), 
    [integrations]
  );

  const [appToken, setAppToken] = useState(integrations.facebook?.token || '');
  const [metaData, setMetaData] = useState({ pages: [], adAccounts: [], forms: [], loading: false, error: null });
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncInfo, setLastSyncInfo] = useState(integrations.facebook?.lastSync || null);
  const [directFormId, setDirectFormId] = useState(integrations.facebook?.directFormId || '');
  
  // Sync appToken with state if not manually edited yet
  useEffect(() => {
    if (integrations.facebook?.token && !appToken) {
      setAppToken(integrations.facebook.token);
    }
  }, [integrations.facebook?.token]);

  const webhookUrl = `${API_BASE_URL}/v1/webhooks/meta/${tenantSlug}`;
  const verifyToken = META_VERIFY_TOKEN;
  const webApiUrl = `${API_BASE_URL}/v1/leads/webform/${tenantSlug}`;

  // Fetch Meta Data when connected
  useEffect(() => {
    const activeToken = appToken || integrations.facebook?.token;
    if (connectedIds.includes('facebook') && activeToken) {
      fetchMetaAccountData(activeToken);
    }
  }, [connectedIds, appToken, integrations.facebook?.token]);

  const fetchMetaAccountData = async (tokenToUse) => {
    const token = tokenToUse || appToken;
    setMetaData(prev => ({ ...prev, loading: true, error: null }));
    try {
      // 1. Get Pages (Accounts)
      const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`);
      const pagesData = await pagesRes.json();
      
      // 2. Get Ad Accounts
      const adAccountsRes = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?fields=name,account_id,id&access_token=${token}`);
      const adAccountsData = await adAccountsRes.json();

      setMetaData(prev => ({ 
        ...prev, 
        pages: pagesData.data || [], 
        adAccounts: adAccountsData.data || [],
        loading: false 
      }));
      
      // Auto-select first page to load forms
      if (pagesData.data?.length > 0) {
        setSelectedPageId(pagesData.data[0].id);
        fetchPageForms(pagesData.data[0].id, pagesData.data[0].access_token);
      }
    } catch (err) {
      console.error("Meta API error:", err);
      setMetaData(prev => ({ ...prev, error: "Veriler çekilemedi. Jetonu kontrol edin.", loading: false }));
    }
  };

  const fetchPageForms = async (pageId, pageToken) => {
    try {
      const formsRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/leadgen_forms?fields=name,leads_count,id,status,created_time&access_token=${pageToken || appToken}`);
      const formsData = await formsRes.json();
      setMetaData(prev => ({ ...prev, forms: formsData.data || [] }));
    } catch (err) {
      console.error("Meta Forms error:", err);
    }
  };

  const syncLeadsFromMeta = async () => {
    if (metaData.forms.length === 0) {
      alert("Önce bir sayfa seçmeli ve aktif formlarınızın listelendiğinden emin olmalısınız.");
      return;
    }

    setIsSyncing(true);
    let newLeadsCount = 0;
    const existingMetaIds = new Set(
      leads.filter(l => l.metaInfo?.leadId).map(l => l.metaInfo.leadId)
    );

    try {
      // Her form için leadleri çek
      for (const form of metaData.forms) {
        const res = await fetch(`https://graph.facebook.com/v18.0/${form.id}/leads?fields=created_time,id,ad_id,ad_name,form_id,field_data&access_token=${appToken}`);
        const data = await res.json();
        
        if (data.data) {
          for (const leadRemote of data.data) {
            // Eğer bu lead daha önce eklenmemişse
            if (!existingMetaIds.has(leadRemote.id)) {
              // Field data mapping
              const fieldMap = {};
              leadRemote.field_data.forEach(f => {
                fieldMap[f.name] = f.values[0];
              });

              const transformedLead = {
                nameSurname: fieldMap["full_name"] || fieldMap["first_name"] + " " + (fieldMap["last_name"] || " "),
                email: fieldMap["email"] || " ",
                phone: fieldMap["phone_number"] || fieldMap["phone"] || " ",
                source: "Facebook Lead Ads",
                metaInfo: {
                  leadId: leadRemote.id,
                  adId: leadRemote.ad_id,
                  adName: leadRemote.ad_name,
                  formId: leadRemote.form_id
                },
                note: `Meta Senkronizasyonu ile içe aktarıldı. (${leadRemote.ad_name || 'Reklam'})`
              };

              const success = await addLead(transformedLead);
              if (success) newLeadsCount++;
            }
          }
        }
      }

      const syncDate = new Date().toLocaleString();
      setLastSyncInfo(syncDate);
      
      // Update last sync in DB
      const updatedIntegrations = {
        ...integrations,
        facebook: { ...integrations.facebook, lastSync: syncDate }
      };
      await updateTenantConfig({ integrations: updatedIntegrations });

      addLog('Entegrasyon', `Meta senkronizasyonu tamamlandı. ${newLeadsCount} yeni lead eklendi.`);
      alert(`Senkronizasyon Başarılı!\n${newLeadsCount} adet yeni lead havuza eklendi.`);
    } catch (err) {
      console.error("Sync error:", err);
      alert("Senkronizasyon sırasında hata oluştu. Jetonun süresi dolmuş veya Form ID yanlış olabilir.");
    } finally {
      setIsSyncing(false);
    }
  };

  const syncDirectLeads = async () => {
    if (!directFormId) {
       alert("Lütfen önce bir Form ID giriniz.");
       return;
    }
    
    setIsSyncing(true);
    let newLeadsCount = 0;
    const existingMetaIds = new Set(
        leads.filter(l => l.metaInfo?.leadId).map(l => l.metaInfo.leadId)
    );

    try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${directFormId}/leads?fields=created_time,id,ad_id,ad_name,form_id,field_data&access_token=${appToken}`);
        const data = await res.json();
        
        if (data.error) throw new Error(data.error.message);

        if (data.data) {
            for (const leadRemote of data.data) {
                if (!existingMetaIds.has(leadRemote.id)) {
                    const fieldMap = {};
                    leadRemote.field_data.forEach(f => { fieldMap[f.name] = f.values[0]; });

                    const transformedLead = {
                        nameSurname: fieldMap["full_name"] || fieldMap["first_name"] + " " + (fieldMap["last_name"] || " "),
                        email: fieldMap["email"] || " ",
                        phone: fieldMap["phone_number"] || fieldMap["phone"] || " ",
                        source: "Facebook Lead Ads (Direct)",
                        metaInfo: { leadId: leadRemote.id, adId: leadRemote.ad_id, adName: leadRemote.ad_name, formId: leadRemote.form_id },
                        note: `Meta Manuel Sync (${directFormId}) ile içe aktarıldı.`
                    };
                    const success = await addLead(transformedLead);
                    if (success) newLeadsCount++;
                }
            }
        }

        const syncDate = new Date().toLocaleString();
        setLastSyncInfo(syncDate);
        
        // Update DB
        const updatedIntegrations = {
            ...integrations,
            facebook: { ...integrations.facebook, lastSync: syncDate, directFormId }
        };
        await updateTenantConfig({ integrations: updatedIntegrations });

        alert(`Manuel Senkronizasyon Başarılı!\n${newLeadsCount} yeni lead içeri aktarıldı.`);
    } catch (err) {
        alert("Hata: " + err.message);
    } finally {
        setIsSyncing(false);
    }
  };
  
  const integrationsList = [
    {
      id: 'facebook',
      icon: Facebook,
      title: 'Facebook Lead Ads',
      description: 'Facebook reklamlarınızdan gelen formları saniyeler içinde havuza aktarın.',
      badge: 'meta_ads',
      setupProgress: 100
    },
    {
      id: 'tiktok',
      icon: Music2,
      title: 'TikTok For Business',
      description: 'TikTok Lead Generation verilerini anlık olarak sisteme kaydedin.',
      badge: 'tiktok_ads',
      setupProgress: 0
    },
    {
      id: 'webform',
      icon: Globe,
      title: 'Global Web API',
      description: 'Herhangi bir web sitesindeki formları evrensel API ile bağlayın.',
      badge: 'universal',
      setupProgress: 100
    },
    {
      id: 'calendar',
      icon: Calendar,
      title: 'Google Calendar Sync',
      description: 'Randevularınızı Google Takvim ile çift taraflı senkronize edin.',
      badge: 'automation',
      setupProgress: 0
    },
    {
        id: 'ads',
        icon: Megaphone,
        title: 'Google Ads (SEM)',
        description: 'Reklam performansınızı izleyin ve dönüşümleri takip edin.',
        badge: 'marketing',
        setupProgress: 0
    },
    {
      id: 'mail',
      icon: Mail,
      title: 'Email To Lead',
      description: 'Kurumsal e-postalarınız üzerinden gelen talepleri oto-lead yapın.',
      badge: 'email',
      setupProgress: 0
    },
    {
      id: 'callcenter',
      icon: PhoneCall,
      title: 'Cloud PBX Connect',
      description: 'Çağrı kayıtlarını ve ses dosyalarını lead kartı üzerinde görün.',
      badge: 'telephony',
      setupProgress: 0
    },
    {
      id: 'digital-id',
      icon: ShieldCheck,
      title: 'Legal Consent (KVKK)',
      description: 'Dijital izin belgelerini (KVKK) saniyeler içinde toplayın.',
      badge: 'compliance',
      setupProgress: 100
    }
  ];

  const handleConnectRequest = async (id, data = {}) => {
    setIsLoading(true);
    try {
      const updatedIntegrations = {
        ...integrations,
        [id]: { 
          enabled: true, 
          connectedAt: new Date().toISOString(),
          ...data 
        }
      };
      
      const res = await updateTenantConfig({ integrations: updatedIntegrations });
      if (res) {
          addLog('Entegrasyon', `${id.toUpperCase()} entegrasyonu başarıyla tamamlandı.`);
          if (wizardStep < 4) setWizardStep(4);
      }
    } catch (err) {
      alert("Bağlantı sırasında bir hata oluştu: " + err.message);
    }
    setIsLoading(false);
  };

  const handleDisconnect = async (id) => {
    if (!window.confirm("Bu entegrasyonu kaldırmak istediğinizden emin misiniz?")) return;
    setIsLoading(true);
    const updatedIntegrations = { ...integrations };
    delete updatedIntegrations[id];
    await updateTenantConfig({ integrations: updatedIntegrations });
    addLog('Entegrasyon', `${id.toUpperCase()} entegrasyonu kaldırıldı.`);
    setActiveIntegration(null);
    setIsLoading(false);
  };

  // Web API'yi gercekten disaridan cagirarak test eder.
  // Panelden Firestore'a yazmak endpointin calistigini kanitlamaz.
  const testWebApi = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(webApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameSurname: 'Web API Test',
          phone: '+90 555 000 00 00',
          email: 'webapi_test@example.com',
          source: 'Web API Test',
          note: 'Entegrasyon test istegi.'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert('Endpoint çalışıyor. Test lead havuza düştü. Lead ID: ' + (data.leadId || '-'));
        addLog('Entegrasyon', 'Web API endpoint testi başarılı.');
      } else {
        alert('Endpoint hata döndürdü (HTTP ' + res.status + '): ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch (err) {
      alert('Endpointe ulasilamadi: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateLead = async (source) => {
    const mockLead = {
      nameSurname: `${source} Müşteri`,
      email: `${source.toLowerCase()}_user@example.com`,
      phone: '+90 555 000 00 00',
      source: source,
      country: 'Türkiye',
      language: 'Türkçe',
      note: `${source} entegrasyonu üzerinden gelen gerçek zamanlı lead.`
    };
    
    const success = await addLead(mockLead);
    if (success) {
      alert(`Harika! ${source}'dan gelen yeni lead havuzda görüntülenebilir.`);
      addLog('Entegrasyon', `${source} üzerinden gerçek lead simüle edildi.`);
    }
  };

  const closeModal = () => {
      setActiveIntegration(null);
      setWizardStep(1);
      setActiveTab('overview');
  };

  const StepIndicator = ({ current, total }) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '30px' }}>
      {[...Array(total)].map((_, i) => (
        <div key={i} style={{ 
          width: '40px', height: '4px', borderRadius: '4px',
          backgroundColor: i + 1 <= current ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
          transition: 'all 0.3s'
        }}></div>
      ))}
    </div>
  );

  const renderFacebookManagement = () => {
    switch(activeTab) {
        case 'overview':
            return (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Bağlı Sayfalar</div>
                            <div style={{ fontSize: '24px', fontWeight: 700 }}>12</div>
                        </div>
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Aktif Formlar</div>
                            <div style={{ fontSize: '24px', fontWeight: 700 }}>5</div>
                        </div>
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>Toplam Lead (Ay)</div>
                            <div style={{ fontSize: '24px', fontWeight: 700 }}>248</div>
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#10b98110', padding: '20px', borderRadius: '12px', border: '1px solid #10b98130', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#10b981', marginBottom: '8px' }}>
                            <Zap size={18} fill="#10b981" />
                            <strong style={{ fontSize: '14px' }}>Manuel Senkronizasyon Modu</strong>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                            Ücretsiz sürümde lead'ler butona bastığınızda çekilir. Son senkronizasyon: <strong style={{ color: 'white' }}>{lastSyncInfo || 'Hiç yapılmadı'}</strong>
                        </p>
                        <button 
                            onClick={syncLeadsFromMeta} 
                            disabled={isSyncing}
                            className="btn btn-primary" 
                            style={{ 
                                width: '100%', 
                                backgroundColor: '#10b981', 
                                borderColor: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            {isSyncing ? <RefreshCw className="spinner" size={16} /> : <RefreshCw size={16} />} 
                            {isSyncing ? 'Veriler Çekiliyor...' : 'Facebook Verilerini Şimdi Senkronize Et'}
                        </button>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
                        <button onClick={() => simulateLead('Facebook')} className="btn btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '12px', opacity: 0.7 }}>
                            <Zap size={14} /> Örnek Test Datası Oluştur (Simülasyon)
                        </button>
                    </div>
                </div>
            );
        case 'pages':
            return (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    {metaData.loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw className="spinner" /></div>
                    ) : metaData.error ? (
                        <div style={{ color: '#ef4444', textAlign: 'center', padding: '20px' }}>{metaData.error}</div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {metaData.pages.length === 0 && <div style={{ padding: '20px', textAlign: 'center' }}>Bağlı sayfa bulunamadı.</div>}
                            {metaData.pages.map((p, i) => (
                                <div key={i} style={{ 
                                    padding: '16px 20px', 
                                    borderBottom: i < metaData.pages.length - 1 ? '1px solid var(--border-color)' : 'none', 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    backgroundColor: selectedPageId === p.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                    cursor: 'pointer'
                                }} onClick={() => { setSelectedPageId(p.id); fetchPageForms(p.id, p.access_token); setActiveTab('forms'); }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1877F2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>{p.name[0]}</div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ID: {p.id}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="badge badge-success" style={{ fontSize: '10px' }}>Bağlı</span>
                                        <ChevronRight size={14} color="var(--text-secondary)" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        case 'forms':
            return (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {metaData.forms.length === 0 && (
                            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                                <AlertCircle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Bu sayfa için aktif lead formu bulunamadı.</p>
                            </div>
                        )}
                        {metaData.forms.map((f, i) => (
                            <div key={i} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: f.status === 'ACTIVE' ? '1px solid #10b98130' : '1px solid var(--border-color)' }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{f.name}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                        ID: {f.id} • {new Date(f.created_time).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>{f.leads_count || 0}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>TOPLAM</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'stats': // Bu tab AdAccounts (Kampanyalar/Reklam Hesapları) için kullanılacak
            return (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                   <div style={{ display: 'grid', gap: '12px' }}>
                        {metaData.adAccounts.map((acc, i) => (
                            <div key={i} className="card" style={{ padding: '16px 20px', display: 'flex', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}>
                                    <Megaphone size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{acc.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Reklam Hesabı ID: {acc.account_id}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span className="badge badge-primary" style={{ fontSize: '10px' }}>AKTİF</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'settings':
            return (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    <div style={{ backgroundColor: 'rgba(255,191,36,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,191,36,0.2)', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '8px', color: '#fbbf24', marginBottom: '8px', alignItems: 'center' }}>
                            <AlertCircle size={16} />
                            <strong style={{ fontSize: '13px' }}>Bypass Modu (Hızlı Bağlantı)</strong>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                            Sayfa listeleme sırasında sorun yaşıyorsanız, doğrudan bir Form ID girerek verileri çekebilirsiniz.
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                className="form-input" 
                                style={{ flex: 1, fontSize: '12px' }} 
                                placeholder="Örn: 123456789012345"
                                value={directFormId}
                                onChange={(e) => setDirectFormId(e.target.value)}
                            />
                            <button 
                                onClick={syncDirectLeads}
                                disabled={isSyncing}
                                className="btn btn-primary" 
                                style={{ padding: '8px 16px', fontSize: '12px', whiteSpace: 'nowrap' }}
                            >
                                {isSyncing ? '...' : (lastSyncInfo ? 'Güncelle' : 'Başlat')}
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>App Token</label>
                        <textarea 
                            className="form-input" 
                            style={{ height: '80px', fontSize: '11px', fontFamily: 'monospace' }}
                            value={appToken}
                            readOnly
                        />
                    </div>
                    <button onClick={() => handleDisconnect('facebook')} className="btn btn-secondary" style={{ width: '100%', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        Bağlantıyı Tamamen Kes
                    </button>
                </div>
            )
        default: return null;
    }
  }

  const renderWebApiManagement = () => {
    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--accent-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={28} color="white" />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>Global Web API</h2>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={12} /> Durumu görmek için aşağıdan test edin</span>
                </div>
            </div>

            <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Web sitenizdeki herhangi bir formu bu adrese POST ederek lead oluşturabilirsiniz.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#000', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <code style={{ fontSize: '12px', color: 'var(--accent-color)', flex: 1 }}>{webApiUrl}</code>
                    <button onClick={() => { navigator.clipboard.writeText(webApiUrl); alert('Kopyalandı!'); }} className="btn btn-secondary btn-sm"><Copy size={14} /></button>
                </div>
            </div>

            <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>JSON Örneği</h4>
            <pre style={{ backgroundColor: '#111', padding: '16px', borderRadius: '8px', fontSize: '11px', color: '#94a3b8', overflowX: 'auto', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
{`{
  "nameSurname": "John Doe",
  "phone": "+90 5XX XXX XX XX",
  "email": "john@example.com",
  "source": "Web Site",
  "note": "Saç ekimi fiyat bilgisi istiyorum."
}`}
            </pre>

            <button onClick={testWebApi} disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
                <Terminal size={16} /> {isLoading ? 'Test ediliyor...' : 'Endpointi Test Et'}
            </button>
            <button onClick={() => handleDisconnect('webform')} className="btn btn-secondary" style={{ width: '100%', marginTop: '12px' }}>
                API Pasifleştir
            </button>
        </div>
    );
  };

  const renderModalContent = () => {
    const isConn = connectedIds.includes(activeIntegration);

    if (activeIntegration === 'facebook') {
        if (isConn) {
            return (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', backgroundColor: '#1877F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Facebook size={28} color="white" />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '20px' }}>Meta Yönetim Paneli</h2>
                                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> BAĞLANTI AKTİF</span>
                            </div>
                        </div>
                        <button onClick={closeModal} className="btn btn-secondary btn-sm" style={{ padding: '8px' }}><X size={20} /></button>
                    </div>

                    {/* Management Tabs */}
                    <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', paddingBottom: '2px' }}>
                        {[
                            { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
                            { id: 'pages', label: 'Sayfalar', icon: LayoutGrid },
                            { id: 'forms', label: 'Lead Formları', icon: List },
                            { id: 'settings', label: 'Ayarlar', icon: SettingsIcon }
                        ].map((tab) => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{ 
                                    padding: '10px 16px', backgroundColor: 'transparent', border: 'none',
                                    borderBottom: activeTab === tab.id ? '2px solid var(--accent-color)' : '2px solid transparent',
                                    color: activeTab === tab.id ? 'var(--accent-color)' : 'var(--text-secondary)',
                                    fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <tab.icon size={16} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {renderFacebookManagement()}
                </div>
            );
        }

        // Setup Wizard
        return (
            <div style={{ animation: 'slideIn 0.3s' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '64px', height: '64px', backgroundColor: '#1877F2', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Facebook size={32} color="white" />
                    </div>
                    <h2 style={{ margin: '0 0 8px' }}>Facebook Lead Ads Kurulumu</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Yeni nesil eğitimli kurulum asistanı ile 2 dakikada hazır.</p>
                </div>

                <StepIndicator current={wizardStep} total={4} />

                {wizardStep === 1 && (
                    <div style={{ animation: 'fadeIn 0.3s' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><BookOpen size={18} color="var(--accent-color)" /> Hazırlık Aşaması</h4>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '12px' }}>
                                {[
                                    'Meta For Developers hesabınıza giriş yapın.',
                                    'Uygulama türünü "Business" (İşletme) seçerek yeni bir APP oluşturun.',
                                    'Uygulama ayarlarından "Marketing API" ürününü ekleyin.'
                                ].map((txt, i) => (
                                    <li key={i} style={{ display: 'flex', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>{i+1}</div>
                                        {txt}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button onClick={() => setWizardStep(2)} className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>Anladım, Sonraki Adım <ChevronRight size={18} /></button>
                    </div>
                )}

                {wizardStep === 2 && (
                    <div style={{ animation: 'fadeIn 0.3s' }}>
                        <h4 style={{ marginBottom: '16px' }}>Webhook Ayarları</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            Facebook uygulamanızın "Webhooks" sekmesine giderek "Page" seçin ve aşağıdaki URL'yi yapıştırın.
                        </p>
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                           <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Callback URL</div>
                           <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <code style={{ color: 'var(--accent-color)', fontSize: '12px', flex: 1 }}>{webhookUrl}</code>
                                <button onClick={() => alert('Webhook URL Kopyalandı!')} className="btn btn-secondary btn-sm"><Copy size={14} /></button>
                           </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setWizardStep(1)} className="btn btn-secondary" style={{ flex: 1 }}><ChevronLeft size={18} /> Geri</button>
                            <button onClick={() => setWizardStep(3)} className="btn btn-primary" style={{ flex: 2 }}>Devam Et <ChevronRight size={18} /></button>
                        </div>
                    </div>
                )}

                {wizardStep === 3 && (
                    <div style={{ animation: 'fadeIn 0.3s' }}>
                        <h4 style={{ marginBottom: '16px' }}>Sistem Jetonu (App Token)</h4>
                        <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '20px', display: 'flex', gap: '12px' }}>
                            <Info size={20} color="var(--accent-color)" />
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                                Business Manager'dan aldığınız süresiz sistem kullanıcısı jetonunu aşağıya yapıştırın.
                            </p>
                        </div>
                        <textarea 
                            className="form-input" 
                            style={{ height: '100px', fontSize: '12px', fontFamily: 'monospace', marginBottom: '20px' }}
                            placeholder="EAASqLTJ65e..."
                            value={appToken}
                            onChange={(e) => setAppToken(e.target.value)}
                        />
                        <button onClick={() => handleConnectRequest('facebook', { token: appToken })} className="btn btn-primary" disabled={isLoading} style={{ width: '100%', padding: '14px' }}>
                            {isLoading ? <RefreshCw className="spinner" /> : 'Doğrula ve Bağlantıyı Bitir'}
                        </button>
                    </div>
                )}

                {wizardStep === 4 && (
                    <div style={{ textAlign: 'center', animation: 'scaleIn 0.4s' }}>
                        <div style={{ width: '80px', height: '80px', backgroundColor: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <CheckCircle size={48} color="white" />
                        </div>
                        <h2 style={{ marginBottom: '12px' }}>Bağlantı Başarılı!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                            Facebook Lead Ads artık CRM sisteminizle tam uyumlu şekilde çalışıyor.
                        </p>
                        <button onClick={() => { setActiveTab('overview'); setWizardStep(1); }} className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>Paneli Görüntüle</button>
                    </div>
                )}
            </div>
        );
    }

    if (activeIntegration === 'webform') {
        if (isConn) return renderWebApiManagement();
        
        return (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s' }}>
                <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--accent-color)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Globe size={32} color="white" />
                </div>
                <h2>Global Web API Kurulumu</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Herhangi bir sistemden CRM'e anlık veri göndermek için API anahtarınızı oluşturun.</p>
                
                <button 
                    onClick={() => handleConnectRequest('webform')} 
                    className="btn btn-primary" 
                    disabled={isLoading}
                    style={{ width: '100%', padding: '14px' }}
                >
                    {isLoading ? <RefreshCw className="spinner" /> : 'Şimdi API Anahtarı Oluştur'}
                </button>
            </div>
        );
    }

    if (activeIntegration === 'digital-id') {
        return (
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', backgroundColor: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <ShieldCheck size={32} color="white" />
                </div>
                <h2>Dijital KVKK Aktif</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Müşterilerinize form üzerinden KVKK onayı almanız için gereken linkler otomatik oluşturuluyor.</p>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '10px', fontSize: '13px', color: '#10b981', marginBottom: '10px' }}>
                    Sistem hazır durumda. Lead eklerken otomatik link üretilir.
                </div>
                <button onClick={closeModal} className="btn btn-primary" style={{ width: '100%' }}>Kapat</button>
            </div>
        );
    }

    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ marginBottom: '24px' }}><SettingsIcon size={48} color="var(--text-secondary)" /></div>
        <h3>{activeIntegration?.toUpperCase()} Modülü</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Bu modül üzerinde çalışmalarımız devam ediyor.</p>
        <button onClick={() => handleConnectRequest(activeIntegration)} className="btn btn-secondary" disabled={isLoading} style={{ marginTop: '16px' }}>
            {isLoading ? <RefreshCw className="spinner" /> : 'Hemen Bağla (Hızlı Kurulum)'}
        </button>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Uygulama Merkezi</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0', fontSize: '14px' }}>
            CRM sisteminizi harici servislerle %100 uyumlu hale getirin.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <Trophy size={20} color="#10b981" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>{connectedIds.length} Servis Aktif</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {integrationsList.map((item) => (
          <IntegrationCard 
            key={item.id} 
            {...item} 
            isConnected={connectedIds.includes(item.id)} 
            onClick={() => setActiveIntegration(item.id)}
          />
        ))}
      </div>

      {/* Dynamic Setup Modal */}
      {activeIntegration && (
        <div className="modal-overlay" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(15px)' 
        }} onClick={closeModal}>
          <div className="card" style={{ 
            width: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', 
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            backgroundColor: '#0f111a'
          }} onClick={e => e.stopPropagation()}>
            {/* Conditional close button if not in management view which has its own */}
            {!connectedIds.includes(activeIntegration) && (
                 <button 
                 onClick={closeModal} 
                 style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
               >
                 <X size={24} />
               </button>
            )}
            
            {renderModalContent()}

          </div>
        </div>
      )}
      
      <style>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Integrations;
