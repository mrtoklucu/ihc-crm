/**
 * Lead durumlari ve kategorileri.
 *
 * Durumlar uc kategoriye ayrilir: olumlu (yesil), notr (sari), olumsuz
 * (kirmizi). Asagidaki eslesme yalnizca varsayilandir; her firma kendi
 * calisma seklinie gore Ayarlar sayfasindan degistirebilir ve secim
 * tenants/<slug>.statusCategories alaninda saklanir.
 */

export const LEAD_STATUSES = [
  "Aranmayı Bekliyor", "Aradım, Açmadı", "Aramayı Reddeti", "Başka Bir Klinikle Anlaşmış",
  "Lokasyon Olumsuz", "Randevu Oluşturuldu", "İletişim Eksik", "Destek Tedavisine Uygun",
  "Dil Sorunu", "Engelledi/Engelledim", "Fiyatı Pahalı Buldu", "Fotoğraf Alındı, Teklif Verildi",
  "Fotoğraf Bekleniyor", "İletişim Kurulamıyor", "İleri Tarihte Düşünüyor", "İletişimdeyim",
  "İletişime Geçiyorum", "İlgisiz", "Randevu İptal Edildi", "Kaporalı Randevu Oluşturuldu",
  "Mesaj Attım, Bekleniyor", "Operasyona Girdi", "Operasyona Uygun Değil", "Saç Ekimi Düşünmüyor",
  "Sadece Fiyat Sordu", "Teklif Verildi, Kararsız", "Teklif Verildi, Olumlu", "Teklife Dönüş Yapmadı",
  "Telesekretere Bağlanıyor", "Yanlış Başvuru", "Yanlış Numara", "Yüzyüze Görüşme", "Tekrar Gelen Lead"
];

export const STATUS_CATEGORIES = {
  positive: { key: 'positive', label: 'Olumlu', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.12)' },
  neutral: { key: 'neutral', label: 'Nötr', color: 'var(--accent-color)', background: 'rgba(212, 175, 55, 0.12)' },
  negative: { key: 'negative', label: 'Olumsuz', color: 'var(--error)', background: 'rgba(239, 68, 68, 0.12)' },
};

/** Satisa dogru ilerleyen durumlar. */
const DEFAULT_POSITIVE = [
  "Randevu Oluşturuldu",
  "Kaporalı Randevu Oluşturuldu",
  "Operasyona Girdi",
  "Teklif Verildi, Olumlu",
  "Fotoğraf Alındı, Teklif Verildi",
  "Destek Tedavisine Uygun",
  "Yüzyüze Görüşme",
  "İletişimdeyim",
  "İletişime Geçiyorum",
  "Tekrar Gelen Lead",
];

/** Kapanmis, donusme ihtimali kalmamis durumlar. */
const DEFAULT_NEGATIVE = [
  "Aramayı Reddeti",
  "Başka Bir Klinikle Anlaşmış",
  "Engelledi/Engelledim",
  "İlgisiz",
  "Randevu İptal Edildi",
  "Saç Ekimi Düşünmüyor",
  "Yanlış Başvuru",
  "Yanlış Numara",
  "Operasyona Uygun Değil",
  "Lokasyon Olumsuz",
  "Dil Sorunu",
  "İletişim Kurulamıyor",
  "Teklife Dönüş Yapmadı",
  "Fiyatı Pahalı Buldu",
];

/** Varsayilan eslesme: listede olmayan her durum notr sayilir. */
export const DEFAULT_STATUS_CATEGORIES = LEAD_STATUSES.reduce((acc, status) => {
  if (DEFAULT_POSITIVE.includes(status)) acc[status] = 'positive';
  else if (DEFAULT_NEGATIVE.includes(status)) acc[status] = 'negative';
  else acc[status] = 'neutral';
  return acc;
}, {});

/**
 * Bir durumun kategorisini dondurur.
 * Firma ayari varsa o, yoksa varsayilan, o da yoksa notr.
 */
export const getStatusCategory = (status, overrides) => {
  if (!status) return 'neutral';
  const configured = overrides && overrides[status];
  if (configured && STATUS_CATEGORIES[configured]) return configured;
  return DEFAULT_STATUS_CATEGORIES[status] || 'neutral';
};

/** Rozet icin hazir stil nesnesi. */
export const getStatusStyle = (status, overrides) => {
  const category = STATUS_CATEGORIES[getStatusCategory(status, overrides)];
  return { background: category.background, color: category.color };
};
