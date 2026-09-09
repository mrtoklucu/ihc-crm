import React from 'react';
import { useParams } from 'react-router-dom';
import { 
  Shield, 
  Settings as SettingsIcon, 
  UserCheck, 
  Users, 
  Star, 
  Zap, 
  Code, 
  Syringe, 
  Package, 
  Tag, 
  Boxes, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';

const System = () => {
  const { subpage } = useParams();

  // Subpage titles map
  const subpageTitles = {
    'permissions': 'Yetki Yönetimi',
    'settings': 'Genel Ayarlar',
    'security': 'Güvenlik Ayarları',
    'personnel': 'Personel Yönetimi',
    'commission': 'Prim Ayarlamaları',
    'integrations': 'Entegrasyon Yönetimi',
    'api': 'API Yönetimi',
    'services': 'Hizmet Tanımları',
    'packages': 'Paket Yönetimi',
    'products': 'Ürün Katalogu',
    'definitions': 'Sistem Tanımlamaları',
    'sms-approvals': 'Toplu SMS Onayları'
  };

  const renderContent = () => {
    switch (subpage) {
      case 'permissions': return <Placeholder icon={<Shield size={48} />} title="Yetki" />;
      case 'settings': return <Placeholder icon={<SettingsIcon size={48} />} title="Ayarlar" />;
      case 'security': return <Placeholder icon={<UserCheck size={48} />} title="Güvenlik Ayarları" />;
      case 'personnel': return <Placeholder icon={<Users size={48} />} title="Personel" />;
      case 'commission': return <Placeholder icon={<Star size={48} />} title="Prim Ayarlamaları" />;
      case 'integrations': return <Placeholder icon={<Zap size={48} />} title="Entegrasyonlar" />;
      case 'api': return <Placeholder icon={<Code size={48} />} title="Api Yönetimi" />;
      case 'services': return <Placeholder icon={<Syringe size={48} />} title="Hizmet" />;
      case 'packages': return <Placeholder icon={<Package size={48} />} title="Paket" />;
      case 'products': return <Placeholder icon={<Tag size={48} />} title="Ürün" />;
      case 'definitions': return <Placeholder icon={<Boxes size={48} />} title="Tanımlamalar" />;
      case 'sms-approvals': return <Placeholder icon={<MessageSquare size={48} />} title="Toplu Sms Gönderim Onayları" />;
      default:
        return (
          <div className="finance-placeholder-card">
            <AlertCircle size={48} className="placeholder-icon" />
            <h3>Bölüm Seçiniz</h3>
            <p>Lütfen sol menüden bir sistem kategorisi seçiniz.</p>
          </div>
        );
    }
  };

  return (
    <div className="finance-page">
      <div className="page-header">
        <div className="header-info">
          <h1>Sistem Yönetimi</h1>
          <p>{subpageTitles[subpage] || 'Konfigürasyon ve Ayarlar'}</p>
        </div>
      </div>

      <div className="finance-content-grid" style={{ marginTop: '24px', display: 'grid', gap: '24px' }}>
        {renderContent()}
      </div>
    </div>
  );
};

const Placeholder = ({ icon, title }) => (
  <div className="finance-placeholder-card">
    <div className="placeholder-icon">{icon}</div>
    <h3>{title}</h3>
    <p>Bu modül şu anda yapılandırma aşamasındadır. Yakında aktif olacaktır.</p>
  </div>
);

export default System;
