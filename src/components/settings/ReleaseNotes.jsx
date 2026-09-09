import React from 'react';
import { Sparkles, BellRing, Info, ShieldCheck, Activity, Trash2, Calendar, Globe } from 'lucide-react';

const ReleaseNotes = () => {
  const updates = [
    {
      version: '1.2.5',
      date: '24 Mart 2026',
      title: 'Performans ve Güvenlik Güncellemesi',
      items: [
        { icon: <Activity size={16} />, text: 'Temsilci Lead Yanıt Süresi Analizi eklendi (Dashboard en üstte).', type: 'feature' },
        { icon: <Trash2 size={16} />, text: 'Admin ve Genel Koordinatörler için Lead silme yetkisi eklendi.', type: 'permission' },
        { icon: <Sparkles size={16} />, text: 'Lead detay sayfasında temsilciyi yeniden atama özelliği eklendi.', type: 'feature' },
        { icon: <Calendar size={16} />, text: 'Analiz paneli varsayılan tarih filtresi "1 Ay" olarak ayarlandı.', type: 'ux' },
        { icon: <BellRing size={16} />, text: 'Sağ üst köşeye sistem bildirim merkezi eklendi.', type: 'feature' }
      ]
    },
    {
      version: '1.2.4',
      date: '23 Mart 2026',
      title: 'Çoklu Dil ve Teklif Formu Geliştirmeleri',
      items: [
        { icon: <Globe size={16} />, text: 'Teklif formlarına 7 farklı dil desteği (TR, EN, DE, RU, FR, ES, AR) eklendi.', type: 'feature' },
        { icon: <Activity size={16} />, text: 'Arapça için RTL (Sağdan Sola) okuma ve tasarım desteği getirildi.', type: 'ux' },
        { icon: <ShieldCheck size={16} />, text: 'Teklif formları 4 ana kategoriye ayrıldı: Saç, Diş, Estetik, Göz.', type: 'feature' }
      ]
    },
    {
      version: '1.2.3',
      date: '19 Mart 2026',
      title: 'Destek ve Dosya Yönetimi',
      items: [
        { icon: <Info size={16} />, text: 'Destek taleplerine dosya ve görsel yükleme özelliği eklendi.', type: 'feature' },
        { icon: <ShieldCheck size={16} />, text: 'Dosya güvenliği ve tenant bazlı depolama izolasyonu artırıldı.', type: 'security' }
      ]
    }
  ];

  return (
    <div className="card" style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Güncelleme Notları</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '32px' }}>
        IHC CRM sistemindeki en son iyileştirmeleri, yeni özellikleri ve hata düzeltmelerini buradan takip edebilirsiniz.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {updates.map((update, idx) => (
          <div key={idx} style={{ position: 'relative', paddingLeft: '32px', borderLeft: '2px solid rgba(99, 102, 241, 0.2)' }}>
            {/* Timeline Dot */}
            <div style={{ 
              position: 'absolute', left: '-9px', top: '0', width: '16px', height: '16px', 
              borderRadius: '50%', background: 'var(--accent-color)', border: '4px solid var(--bg-secondary)' 
            }}></div>
            
            <div style={{ marginBottom: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                 <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                   v{update.version}
                 </span>
                 <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{update.date}</span>
               </div>
               <h3 style={{ fontSize: '17px', margin: 0 }}>{update.title}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {update.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                   <div style={{ 
                     marginTop: '2px', color: 'var(--accent-color)', opacity: 0.8, 
                     backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px' 
                   }}>
                     {item.icon}
                   </div>
                   <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', marginTop: '4px' }}>
                     {item.text}
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

export default ReleaseNotes;
