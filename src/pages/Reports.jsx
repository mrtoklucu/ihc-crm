import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  BarChart3, PieChart, TrendingUp, DollarSign, Users, Calendar, 
  Settings, Mail, FileText, ChevronRight, Star, 
  CreditCard, Activity, Package, ShieldCheck, 
  UserCheck, MapPin, Bed, ClipboardList, Facebook
} from 'lucide-react';

const Reports = () => {
  const { checkPermission } = useContext(AppContext);

  if (!checkPermission('viewDashboard')) {
    return (
      <div className="card">
        <p>Bu sayfayı görüntülemek için yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  const reportGroups = [
    {
      title: 'Sık Kullanılanlar',
      color: '#fff9db',
      icon: <Star size={20} color="#fab005" fill="#fab005" />,
      items: [
        { name: 'Danışan Dağılımı Raporu', icon: <PieChart size={16} /> },
        { name: 'Çapraz Satış Raporu', icon: <TrendingUp size={16} /> },
        { name: 'Satış Raporu', icon: <DollarSign size={16} /> },
        { name: 'Tahsilat Raporu', icon: <CreditCard size={16} /> },
        { name: 'Satış Fiyat Analizi', icon: <BarChart3 size={16} /> },
      ]
    },
    {
      title: 'Finansal Raporlar',
      items: [
        { name: 'Satış Raporu', icon: <DollarSign size={16} /> },
        { name: 'Hizmet Satış Adetleri', icon: <Activity size={16} /> },
        { name: 'Ürün Satış Adetleri', icon: <Package size={16} /> },
        { name: 'Paket Satış Adetleri', icon: <Package size={16} /> },
        { name: 'Tahsilat Raporu', icon: <CreditCard size={16} /> },
        { name: 'Çapraz Satış Raporu', icon: <TrendingUp size={16} /> },
        { name: 'Satış Fiyat Analizi', icon: <BarChart3 size={16} /> },
        { name: 'Prim Raporu', icon: <Star size={16} /> },
        { name: 'Kapora Raporu', icon: <CreditCard size={16} /> },
        { name: 'Teklif Raporu', icon: <FileText size={16} /> },
      ]
    },
    {
      title: 'Danışan Raporları',
      items: [
        { name: 'Danışan Dağılımı Raporu', icon: <PieChart size={16} /> },
        { name: 'Danışan Performans Raporu', icon: <Users size={16} /> },
        { name: 'Referans Kaynağı Performans Raporu', icon: <TrendingUp size={16} /> },
        { name: 'Referans Getiren Kişi Performansı Raporu', icon: <Users size={16} /> },
        { name: 'Puan Raporu', icon: <Star size={16} /> },
        { name: 'Gelmeyen Danışanlar Raporu', icon: <Calendar size={16} /> },
        { name: 'Transfer Raporu', icon: <MapPin size={16} /> },
        { name: 'Konaklama Raporu', icon: <Bed size={16} /> },
        { name: 'Obezite İzlem Raporu', icon: <Activity size={16} /> },
      ]
    },
    {
      title: 'Randevu Raporları',
      items: [
        { name: 'Yardımcı Personel Görev Raporu', icon: <Users size={16} /> },
      ]
    },
    {
      title: 'Sistem Raporları',
      items: [
        { name: 'TTB İşlem Raporu', icon: <Settings size={16} /> },
        { name: 'Paket Takip Raporu', icon: <ClipboardList size={16} /> },
        { name: 'Stok Raporu', icon: <Package size={16} /> },
        { name: 'Kapsamlı Güvenlik Raporu', icon: <ShieldCheck size={16} /> },
        { name: 'Trend Raporu', icon: <BarChart3 size={16} /> },
      ]
    },
    {
      title: 'Form & Anket Raporları',
      items: [
        { name: 'Doldurulan Form & Anket', icon: <FileText size={16} /> },
        { name: 'Gönderilen Form & Anket', icon: <Mail size={16} /> },
        { name: 'Form & Anket Analiz', icon: <BarChart3 size={16} /> },
      ]
    },
    {
      title: 'Sms & E-Posta',
      items: [
        { name: 'Gönderilen Smsler', icon: <Mail size={16} /> },
        { name: 'Sms Listesinden Çıkanlar', icon: <Users size={16} /> },
      ]
    },
    {
      title: 'Crm',
      items: [
        { name: 'Crm-Trend', icon: <TrendingUp size={16} /> },
        { name: 'Güncel Temsilci-Segment Dağılımı', icon: <PieChart size={16} /> },
        { name: 'Temsilci - Segment Değerlendirmesi', icon: <BarChart3 size={16} /> },
        { name: 'Temsilci - Referans Kaynağı Değerlendirmesi', icon: <Users size={16} /> },
        { name: 'Facebook Reklam Analizi (Data)', icon: <Facebook size={16} /> },
        { name: 'Temsilci - Segment/Zaman Analizi', icon: <Calendar size={16} /> },
      ]
    }
  ];

  return (
    <div>
      <h1 className="page-title">Raporlar</h1>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px' 
      }}>
        {reportGroups.map((group, index) => (
          <div key={index} className="card" style={{ 
            backgroundColor: group.color || 'var(--bg-secondary)',
            borderColor: group.color ? 'rgba(250, 176, 5, 0.2)' : 'var(--border-color)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: group.color ? '0 4px 12px rgba(250, 176, 5, 0.1)' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '10px' }}>
              {group.icon || <BarChart3 size={18} color="var(--accent-color)" />}
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: group.color ? '#856404' : '#fff', opacity: 0.9 }}>{group.title}</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {group.items.map((item, i) => (
                <div 
                  key={i} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '8px 0', 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderBottom: i === group.items.length - 1 ? 'none' : '1px dotted rgba(0,0,0,0.1)',
                    color: group.color ? '#555' : 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: group.color ? '#fab005' : 'var(--accent-color)', display: 'flex' }}>{item.icon}</span>
                    <span style={{ fontSize: '13px' }}>{item.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
