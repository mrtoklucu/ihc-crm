import React, { useContext, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, UserPlus, ListOrdered, Shield, LayoutDashboard, User, ClipboardList, Settings, ChevronDown, ChevronRight, LifeBuoy, Zap, Clock, SlidersHorizontal, Briefcase, BarChart3, FileText, Wallet, ShoppingCart, Banknote, History, Hourglass, CircleDollarSign, Upload, Building2, CreditCard, ListChecks, CheckCircle2, TrendingUp, TrendingDown, Receipt, List, BellDot, Calendar, PlusCircle, UserCheck, Star, Code, Syringe, Package, Tag, Boxes, MessageSquare } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { I18nContext } from '../context/I18nContext';

const Sidebar = ({ isOpen }) => {
  const { currentUser, checkPermission, roles } = useContext(AppContext);
  const { t } = useContext(I18nContext);
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCrmOpen, setIsCrmOpen] = useState(true);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isAppointmentsOpen, setIsAppointmentsOpen] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);
  const [isGelirOpen, setIsGelirOpen] = useState(false);
  const [isGiderOpen, setIsGiderOpen] = useState(false);

  const check = (permKey) => {
    if (!currentUser) return false;
    // Fallback for Admin
    if (Number(currentUser.level) === 5) return true;
    
    // Find role by level (ensure number comparison)
    const role = roles?.find(r => Number(r.level) === Number(currentUser.level));
    return role?.permissions?.[permKey] || false;
  };

  const isDesktopVisible = (path) => {
    if (!currentUser) return false;
    const level = Number(currentUser.level);

    // Global Admin or General Coordinator can see almost everything
    if (level >= 4) return true;

    // Specific route checks for lower levels
    if (path === '/') return check('viewDashboard');
    if (path === '/new-lead') return check('addLead');
    if (path === '/leads') return check('viewLeads');
    if (path === '/profile') return check('viewProfile'); // profile edit permission is check('editProfile')
    if (path === '/notes-tasks') return true; // Available to all users
    if (path === '/quote-form') return true; // Available to all users
    if (path === '/support') return true; // Available to all users
    
    // Admin only pages (redundant since level >= 4 returns true above, but good for clarity)
    if (path === '/users') return level === 5;
    if (path === '/logs') return level === 5;
    if (path === '/integrations') return level === 5;
    if (path === '/settings') return level === 5;
    if (path === '/reports') return level === 5;
    
    return false;
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div style={{ height: '24px' }}></div> {/* Spacer to clean up the look */}

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isDesktopVisible('/') && (
          <NavLink to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>{t('dashboard')}</span>
          </NavLink>
        )}

        <div 
          className={`nav-link`} 
          style={{ cursor: 'pointer', justifyContent: 'space-between' }} 
          onClick={() => setIsCrmOpen(!isCrmOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Briefcase size={20} />
            <span>CRM</span>
          </div>
          {isCrmOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        {isCrmOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            {isDesktopVisible('/new-lead') && (
              <NavLink to="/new-lead" className={`nav-link ${location.pathname === '/new-lead' ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                <UserPlus size={18} />
                <span>{t('newLead')}</span>
              </NavLink>
            )}
            
            {isDesktopVisible('/lead-pool') && (
              <NavLink to="/lead-pool" className={`nav-link ${location.pathname === '/lead-pool' ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                <Clock size={18} />
                <span>{t('leadPool')}</span>
              </NavLink>
            )}
            
            {isDesktopVisible('/leads') && (
              <NavLink to="/leads" className={`nav-link ${location.pathname === '/leads' ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
                <ListOrdered size={18} />
                <span>{t('leads')}</span>
              </NavLink>
            )}

            <NavLink to="/notes-tasks" className={`nav-link ${location.pathname === '/notes-tasks' ? 'active' : ''}`} style={{ paddingLeft: '48px' }}>
              <FileText size={18} />
              <span>Notlar & Görevler</span>
            </NavLink>
          </div>
        )}

        <NavLink to="/quote-form" className={`nav-link ${location.pathname === '/quote-form' ? 'active' : ''}`}>
          <Briefcase size={20} />
          <span>Teklif Formu</span>
        </NavLink>

        {isDesktopVisible('/reports') && (
          <NavLink to="/reports" className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}>
            <BarChart3 size={20} />
            <span>Raporlar</span>
          </NavLink>
        )}

        {/* Gelir / Gider - Finance */}
        {isDesktopVisible('/finance') && (
          <>
            <div 
              className={`nav-link`} 
              style={{ cursor: 'pointer', justifyContent: 'space-between' }} 
              onClick={() => setIsFinanceOpen(!isFinanceOpen)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Wallet size={20} />
                <span>Gelir / Gider</span>
              </div>
              {isFinanceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>

            {isFinanceOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                
                {/* Gelir Submenu */}
                <div 
                  className={`nav-link`} 
                  style={{ cursor: 'pointer', paddingLeft: '48px', justifyContent: 'space-between', fontSize: '13px' }} 
                  onClick={() => setIsGelirOpen(!isGelirOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TrendingUp size={16} color="#10b981" />
                    <span>Gelir Yönetimi</span>
                  </div>
                  {isGelirOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </div>
                {isGelirOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '64px' }}>
                    <NavLink to="/finance/new-sale" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <ShoppingCart size={14} /> <span>Yeni Satış</span>
                    </NavLink>
                    <NavLink to="/finance/cash-desk" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <Banknote size={14} /> <span>Kasa</span>
                    </NavLink>
                    <NavLink to="/finance/sales-list" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <List size={14} /> <span>Satış Listesi</span>
                    </NavLink>
                    <NavLink to="/finance/balance-list" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <Hourglass size={14} /> <span>Bakiye Listesi</span>
                    </NavLink>
                    <NavLink to="/finance/bank-summary" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <BarChart3 size={14} /> <span>Banka Özet</span>
                    </NavLink>
                    <NavLink to="/finance/invoices" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <Receipt size={14} /> <span>Faturalar</span>
                    </NavLink>
                    <NavLink to="/finance/incomes" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <CircleDollarSign size={14} /> <span>Gelirler</span>
                    </NavLink>
                  </div>
                )}

                {/* Gider Submenu */}
                <div 
                  className={`nav-link`} 
                  style={{ cursor: 'pointer', paddingLeft: '48px', justifyContent: 'space-between', fontSize: '13px' }} 
                  onClick={() => setIsGiderOpen(!isGiderOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TrendingDown size={16} color="#ef4444" />
                    <span>Gider Yönetimi</span>
                  </div>
                  {isGiderOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </div>
                {isGiderOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '64px' }}>
                    <NavLink to="/finance/record-expense" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <Upload size={14} /> <span>Gider Kaydet</span>
                    </NavLink>
                    <NavLink to="/finance/new-company" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <Building2 size={14} /> <span>Yeni Firma</span>
                    </NavLink>
                    <NavLink to="/finance/company-list" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <Briefcase size={14} /> <span>Firma Listesi</span>
                    </NavLink>
                    <NavLink to="/finance/new-purchase" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <ShoppingCart size={14} /> <span>Yeni Ödeme/Ürün Alımı</span>
                    </NavLink>
                    <NavLink to="/finance/company-payments" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <CreditCard size={14} /> <span>Firma Ödemeleri</span>
                    </NavLink>
                    <NavLink to="/finance/payables" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <ListChecks size={14} /> <span>Ödenecekler</span>
                    </NavLink>
                    <NavLink to="/finance/approvals" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <CheckCircle2 size={14} /> <span>Onaylar</span>
                    </NavLink>
                    <NavLink to="/finance/expenses" className="nav-link sub-nav" style={{ fontSize: '12px', padding: '8px 12px' }}>
                      <Banknote size={14} /> <span>Giderler</span>
                    </NavLink>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Randevu */}
        <div 
          className={`nav-link`} 
          style={{ cursor: 'pointer', justifyContent: 'space-between' }} 
          onClick={() => setIsAppointmentsOpen(!isAppointmentsOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={20} />
            <span>Randevu</span>
          </div>
          {isAppointmentsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        {isAppointmentsOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <NavLink to="/appointments/new" className="nav-link sub-nav" style={{ paddingLeft: '48px', fontSize: '13px' }}>
              <PlusCircle size={16} /> <span>Yeni Randevu</span>
            </NavLink>
            <NavLink to="/appointments/calendar" className="nav-link sub-nav" style={{ paddingLeft: '48px', fontSize: '13px' }}>
              <Calendar size={16} /> <span>Takvim</span>
            </NavLink>
            <NavLink to="/appointments/list" className="nav-link sub-nav" style={{ paddingLeft: '48px', fontSize: '13px' }}>
              <List size={16} /> <span>Randevu Listesi</span>
            </NavLink>
            <NavLink to="/appointments/events" className="nav-link sub-nav" style={{ paddingLeft: '48px', fontSize: '13px' }}>
              <Clock size={16} /> <span>Etkinlikler</span>
            </NavLink>
          </div>
        )}

        <NavLink to="/support" className={`nav-link ${location.pathname === '/support' ? 'active' : ''}`}>
          <LifeBuoy size={20} />
          <span>{t('support')}</span>
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto', padding: '16px 0' }}>
        {isDesktopVisible('/profile') && (
          <NavLink to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
            <User size={20} />
            <span>{t('profile')}</span>
          </NavLink>
        )}

        {(Number(currentUser.level) === 5) && (
          <>
            <div 
              className={`nav-link`} 
              style={{ cursor: 'pointer', justifyContent: 'space-between' }} 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Settings size={20} />
                <span>{t('settings')}</span>
              </div>
              {isSettingsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {isSettingsOpen && (
              <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                {isDesktopVisible('/users') && (
                  <NavLink to="/users" className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`} style={{ fontSize: '13px', padding: '10px 24px' }}>
                    <Shield size={16} />
                    <span>{t('users')}</span>
                  </NavLink>
                )}
                {isDesktopVisible('/logs') && (
                  <NavLink to="/logs" className={`nav-link ${location.pathname === '/logs' ? 'active' : ''}`} style={{ fontSize: '13px', padding: '10px 24px' }}>
                    <ClipboardList size={16} />
                    <span>{t('logs')}</span>
                  </NavLink>
                )}
                {isDesktopVisible('/integrations') && (
                  <NavLink to="/integrations" className={`nav-link ${location.pathname === '/integrations' ? 'active' : ''}`} style={{ fontSize: '13px', padding: '10px 24px' }}>
                    <Zap size={16} />
                    <span>{t('integrations')}</span>
                  </NavLink>
                )}
                {isDesktopVisible('/release-notes') && (
                  <NavLink to="/release-notes" className={`nav-link ${location.pathname === '/release-notes' ? 'active' : ''}`} style={{ fontSize: '13px', padding: '10px 24px' }}>
                    <BellDot size={16} />
                    <span>Güncelleme Notları</span>
                  </NavLink>
                )}
                {isDesktopVisible('/settings') && (
                  <NavLink to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`} style={{ fontSize: '13px', padding: '10px 24px' }}>
                    <SlidersHorizontal size={16} />
                    <span>CRM Ayarları</span>
                  </NavLink>
                )}
              </div>
            )}

            {/* Yeni Sistem Menüsü */}
            <div 
              className={`nav-link`} 
              style={{ cursor: 'pointer', justifyContent: 'space-between' }} 
              onClick={() => setIsSystemOpen(!isSystemOpen)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield size={20} />
                <span>Sistem</span>
              </div>
              {isSystemOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {isSystemOpen && (
              <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <NavLink to="/system/permissions" className="nav-link sub-nav" style={{ fontSize: '13px', padding: '10px 24px' }}>
                  <Shield size={16} /> <span>Yetki</span>
                </NavLink>
                <NavLink to="/system/settings" className="nav-link sub-nav" style={{ fontSize: '13px', padding: '10px 24px' }}>
                  <Settings size={16} /> <span>Ayarlar</span>
                </NavLink>
                <NavLink to="/system/security" className="nav-link sub-nav" style={{ fontSize: '13px', padding: '10px 24px' }}>
                  <UserCheck size={16} /> <span>Güvenlik Ayarları</span>
                </NavLink>
                <NavLink to="/system/personnel" className="nav-link sub-nav" style={{ fontSize: '13px', padding: '10px 24px' }}>
                  <Users size={16} /> <span>Personel</span>
                </NavLink>
                <NavLink to="/system/commission" className="nav-link sub-nav" style={{ fontSize: '13px', padding: '10px 24px' }}>
                  <Star size={16} /> <span>Prim Ayarlamaları</span>
                </NavLink>
                <NavLink to="/system/integrations" className="nav-link sub-nav" style={{ fontSize: '13px', padding: '10px 24px' }}>
                  <Zap size={16} /> <span>Entegrasyonlar</span>
                </NavLink>
                <NavLink to="/system/api" className="nav-link sub-nav" style={{ fontSize: '13px', padding: '10px 24px' }}>
                  <Code size={16} /> <span>Api Yönetimi</span>
                </NavLink>
                <NavLink to="/system/services" className="nav-link sub-nav" style={{ fontSize: '13px', padding: '10px 24px' }}>
                  <Syringe size={16} /> <span>Hizmet</span>
                </NavLink>
                <NavLink to="/system/packages" className="nav-link sub-nav" style={{ fontSize: '13px', padding: '10px 24px' }}>
                  <Package size={16} /> <span>Paket</span>
                </NavLink>
                <NavLink to="/system/products" className="nav-link sub-nav" style={{ fontSize: '13px', padding: '10px 24px' }}>
                  <Tag size={16} /> <span>Ürün</span>
                </NavLink>
                <NavLink to="/system/definitions" className="nav-link sub-nav" style={{ fontSize: '13px', padding: '10px 24px' }}>
                  <Boxes size={16} /> <span>Tanımlamalar</span>
                </NavLink>
                <NavLink to="/system/sms-approvals" className="nav-link sub-nav" style={{ fontSize: '13px', padding: '10px 24px' }}>
                  <MessageSquare size={16} /> <span>Toplu Sms Gönderim Onayları</span>
                </NavLink>
              </div>
            )}
          </>
        )}
      </div>

    </aside>
  );
};

export default Sidebar;
