import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LogOut, Globe, Menu, Bell, BellRing, Info, Sparkles, Sun, Moon,
  LayoutDashboard, Briefcase, UserPlus, Clock, ListOrdered, FileText, 
  BarChart3, Wallet, TrendingUp, TrendingDown, ShoppingCart, Banknote, 
  List, Hourglass, CircleDollarSign, Receipt, Upload, Building2, 
  CreditCard, ListChecks, CheckCircle2, Calendar, PlusCircle, 
  LifeBuoy, User, Settings, Shield, ClipboardList, Zap, 
  SlidersHorizontal, ChevronDown, BellDot, UserCheck, Star, Code, 
  Syringe, Package, Tag, Boxes, MessageSquare
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { I18nContext } from '../context/I18nContext';
import { ThemeContext } from '../context/ThemeContext';
import logoImg from '../assets/ihc_logo.webp';
import zbtLogo from '../assets/zbt_media_beyaz_logo.webp';

// "3 saat önce" gibi kisa gorece tarih uretir.
const formatRelativeDate = (iso) => {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Az önce';
  if (minutes < 60) return `${minutes} dakika önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Dün';
  if (days < 30) return `${days} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR');
};

const Header = () => {
  const { currentUser, logout, roles, tenantConfig, leads, tenantSlug } = useContext(AppContext);
  const { t, currentLang, changeLanguage } = useContext(I18nContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Mobil cekmece menu. Dar ekranda yatay serit tasip okunamadigi icin menu
  // yandan acilan panele donusuyor; alt menuler hover yerine dokunusla aciliyor.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (key) => setOpenMenu(prev => (prev === key ? null : key));


  // Sistem duyurulari (sabit). Lead bildirimleri asagida bunlarla birlestirilir.
  const [systemNotifications, setSystemNotifications] = useState([
    { 
      id: 1, 
      type: 'update', 
      title: 'Sistem Güncellemesi', 
      text: 'Lead yanıt süresi analizi ve silme yetkileri sisteme eklendi.', 
      date: 'Bugün',
      read: false 
    },
    { 
      id: 2, 
      type: 'info', 
      title: 'Destek Hatırlatması', 
      text: 'Her türlü hata ve öneriniz için Destek Talebi bölümünü kullanmayı unutmayın.', 
      date: 'Dün',
      read: false 
    },
    { 
      id: 3, 
      type: 'feature', 
      title: 'Yeni Özellik', 
      text: 'Dashboard artık varsayılan olarak 1 aylık veri ile açılmaktadır.', 
      date: '2 gün önce',
      read: true 
    }
  ]);

  // Okundu bilgisi kullaniciya ozel, tarayicida tutulur.
  const seenKey = `tenant_${tenantSlug}_seen_leads_${currentUser?.id}`;
  const [seenLeadIds, setSeenLeadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(seenKey) || '[]'));
    } catch {
      return new Set();
    }
  });

  // Kullaniciya atanmis, henuz aranmamis leadler bildirime donusur.
  const leadNotifications = useMemo(() => {
    if (!currentUser) return [];
    return (leads || [])
      .filter(l =>
        String(l.assigneeId) === String(currentUser.id) &&
        l.status === 'Aranmayı Bekliyor'
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 15)
      .map(l => ({
        id: `lead-${l.id}`,
        type: 'lead',
        leadId: l.id,
        title: l.autoAssigned ? 'Yeni Lead Atandı' : 'Yeni Lead',
        text: `${l.nameSurname || 'İsimsiz'}${l.assignedLanguage ? ' (' + l.assignedLanguage + ')' : ''} — ${l.source || 'Kaynak belirtilmemiş'}`,
        date: formatRelativeDate(l.createdAt),
        read: seenLeadIds.has(l.id)
      }));
  }, [leads, currentUser, seenLeadIds]);

  const notifications = [...leadNotifications, ...systemNotifications];
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    const ids = leadNotifications.map(n => n.leadId);
    const merged = new Set([...seenLeadIds, ...ids]);
    setSeenLeadIds(merged);
    try {
      localStorage.setItem(seenKey, JSON.stringify([...merged]));
    } catch {
      // Depolama kapaliysa bildirimler okunmamis kalir, kritik degil.
    }
    setSystemNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const check = (permKey) => {
    if (!currentUser) return false;
    if (Number(currentUser.level) === 5) return true;
    const role = roles?.find(r => Number(r.level) === Number(currentUser.level));
    return role?.permissions?.[permKey] || false;
  };

  const isDesktopVisible = (path) => {
    if (!currentUser) return false;
    const level = Number(currentUser.level);
    if (level >= 4) return true;
    if (path === '/') return check('viewDashboard');
    if (path === '/new-lead') return check('addLead');
    if (path === '/leads') return check('viewLeads');
    if (path === '/profile') return true;
    if (path === '/notes-tasks') return true;
    if (path === '/quote-form') return true;
    if (path === '/support') return true;
    if (path === '/users') return level === 5;
    return false;
  };

  if (!currentUser) return null;

  return (
    <header className="topbar">
      <div className="topbar-content">
        {/* Top Section: Branding & User Profile */}
        <div className="topbar-main">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileNavOpen(o => !o)}
              aria-label="Menü"
              aria-expanded={mobileNavOpen}
            >
              <Menu size={22} />
            </button>
            <div className="topbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '20px' }}>
              <img src={tenantConfig?.logo || logoImg} alt="Logo" style={{ height: '32px', filter: 'brightness(1.1)' }} />
              <div className="topbar-brand-text" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>{tenantConfig?.name?.toUpperCase() || 'ISTANBUL HAIR CENTER'}</span>
                <span style={{ fontSize: '10px', color: 'var(--accent-color)', fontWeight: 600, letterSpacing: '2px' }}>ZBT CRM SYSTEMS</span>
              </div>
            </div>

            <div className="topbar-welcome" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="welcome-text" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{t('welcome')}, </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{currentUser.name}</span>
            </div>
          </div>

          <div className="user-info">
            {/* Lang Swiper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginRight: '16px', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '16px' }}>
              <button 
                onClick={toggleTheme} 
                className="theme-toggle-btn"
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginRight: '16px', borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '16px' }}>
              <Globe size={16} />
              <select value={currentLang} onChange={(e) => changeLanguage(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                <option value="tr">TR</option><option value="en">EN</option><option value="de">DE</option><option value="ru">RU</option><option value="fr">FR</option><option value="es">ES</option><option value="ar">AR</option>
              </select>
            </div>

            <div ref={notificationRef} style={{ position: 'relative', marginRight: '16px' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                style={{ background: 'transparent', border: 'none', color: unreadCount > 0 ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer', position: 'relative' }}
              >
                {unreadCount > 0 ? <BellRing size={20} /> : <Bell size={20} />}
                {unreadCount > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--error)', color: '#fff', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div style={{ 
                  position: 'absolute', top: '40px', right: 0, width: '320px', 
                  backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 
                  borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 1000,
                  overflow: 'hidden', animation: 'fadeIn 0.2s'
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>Bildirimler</span>
                    <button 
                      onClick={markAllRead}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Tümünü okundu işaretle
                    </button>
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications.length === 0 && <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Bildirim yok.</div>}
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.leadId) return;
                          setShowNotifications(false);
                          navigate(`/leads/${n.leadId}`);
                        }}
                        style={{
                          padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.02)',
                          backgroundColor: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                          cursor: n.leadId ? 'pointer' : 'default',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            backgroundColor: n.type === 'lead' ? 'rgba(245, 158, 11, 0.12)' : n.type === 'update' ? 'rgba(59, 130, 246, 0.1)' : n.type === 'feature' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: n.type === 'lead' ? '#f59e0b' : n.type === 'update' ? '#3b82f6' : n.type === 'feature' ? '#a855f7' : '#10b981'
                          }}>
                            {n.type === 'lead' ? <UserPlus size={16} /> : n.type === 'update' ? <Zap size={16} /> : n.type === 'feature' ? <Sparkles size={16} /> : <Info size={16} />}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{n.title}</div>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{n.text}</p>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '8px', display: 'block' }}>{n.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
                    <NavLink to="/release-notes" onClick={() => setShowNotifications(false)} style={{ fontSize: '12px', color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>Tüm Güncellemeleri Gör</NavLink>
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', marginRight: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{currentUser.role}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Seviye {currentUser.level}</span>
            </div>
            
            <div className="user-avatar" style={{ border: '2px solid rgba(255,255,255,0.1)', marginRight: 0 }}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>

            <button onClick={logout} className="btn-logout" title={t('logout')} style={{ marginLeft: '12px', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Bottom Section: Navigation Menu */}
        <div
          className={`nav-overlay ${mobileNavOpen ? 'visible' : ''}`}
          onClick={() => setMobileNavOpen(false)}
        />

        <nav
          className={`horizontal-nav ${mobileNavOpen ? 'open' : ''}`}
          onClick={(e) => { if (e.target.closest('a')) setMobileNavOpen(false); }}
        >
          <NavLink to="/" className="nav-link"><LayoutDashboard size={18} /> <span>{t('dashboard')}</span></NavLink>
          
          <div className={`nav-item ${openMenu === 'crm' ? 'open' : ''}`}>
            <div className="nav-link" onClick={() => toggleMenu('crm')}>
              <Briefcase size={18} /> <span>CRM</span> <ChevronDown size={14} />
            </div>
            <div className="nav-dropdown">
              {isDesktopVisible('/new-lead') && <NavLink to="/new-lead" className="dropdown-link"><UserPlus size={16} /> <span>{t('newLead')}</span></NavLink>}
              {isDesktopVisible('/lead-pool') && <NavLink to="/lead-pool" className="dropdown-link"><Clock size={16} /> <span>{t('leadPool')}</span></NavLink>}
              {isDesktopVisible('/leads') && <NavLink to="/leads" className="dropdown-link"><ListOrdered size={16} /> <span>{t('leads')}</span></NavLink>}
              <NavLink to="/notes-tasks" className="dropdown-link"><FileText size={16} /> <span>Notlar & Görevler</span></NavLink>
            </div>
          </div>

          <NavLink to="/quote-form" className="nav-link"><Briefcase size={18} /> <span>Teklif Formu</span></NavLink>
          
          {isDesktopVisible('/reports') && <NavLink to="/reports" className="nav-link"><BarChart3 size={18} /> <span>Raporlar</span></NavLink>}

          {isDesktopVisible('/finance') && (
            <div className={`nav-item ${openMenu === 'finance' ? 'open' : ''}`}>
              <div className="nav-link" onClick={() => toggleMenu('finance')}>
                <Wallet size={18} /> <span>Gelir / Gider</span> <ChevronDown size={14} />
              </div>
              <div className="nav-dropdown nav-dropdown-wide">
                <span style={{ fontSize: '11px', color: 'var(--success)', padding: '4px 12px', display: 'block', fontWeight: 700 }}>GELİR YÖNETİMİ</span>
                <NavLink to="/finance/new-sale" className="dropdown-link"><ShoppingCart size={14} /> <span>Yeni Satış</span></NavLink>
                <NavLink to="/finance/cash-desk" className="dropdown-link"><Banknote size={14} /> <span>Kasa</span></NavLink>
                <NavLink to="/finance/sales-list" className="dropdown-link"><List size={14} /> <span>Satış Listesi</span></NavLink>
                <NavLink to="/finance/balance-list" className="dropdown-link"><Hourglass size={14} /> <span>Bakiye Listesi</span></NavLink>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }} />
                <span style={{ fontSize: '11px', color: 'var(--error)', padding: '4px 12px', display: 'block', fontWeight: 700 }}>GİDER YÖNETİMİ</span>
                <NavLink to="/finance/record-expense" className="dropdown-link"><Upload size={14} /> <span>Gider Kaydet</span></NavLink>
                <NavLink to="/finance/new-company" className="dropdown-link"><Building2 size={14} /> <span>Yeni Firma</span></NavLink>
                <NavLink to="/finance/company-list" className="dropdown-link"><Briefcase size={14} /> <span>Firma Listesi</span></NavLink>
                <NavLink to="/finance/new-purchase" className="dropdown-link"><ShoppingCart size={14} /> <span>Ödeme Alımı</span></NavLink>
              </div>
            </div>
          )}

          <div className={`nav-item ${openMenu === 'appointments' ? 'open' : ''}`}>
            <div className="nav-link" onClick={() => toggleMenu('appointments')}>
              <Calendar size={18} /> <span>Randevu</span> <ChevronDown size={14} />
            </div>
            <div className="nav-dropdown">
              <NavLink to="/appointments/new" className="dropdown-link"><PlusCircle size={14} /> <span>Yeni Randevu</span></NavLink>
              <NavLink to="/appointments/calendar" className="dropdown-link"><Calendar size={14} /> <span>Takvim</span></NavLink>
              <NavLink to="/appointments/list" className="dropdown-link"><List size={14} /> <span>Randevu Listesi</span></NavLink>
              <NavLink to="/appointments/events" className="dropdown-link"><Clock size={14} /> <span>Etkinlikler</span></NavLink>
            </div>
          </div>

          <NavLink to="/support" className="nav-link"><LifeBuoy size={18} /> <span>{t('support')}</span></NavLink>

          <div className="nav-spacer"></div>

          <NavLink to="/profile" className="nav-link"><User size={18} /> <span>Profil</span></NavLink>
          
          {currentUser.level === 5 && (
            <div className={`nav-item ${openMenu === 'system' ? 'open' : ''}`}>
              <div className="nav-link" onClick={() => toggleMenu('system')}>
                <Settings size={18} /> <span>Sistem & Ayarlar</span> <ChevronDown size={14} />
              </div>
              <div className="nav-dropdown nav-dropdown-right">
                <NavLink to="/users" className="dropdown-link"><Shield size={14} /> <span>Kullanıcılar</span></NavLink>
                <NavLink to="/logs" className="dropdown-link"><ClipboardList size={14} /> <span>Sistem Logları</span></NavLink>
                <NavLink to="/integrations" className="dropdown-link"><Zap size={14} /> <span>Entegrasyonlar</span></NavLink>
                <NavLink to="/settings" className="dropdown-link"><SlidersHorizontal size={14} /> <span>CRM Ayarları</span></NavLink>
                <NavLink to="/release-notes" className="dropdown-link"><BellDot size={14} /> <span>Güncelleme Notları</span></NavLink>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }} />
                <NavLink to="/system/permissions" className="dropdown-link"><Shield size={14} /> <span>Yetki</span></NavLink>
                <NavLink to="/system/security" className="dropdown-link"><UserCheck size={14} /> <span>Güvenlik</span></NavLink>
                <NavLink to="/system/api" className="dropdown-link"><Code size={14} /> <span>API Yönetimi</span></NavLink>
                <NavLink to="/system/services" className="dropdown-link"><Syringe size={14} /> <span>Hizmet / Ürün</span></NavLink>
              </div>
            </div>
          )}

          {/* Dar ekranda ust bardaki cikis dugmesine yer kalmiyor; menude de duruyor. */}
          <button className="nav-link nav-logout" onClick={logout}>
            <LogOut size={18} /> <span>{t('logout')}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
