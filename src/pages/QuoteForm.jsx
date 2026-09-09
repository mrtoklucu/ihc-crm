import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Download, Scissors, CheckCircle2, ImageIcon, ArrowLeft, Eye, Smile, Sparkles, ChevronRight, Globe, Loader2 } from 'lucide-react';
import logoImg from '../assets/ihc_logo.webp';
import { downloadQuotePdf } from '../utils/quotePdf';

const QuoteForm = () => {
  const [selectedType, setSelectedType] = useState(null);

  const categories = [
    { id: 'hair', title: 'Saç Ekimi Formu', icon: <Scissors size={32}/>, color: '#0b4f6c', desc: 'FUE, DHI ve Safir teknikleri' },
    { id: 'dental', title: 'Diş Tedavileri Formu', icon: <Smile size={32}/>, color: '#10b981', desc: 'İmplant, Kaplamalar ve Gülüş Tasarımı' },
    { id: 'aesthetic', title: 'Estetik Cerrahi Formu', icon: <Sparkles size={32}/>, color: '#8b5cf6', desc: 'Rinoplasti, Liposuction ve Meme Cerrahisi' },
    { id: 'eye', title: 'Göz Tedavileri Formu', icon: <Eye size={32}/>, color: '#ef4444', desc: 'LASIK, Cataract ve Akıllı Lens' }
  ];

  if (!selectedType) {
    return (
      <div className="quote-selection-page">
        <div className="selection-header">
          <h2>Tedavi Kategorisi Seçin</h2>
          <p>Müşteriniz için özel bir teklif oluşturmak üzere bir kategori seçin.</p>
        </div>
        <div className="category-grid">
          {categories.map(cat => (
            <div key={cat.id} className="category-card" onClick={() => setSelectedType(cat.id)}>
              <div className="cat-icon" style={{ backgroundColor: cat.color }}>{cat.icon}</div>
              <div className="cat-info">
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
              </div>
              <ChevronRight className="cat-arrow" />
            </div>
          ))}
        </div>

        <style>{`
          .quote-selection-page { max-width: 1000px; margin: 60px auto; padding: 0 40px; }
          .selection-header { margin-bottom: 48px; text-align: center; }
          .selection-header h2 { font-size: 32px; font-weight: 800; color: white; margin-bottom: 12px; }
          .selection-header p { color: var(--text-secondary); font-size: 16px; }
          .category-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .category-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 20px; padding: 24px; display: flex; align-items: center; gap: 20px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; }
          .category-card:hover { transform: translateY(-5px); border-color: var(--accent-color); box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
          .cat-icon { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; }
          .cat-info h3 { font-size: 18px; font-weight: 700; color: white; margin-bottom: 4px; }
          .cat-info p { font-size: 14px; color: var(--text-secondary); }
          .cat-arrow { color: var(--text-secondary); margin-left: auto; transition: transform 0.3s; }
          .category-card:hover .cat-arrow { transform: translateX(5px); color: var(--accent-color); }
          @media (max-width: 768px) { .category-grid { grid-template-columns: 1fr; } }
        `}</style>
      </div>
    );
  }

  return <QuoteFormBuilder type={selectedType} onBack={() => setSelectedType(null)} />;
};

const QuoteFormBuilder = ({ type, onBack }) => {
  const { tenantConfig } = useContext(AppContext);
  const [formLang, setFormLang] = useState('en');

  const serviceStrings = {
    tr: {
      'Washing & Dressing': 'Yıkama ve Pansuman', 'Certificate': 'Sertifika', 'Online Support': 'Online Destek', 'VIP Consultant': 'VIP Danışman', 'Blood Test': 'Kan Testi',
      'PRP': 'PRP Tedavisi', 'VIP Transfer': 'VIP Transfer', 'Guesthouse': 'Pansiyon', '3-star Hotel': '3 Yıldızlı Otel', '4-star Hotel': '4 Yıldızlı Otel',
      '5-star Hotel': '5 Yıldızlı Otel', 'Hair Care Set (6 months)': 'Saç Bakım Seti (6 Aylık)', 'Shampoo': 'Şampuan', 'Medication': 'İlaçlar',
      'Panoramic X-ray': 'Panoramik Röntgen', 'Digital Smile Design': 'Dijital Gülüş Tasarımı', 'Professional Cleaning': 'Profesyonel Diş Temizliği',
      'Translator': 'Tercüman', 'Lifetime Warranty Card': 'Ömür Boyu Garanti Kartı', 'Online Follow-up': 'Online Takip',
      'Hospital Stay (1 Night)': 'Hastanede Konaklama (1 Gece)', 'Post-Op Garment': 'Korse / Medikal Giysi', 'Medical Creams': 'Medikal Kremler',
      'Nurse Care': 'Hemşire Bakımı', 'Lymphatic Drainage': 'Lenf Drenajı', 'Protective Glasses': 'Koruyucu Gözlük', 'Eye Drops Set': 'Göz Damlası Seti',
      'Detailed Eye Exam': 'Detaylı Göz Muayenesi'
    },
    en: {
      'Washing & Dressing': 'Washing & Dressing', 'Certificate': 'Certificate', 'Online Support': 'Online Support', 'VIP Consultant': 'VIP Consultant', 'Blood Test': 'Blood Test',
      'PRP': 'PRP', 'VIP Transfer': 'VIP Transfer', 'Guesthouse': 'Guesthouse', '3-star Hotel': '3-star Hotel', '4-star Hotel': '4-star Hotel',
      '5-star Hotel': '5-star Hotel', 'Hair Care Set (6 months)': 'Hair Care Set (6 months)', 'Shampoo': 'Shampoo', 'Medication': 'Medication',
      'Panoramic X-ray': 'Panoramic X-ray', 'Digital Smile Design': 'Digital Smile Design', 'Professional Cleaning': 'Professional Cleaning',
      'Translator': 'Translator', 'Lifetime Warranty Card': 'Lifetime Warranty Card', 'Online Follow-up': 'Online Follow-up',
      'Hospital Stay (1 Night)': 'Hospital Stay (1 Night)', 'Post-Op Garment': 'Post-Op Garment', 'Medical Creams': 'Medical Creams',
      'Nurse Care': 'Nurse Care', 'Lymphatic Drainage': 'Lymphatic Drainage', 'Protective Glasses': 'Protective Glasses', 'Eye Drops Set': 'Eye Drops Set',
      'Detailed Eye Exam': 'Detailed Eye Exam'
    },
    de: {
      'Washing & Dressing': 'Waschen & Verband', 'Certificate': 'Zertifikat', 'Online Support': 'Online-Unterstützung', 'VIP Consultant': 'VIP-Berater', 'Blood Test': 'Bluttest',
      'PRP': 'PRP', 'VIP Transfer': 'VIP-Transfer', 'Guesthouse': 'Pension', '3-star Hotel': '3-Sterne Hotel', '4-star Hotel': '4-Sterne Hotel',
      '5-star Hotel': '5-Sterne Hotel', 'Hair Care Set (6 months)': 'Haarpflegeset (6 Monate)', 'Shampoo': 'Shampoo', 'Medication': 'Medikamente',
      'Panoramic X-ray': 'Panorama-Röntgenaufnahme', 'Digital Smile Design': 'Digitales Smile-Design', 'Professional Cleaning': 'Professionelle Reinigung',
      'Translator': 'Übersetzer', 'Lifetime Warranty Card': 'Lebenslange Garantiekarte', 'Online Follow-up': 'Online-Nachsorge',
      'Hospital Stay (1 Night)': 'Krankenhausaufenthalt (1 Nacht)', 'Post-Op Garment': 'Mieder / Kompressionsbekleidung', 'Medical Creams': 'Medizinische Cremes',
      'Nurse Care': 'Krankenpflege', 'Lymphatic Drainage': 'Lymphdrainage', 'Protective Glasses': 'Schutzbrille', 'Eye Drops Set': 'Augentropfen-Set',
      'Detailed Eye Exam': 'Detaillierte Augenuntersuchung'
    },
    ru: {
      'Washing & Dressing': 'Мытье и перевязка', 'Certificate': 'Сертификат', 'Online Support': 'Онлайн поддержка', 'VIP Consultant': 'VIP консультант', 'Blood Test': 'Анализ крови',
      'PRP': 'PRP терапия', 'VIP Transfer': 'VIP трансфер', 'Guesthouse': 'Пансионат', '3-star Hotel': 'Отель 3 звезды', '4-star Hotel': 'Отель 4 звезды',
      '5-star Hotel': 'Отель 5 звезд', 'Hair Care Set (6 months)': 'Набор для ухода (6 мес)', 'Shampoo': 'Шампунь', 'Medication': 'Медикаменты',
      'Panoramic X-ray': 'Панорамный рентген', 'Digital Smile Design': 'Цифровой дизайн улыбки', 'Professional Cleaning': 'Профессиональная чистка',
      'Translator': 'Переводчик', 'Lifetime Warranty Card': 'Пожизненная гарантия', 'Online Follow-up': 'Дистанционное наблюдение',
      'Hospital Stay (1 Night)': 'Пребывание в больнице (1 ночь)', 'Post-Op Garment': 'Компрессионное белье', 'Medical Creams': 'Медицинские крема',
      'Nurse Care': 'Сестринский уход', 'Lymphatic Drainage': 'Лимфодренаж', 'Protective Glasses': 'Защитные очки', 'Eye Drops Set': 'Набор глазных капель',
      'Detailed Eye Exam': 'Подробный осмотр глаз'
    },
    fr: {
      'Washing & Dressing': 'Lavage et bandage', 'Certificate': 'Certificat', 'Online Support': 'Assistance en ligne', 'VIP Consultant': 'Consultant VIP', 'Blood Test': 'Analyse de sang',
      'PRP': 'PRP', 'VIP Transfer': 'Transfert VIP', 'Guesthouse': 'Maison d\'hôtes', '3-star Hotel': 'Hôtel 3 étoiles', '4-star Hotel': 'Hôtel 4 étoiles',
      '5-star Hotel': 'Hôtel 5 étoiles', 'Hair Care Set (6 months)': 'Set de soins (6 mois)', 'Shampoo': 'Shampooing', 'Medication': 'Médicaments',
      'Panoramic X-ray': 'Radiographie panoramique', 'Digital Smile Design': 'Conception numérique du sourire', 'Professional Cleaning': 'Nettoyage professionnel',
      'Translator': 'Traducteur', 'Lifetime Warranty Card': 'Carte de garantie à vie', 'Online Follow-up': 'Suivi en ligne',
      'Hospital Stay (1 Night)': 'Séjour hospitalier (1 nuit)', 'Post-Op Garment': 'Gaine post-opératoire', 'Medical Creams': 'Crèmes médicales',
      'Nurse Care': 'Soins infirmiers', 'Lymphatic Drainage': 'Drainage lymphatique', 'Protective Glasses': 'Lunettes de protection', 'Eye Drops Set': 'Kit de gouttes oculaires',
      'Detailed Eye Exam': 'Examen ophtalmologique détaillé'
    },
    es: {
      'Washing & Dressing': 'Lavado y vendaje', 'Certificate': 'Certificado', 'Online Support': 'Soporte en línea', 'VIP Consultant': 'Consultor VIP', 'Blood Test': 'Análisis de sangre',
      'PRP': 'PRP', 'VIP Transfer': 'Traslado VIP', 'Guesthouse': 'Pensión', '3-star Hotel': 'Hotel 3 estrellas', '4-star Hotel': 'Hotel 4 estrellas',
      '5-star Hotel': 'Hotel 5 estrellas', 'Hair Care Set (6 months)': 'Kit de cuidado (6 meses)', 'Shampoo': 'Champú', 'Medication': 'Medicamentos',
      'Panoramic X-ray': 'Radiografía panorámica', 'Digital Smile Design': 'Diseño digital de sonrisa', 'Professional Cleaning': 'Limpieza profesional',
      'Translator': 'Traductor', 'Lifetime Warranty Card': 'Tarjeta de garantía', 'Online Follow-up': 'Seguimiento',
      'Hospital Stay (1 Night)': 'Estancia (1 noche)', 'Post-Op Garment': 'Prenda postoperatoria', 'Medical Creams': 'Cremas médicas',
      'Nurse Care': 'Enfermería', 'Lymphatic Drainage': 'Drenaje linfático', 'Protective Glasses': 'Gafas protectoras', 'Eye Drops Set': 'Kit de gotas',
      'Detailed Eye Exam': 'Examen ocular'
    },
    ar: {
      'Washing & Dressing': 'الغسيل والضمادات', 'Certificate': 'شهادة', 'Online Support': 'دعم عبر الإنترنت', 'VIP Consultant': 'مستشار VIP', 'Blood Test': 'تحليل الدم',
      'PRP': 'علاج PRP', 'VIP Transfer': 'نقل VIP', 'Guesthouse': 'بيت ضيافة', '3-star Hotel': 'فندق 3 نجوم', '4-star Hotel': 'فندق 4 نجوم',
      '5-star Hotel': 'فندق 5 نجوم', 'Hair Care Set (6 months)': 'مجموعة العناية (6 أشهر)', 'Shampoo': 'شامبو', 'Medication': 'الأدوية',
      'Panoramic X-ray': 'أشعة بانورامية', 'Digital Smile Design': 'تصميم الابتسامة الرقمي', 'Professional Cleaning': 'تنظيف مهني',
      'Translator': 'مترجم', 'Lifetime Warranty Card': 'بطاقة ضمان مدى الحياة', 'Online Follow-up': 'متابعة عبر الإنترنت',
      'Hospital Stay (1 Night)': 'إقامة في المستشفى (ليلة واحدة)', 'Post-Op Garment': 'مشد طبي', 'Medical Creams': 'كريمات طبية',
      'Nurse Care': 'رعاية تمريضية', 'Lymphatic Drainage': 'تصريف لمفاوي', 'Protective Glasses': 'نظارات واقية', 'Eye Drops Set': 'مجموعة قطرات العين',
      'Detailed Eye Exam': 'فحص عين مفصل'
    }
  };

  const translations = {
    tr: {
      head: 'Bilgi Formu', info: 'Danışan Bilgileri', oper: 'Operasyon Detayları', photo: 'Fotoğraflar', serv: 'Hizmetler', other: 'Diğer Bilgiler',
      date: 'Tarih', opDate: 'Operasyon Tarihi', opTime: 'Operasyon Saati', gen: 'Cinsiyet', name: 'Ad Soyad', age: 'Yaş', phone: 'Telefon', email: 'E-posta',
      meth: 'Yöntem', graft: 'Tahmini Greft', sess: 'Seans', price: 'Fiyat',
      disc: 'Bu rapor, adına düzenlendiği kişiye aittir. Üçüncü şahıslara devredilemez ve üçüncü şahıslar tarafından kullanılamaz.',
      valid: 'Bu teklif hazırlandığı tarihten itibaren 15 gün süreyle geçerlidir.',
      male: 'Erkek', female: 'Kadın', upload: 'Yükle', back: 'Geri Dön', editor: 'Editörü'
    },
    en: {
      head: 'Information Form', info: 'Applicant Information', oper: 'Operation Details', photo: 'Photos', serv: 'Services', other: 'Other informations',
      date: 'Date', opDate: 'Operation Date', opTime: 'Operation Time', gen: 'Gender', name: 'Full Name', age: 'Age', phone: 'Phone', email: 'Email',
      meth: 'Method', graft: 'Total Grafts', sess: 'Session', price: 'Price',
      disc: 'This report belongs to the person on whose behalf it was issued. It cannot be transferred to third parties and cannot be used by third parties.',
      valid: 'This offer is valid for 15 days from the date of preparation.',
      male: 'Male', female: 'Female', upload: 'Upload', back: 'Back', editor: 'Editor'
    },
    de: {
      head: 'Informationsformular', info: 'Bewerberinformationen', oper: 'Operationsdetails', photo: 'Fotos', serv: 'Dienstleistungen', other: 'Weitere Informationen',
      date: 'Datum', opDate: 'Operationsdatum', opTime: 'Operationszeit', gen: 'Geschlecht', name: 'Vollständiger Name', age: 'Alter', phone: 'Telefon', email: 'E-Mail',
      meth: 'Methode', graft: 'Total Transplantate', sess: 'Sitzung', price: 'Preis',
      disc: 'Dieser Bericht gehört der Person, in deren Namen er erstellt wurde. Er kann nicht an Dritte übertragen und nicht von Dritten verwendet werden.',
      valid: 'Dieses Angebot ist ab dem Erstellungsdatum 15 Tage gültig.',
      male: 'Männlich', female: 'Weiblich', upload: 'Hochladen', back: 'Zurück', editor: 'Editor'
    },
    es: {
      head: 'Formulario de Información', info: 'Información del Solicitante', oper: 'Detalles de la Operación', photo: 'Fotos', serv: 'Servicios', other: 'Otras informaciones',
      date: 'Fecha', opDate: 'Fecha de operación', opTime: 'Hora de operación', gen: 'Género', name: 'Nombre Completo', age: 'Edad', phone: 'Teléfono', email: 'Email',
      meth: 'Método', graft: 'Graft Totales', sess: 'Sesión', price: 'Precio',
      disc: 'Este informe pertenece a la persona a cuyo nombre fue emitido. No puede ser transferido a terceros ni utilizado por terceros.',
      valid: 'Esta oferta es válida por 15 días a partir de la fecha de preparación.',
      male: 'Masculino', female: 'Femenino', upload: 'Subir', back: 'Volver', editor: 'Editor'
    },
    fr: {
      head: 'Formulaire d\'information', info: 'Informations sur le demandeur', oper: 'Détails de l\'opération', photo: 'Photos', serv: 'Services', other: 'Autres informations',
      date: 'Date', opDate: 'Date de l\'opération', opTime: 'Heure de l\'opération', gen: 'Genre', name: 'Nom complet', age: 'Âge', phone: 'Téléphone', email: 'Email',
      meth: 'Methode', graft: 'Greffons totaux', sess: 'Session', price: 'Prix',
      disc: 'Ce rapport appartient à la personne au nom de laquelle il a été émis. Il ne peut être transféré à des tiers et ne peut être utilisé par des tiers.',
      valid: 'Cette offre est valable 15 jours à compter de la date de préparation.',
      male: 'Homme', female: 'Femme', upload: 'Charger', back: 'Retour', editor: 'Éditeur'
    },
    ru: {
      head: 'Информационная форма', info: 'Информация о заявителе', oper: 'Детали операции', photo: 'Фотографии', serv: 'Услуги', other: 'Другая информация',
      date: 'Дата', opDate: 'Дата операции', opTime: 'Время операции', gen: 'Пол', name: 'Полное имя', age: 'Возраст', phone: 'Телефон', email: 'Email',
      meth: 'Метод', graft: 'Всего графтов', sess: 'Сеанс', price: 'Цена',
      disc: 'Этот отчет принадлежит лицу, на имя которого он был выдан. Он не может быть передан третьим лицам и не может использоваться третьими лицами.',
      valid: 'Это предложение действительно в течение 15 дней с даты подготовки.',
      male: 'Мужской', female: 'Женский', upload: 'Загрузить', back: 'Назад', editor: 'Редактор'
    },
    ar: {
      head: 'نموذج معلومات', info: 'معلومات مقدم الطلب', oper: 'تفاصيل العملية', photo: 'الصور', serv: 'الخدمات', other: 'معلومات أخرى',
      date: 'التاريخ', opDate: 'تاريخ العملية', opTime: 'وقت العملية', gen: 'الجنس', name: 'الاسم الكامل', age: 'العمر', phone: 'الهاتف', email: 'البريد الإلكتروني',
      meth: 'الطريقة', graft: 'إجمالي البصيلات', sess: 'الجلسة', price: 'السعر',
      disc: 'هذا التقرير يخص الشخص الذي صدر باسمه. لا يمكن نقله إلى أطراف ثالثة ولا يمكن استخدامه من قبل أطراف ثالثة.',
      valid: 'هذا العرض صالح لمدة 15 يومًا من تاريخ الإعداد.',
      male: 'ذكر', female: 'أنثى', upload: 'تنزيل', back: 'رجوع', editor: 'محرر'
    }
  };

  const t = translations[formLang] || translations.en;

  const getInitialData = (lang) => {
    const localeMap = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES', ru: 'ru-RU', ar: 'ar-SA' };
    const currT = translations[lang] || translations.en;

    const base = {
      date: new Date().toLocaleDateString(localeMap[lang] || 'en-US'),
      opDate: '',
      opTime: '',
      gender: currT.male,
      nameSurname: '', age: '', phone: '', email: '',
      notes: currT.valid,
      price: '2500', currency: 'EUR',
      disclaimer: currT.disc
    };

    if (type === 'hair') {
      return {
        ...base,
        badgeTitle: 'HAIR TRANSPLANT',
        method: 'Sapphire FUE', grafts: '3500 - 4500', session: '1',
        services: lang === 'tr' ? 'Saç ekimi operasyonu, uzman doktor gözetiminde Safir FUE tekniği kullanılarak gerçekleştirilecektir.\nAğrısız operasyon Lokal Anestezi altında yapılacaktır.\nOperasyon sırasında MAKSİMUM GRAFT yöntemi ile 3.500-4.500 greft ekilmesi beklenmektedir.\nOperasyon sonrası ilk gün pansuman, ikinci gün özel yıkama yapılacaktır.' : 'Hair transplantation will be performed under the supervision of a doctor using the Sapphire FUE technique.\nPainless operation will be performed under Local Anesthesia.\nDuring the operation, 3,500-4,500 grafts are expected to be planted using the MAXIMUM GRAFT method.\nDressing will take place on the first day after the operation, and special washing will be performed on the second day.',
        extras: ['Washing & Dressing', 'Certificate', 'Online Support', 'Blood Test'],
        extraList: ['Washing & Dressing', 'Certificate', 'Online Support', 'VIP Consultant', 'Blood Test', 'PRP', 'VIP Transfer', 'Guesthouse', '3-star Hotel', '4-star Hotel', '5-star Hotel', 'Hair Care Set (6 months)', 'Shampoo', 'Medication'],
        methods: ['Sapphire FUE', 'DHI', 'Classic FUE', 'Robotic Hair Transplant', 'FUT', 'DHI & FUE MIX']
      };
    }
    if (type === 'dental') {
      return {
        ...base,
        badgeTitle: 'DENTAL TREATMENT',
        method: 'Implants (Straumann)', grafts: 'Zirconium / E-max', session: '2 Visit Plan',
        services: lang === 'tr' ? 'Diş tedavisi profesyonel estetik diş hekimleri tarafından gerçekleştirilecektir.\nOperasyon yüksek kaliteli malzeme seçimini içerir.\nYüz yapınıza uygun Hollywood Gülüşü tasarımı uygulanacaktır.\nTüm ilaçlar ve geçici protezler dahildir.' : 'Dental treatment will be performed by professional cosmetic dentists.\nThe operation includes premium quality material selection.\nHollywood Smile design will be applied according to your facial structure.\nAll medications and temporary prosthetics are included.',
        extras: ['Panoramic X-ray', 'Digital Smile Design', 'VIP Transfer'],
        extraList: ['Panoramic X-ray', 'Digital Smile Design', 'Professional Cleaning', 'VIP Transfer', 'Translator', '4-star Hotel', '5-star Hotel', 'Medication Set', 'Lifetime Warranty Card', 'Online Follow-up'],
        methods: ['Dental Implants', 'Hollywood Smile', 'Zirconium Crowns', 'E-Max Veneers', 'Teeth Whitening', 'All-on-4 / All-on-6']
      };
    }
    if (type === 'aesthetic') {
      return {
        ...base,
        badgeTitle: 'AESTHETIC SURGERY',
        method: 'Rhinoplasty (Piezo)', grafts: 'General Anesthesia', session: '7 Days Stay',
        services: lang === 'tr' ? 'Estetik cerrahi JCI akredite bir hastanede gerçekleştirilecektir.\nGenel anestezi uzman anesteziyologlar tarafından uygulanacaktır.\nOperasyon sonrası dikişler ve ilk pansuman dahildir.\nCerrah ile takip randevuları garanti edilir.' : 'The aesthetic surgery will be performed in a JCI accredited hospital.\nGeneral anesthesia will be administered by expert anesthesiologists.\nPost-operative medical garment and first dressing are included.',
        extras: ['Hospital Stay (1 Night)', 'Post-Op Garment', 'VIP Transfer'],
        extraList: ['Hospital Stay (1 Night)', 'Post-Op Garment', 'Medical Creams', 'VIP Transfer', '4-star Hotel', '5-star Hotel', 'Nurse Care', 'Blood Test (Pre-Op)', 'Lymphatic Drainage', 'Medication'],
        methods: ['Rhinoplasty', 'Liposuction (Vaser)', 'Breast Augmentation', 'Tummy Tuck', 'Face Lift', 'BBL']
      };
    }
    return {
      ...base,
      badgeTitle: 'EYE TREATMENT',
      method: 'iLASIK', grafts: 'Both Eyes', session: '1 Day Plan',
      services: lang === 'tr' ? 'Göz tedavisi en son lazer teknolojisi kullanılarak gerçekleştirilecektir.\nİşlem her göz için yaklaşık 10-15 dakika sürer.\nGöz damlası ile lokal anestezi (ağrısız).\nErtesi gün kontrol zorunludur.' : 'The procedure takes approximately 10-15 minutes per eye.\nLocal anesthesia with eye drops (painless).\nNext day check-up is mandatory.',
      extras: ['Protective Glasses', 'Eye Drops Set', 'VIP Transfer'],
      extraList: ['Protective Glasses', 'Eye Drops Set', 'VIP Transfer', 'Translator', '4-star Hotel', '5-star Hotel', 'Post-Op Medicines', 'Online Support', 'Detailed Eye Exam'],
      methods: ['LASIK / iLASIK', 'Cataract Surgery', 'Trifocal Lens Implantation', 'Smile Laser']
    };
  };

  const [formData, setFormData] = useState(getInitialData('en'));
  const [photos, setPhotos] = useState([null, null, null, null]);

  // PDF indirme. Belge iki A4 sayfasindan olusuyor; uretim birkac saniye
  // surebildigi icin buton bu sirada kilitleniyor.
  const docRef = useRef(null);
  const [pdfState, setPdfState] = useState({ busy: false, error: null });

  const handleDownloadPdf = async () => {
    if (pdfState.busy) return;
    setPdfState({ busy: true, error: null });
    try {
      await downloadQuotePdf({
        element: docRef.current,
        fileName: formData.nameSurname
          ? `Teklif_${formData.nameSurname}`
          : 'Teklif',
      });
      setPdfState({ busy: false, error: null });
    } catch (err) {
      console.error('PDF olusturulamadi:', err);
      setPdfState({ busy: false, error: 'PDF olusturulamadi. Lutfen tekrar deneyin.' });
    }
  };

  const updateLang = (newLang) => {
    setFormLang(newLang);
    const newData = getInitialData(newLang);
    setFormData(prev => ({
      ...newData,
      date: prev.date,
      opDate: prev.opDate,
      opTime: prev.opTime,
      nameSurname: prev.nameSurname,
      age: prev.age,
      phone: prev.phone,
      email: prev.email,
      price: prev.price,
      currency: prev.currency
    }));
  };

  const toggleExtra = (opt) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.includes(opt) ? prev.extras.filter(x => x !== opt) : [...prev.extras, opt]
    }));
  };

  const handlePhotoUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhotos = [...photos];
        newPhotos[index] = reader.result;
        setPhotos(newPhotos);
      };
      reader.readAsDataURL(file);
    }
  };

  const getT = (key) => serviceStrings[formLang]?.[key] || serviceStrings.en?.[key] || key;

  return (
    <div className="quote-editor-layout">
      {/* Editor Panel */}
      <div className="quote-sidebar no-print card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           <button onClick={onBack} className="btn-back"><ArrowLeft size={16}/> {t.back}</button>
           <div className="lang-mini-select">
              <Globe size={14} />
              <select value={formLang} onChange={e => updateLang(e.target.value)}>
                <option value="en">EN</option><option value="tr">TR</option><option value="de">DE</option>
                <option value="fr">FR</option><option value="es">ES</option><option value="ru">RU</option><option value="ar">AR</option>
              </select>
           </div>
        </div>
        
        <h3 style={{ margin: '12px 0 20px', fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>{formData.badgeTitle} {t.editor}</h3>
        
        <div className="editor-section">
          <label>{t.info}</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input className="form-input sm" placeholder={t.date} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input className="form-input sm" placeholder={t.opDate} value={formData.opDate} onChange={e => setFormData({...formData, opDate: e.target.value})} style={{ flex: 1 }} />
            <input className="form-input sm" placeholder={t.opTime} value={formData.opTime} onChange={e => setFormData({...formData, opTime: e.target.value})} style={{ width: '100px' }} />
          </div>
          <input className="form-input sm" placeholder={t.name} value={formData.nameSurname} onChange={e => setFormData({...formData, nameSurname: e.target.value})} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <input className="form-input sm" placeholder={t.age} value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} style={{ width: '60px' }} />
            <select className="form-input sm" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} style={{ flex: 1 }}>
              <option>{translations[formLang]?.male || translations.en.male}</option>
              <option>{translations[formLang]?.female || translations.en.female}</option>
            </select>
          </div>
          <input className="form-input sm" style={{ marginTop: '8px' }} placeholder={t.phone} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input className="form-input sm" style={{ marginTop: '8px' }} placeholder={t.email} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>

        <div className="editor-section" style={{ marginTop: '20px' }}>
          <label>{t.oper}</label>
          <select className="form-input sm" value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})}>
            {formData.methods.map(m => <option key={m}>{m}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <input className="form-input sm" placeholder={type === 'hair' ? t.graft : 'Status'} value={formData.grafts} onChange={e => setFormData({...formData, grafts: e.target.value})} />
            <input className="form-input sm" placeholder={t.sess} value={formData.session} onChange={e => setFormData({...formData, session: e.target.value})} style={{ width: '80px' }} />
          </div>
        </div>

        <div className="editor-section" style={{ marginTop: '20px' }}>
          <label>{t.serv}</label>
          <textarea className="form-input sm" style={{ minHeight: '100px', resize: 'vertical' }} value={formData.services} onChange={e => setFormData({...formData, services: e.target.value})} />
        </div>

        <div className="editor-section" style={{ marginTop: '20px' }}>
          <label>Included Services</label>
          <div className="extras-selector">
            {formData.extraList.map(opt => (
              <div 
                key={opt} 
                className={`extra-chip ${formData.extras.includes(opt) ? 'active' : ''}`}
                onClick={() => toggleExtra(opt)}
              >
                {getT(opt)}
              </div>
            ))}
          </div>
        </div>

        <div className="editor-section" style={{ marginTop: '20px' }}>
          <label>{t.price} & {t.other}</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input className="form-input sm" placeholder={t.price} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            <select className="form-input sm" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} style={{ width: '80px' }}>
              <option value="EUR">EUR (€)</option><option value="USD">USD ($)</option><option value="TRY">TRY (₺)</option>
            </select>
          </div>
          <textarea className="form-input sm" placeholder="..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '32px', justifyContent: 'center' }}
          onClick={handleDownloadPdf}
          disabled={pdfState.busy}
        >
          {pdfState.busy
            ? <><Loader2 size={18} className="spin" /> PDF hazirlaniyor...</>
            : <><Download size={18} /> PDF Indir</>}
        </button>

        {pdfState.error && (
          <p style={{ color: 'var(--error)', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
            {pdfState.error}
          </p>
        )}
      </div>

      {/* Preview Section */}
      <div className="quote-preview-container">
        <div ref={docRef} className={`quote-doc ${formLang === 'ar' ? 'rtl' : ''}`}>
          <div className="page-wrap page-1">
            <div className="q-head">
               <img src={tenantConfig?.logo || logoImg} alt="Logo" className="q-logo" />
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0b4f6c' }}>{tenantConfig?.name?.toUpperCase() || 'ISTANBUL HAIR CENTER'}</div>
                  <div className="q-badge">{formData.badgeTitle}</div>
               </div>
            </div>

            <div className="q-section">
               <div className="q-title"><span className="q-num">1</span> {t.info}</div>
               <div className="q-box info text-start">
                  <div className="q-row"><span>{t.date}:</span> <strong>{formData.date}</strong></div>
                  {formData.opDate && <div className="q-row"><span>{t.opDate}:</span> <strong>{formData.opDate}</strong></div>}
                  {formData.opTime && <div className="q-row"><span>{t.opTime}:</span> <strong>{formData.opTime}</strong></div>}
                  <div className="q-row"><span>{t.gen}:</span> <strong>{formData.gender}</strong></div>
                  <div className="q-row"><span>{t.name}:</span> <strong>{formData.nameSurname || '...........................................'}</strong></div>
                  <div className="q-row"><span>{t.age}:</span> <strong>{formData.age || '....'}</strong></div>
                  <div className="q-row"><span>{t.phone}:</span> <strong>{formData.phone || '...........................................'}</strong></div>
                  <div className="q-row"><span>{t.email}:</span> <strong>{formData.email || '...........................................'}</strong></div>
               </div>
            </div>

            <div className="q-section">
               <div className="q-title"><span className="q-num">2</span> {t.oper}</div>
               <div className="q-grid-opt">
                  <div className="q-opt">
                     <div className="q-opt-head">{t.meth}</div>
                     <div className="q-opt-val">{formData.method}</div>
                  </div>
                  <div className="q-opt">
                     <div className="q-opt-head">{type === 'hair' ? t.graft : 'Status'}</div>
                     <div className="q-opt-val">{formData.grafts}</div>
                  </div>
                  <div className="q-opt">
                     <div className="q-opt-head">{type === 'hair' ? t.sess : 'Plan'}</div>
                     <div className="q-opt-val">{formData.session}</div>
                  </div>
               </div>
            </div>

            <div className="q-section">
               <div className="q-title"><span className="q-num">3</span> {t.photo}</div>
               <div className="q-photo-grid">
                  {photos.map((p, i) => (
                    <div key={i} className="q-photo-box" onClick={() => p ? null : document.getElementById(`flll-${i}`).click()}>
                      {p ? <img src={p} alt="upload" /> : <div className="no-print"><ImageIcon size={24} color="#ccc"/><br/><small>{t.upload}</small></div>}
                      <input type="file" id={`flll-${i}`} style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(i, e)} accept="image/*" />
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="page-wrap page-2">
            <div className="q-section">
               <div className="q-title"><span className="q-num">4</span> {t.serv}</div>
               <div className="q-box bg-none text-start">
                  <ul className="q-list">
                     {formData.services.split('\n').map((line, i) => line ? <li key={i}>{line}</li> : null)}
                  </ul>
               </div>
               
               <div className="q-extras-grid">
                  {formData.extras.map(ex => <div key={ex} className="q-extra-badge">{getT(ex)}</div>)}
               </div>
            </div>

            <div className="q-section">
               <div className="q-title"><span className="q-num">5</span> {t.other}</div>
               <div className="q-box text-start"><p style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap' }}>{formData.notes}</p></div>
            </div>

            <div className="q-price-bar text-start">
               {t.price}: <span className="q-price-val">{formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'} {formData.price} {formData.currency}</span>
            </div>

            <div className="q-footer">
               <div className="q-disclaimer">{formData.disclaimer}</div>
                <div className="q-seal">
                  <img src={tenantConfig?.logo || logoImg} alt="seal" />
                </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .quote-editor-layout { display: flex; gap: 32px; padding: 32px; background: #1a1a1a; min-height: 100vh; }
        .quote-sidebar { width: 340px; height: calc(100vh - 64px); position: sticky; top: 32px; overflow-y: auto; padding: 24px; }
        .btn-back { background: none; border: none; color: var(--accent-color); font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 0; }
        .lang-mini-select { display: flex; align-items: center; gap: 4px; color: var(--text-secondary); }
        .lang-mini-select select { background: transparent; border: none; color: white; font-size: 11px; font-weight: 700; cursor: pointer; outline: none; }
        .editor-section label { display: block; font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase; }
        .extras-selector { display: flex; flex-wrap: wrap; gap: 6px; }
        .extra-chip { font-size: 11px; padding: 4px 8px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; color: var(--text-secondary); }
        .extra-chip.active { background: rgba(212, 175, 55, 0.15); border-color: var(--accent-color); color: var(--accent-color); }
        .quote-preview-container { flex: 1; display: flex; justify-content: center; overflow-x: auto; }
        .quote-doc { width: 210mm; min-height: 297mm; background: white; padding: 20mm; color: #000; font-family: 'Inter', sans-serif; position: relative; }
        .quote-doc.rtl { direction: rtl; text-align: right; }
        .quote-doc.rtl .q-row span { width: auto; margin-left: 20px; }
        .quote-doc.rtl .q-list li { padding-left: 0; padding-right: 20px; }
        .quote-doc.rtl .q-list li::before { left: auto; right: 0; }
        .quote-doc.rtl .q-title { padding-right: 0; padding-left: 15px; }
        .text-start { text-align: start; }
        .q-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .q-logo { height: 60px; }
        .q-badge { background: #0b4f6c; color: white; border-radius: 30px; padding: 6px 40px; font-weight: 700; font-size: 14px; margin-top: 4px; }
        .q-section { margin-bottom: 12px; }
        .q-title { display: inline-flex; align-items: center; gap: 12px; border: 2px solid #0b4f6c; font-weight: 700; padding-right: 15px; margin-bottom: 8px; font-size: 14px; }
        .q-num { background: #0b4f6c; color: white; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
        .q-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; }
        .q-row { display: flex; border-bottom: 1px solid #cbd5e1; padding: 6px 0; font-size: 14px; }
        .q-row span { width: 140px; font-weight: 700; color: #334155; }
        .q-row:last-child { border: none; }
        .q-grid-opt { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .q-opt { border: 1px solid #0b4f6c; border-radius: 12px; text-align: center; overflow: hidden; }
        .q-opt-head { background: #0b4f6c; color: white; padding: 6px; font-size: 11px; font-weight: 700; }
        .q-opt-val { height: 75px; display: flex; align-items: center; justify-content: center; font-weight: 700; padding: 6px; font-size: 14px; }
        .q-photo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
        .q-photo-box { height: 160px; background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; }
        .q-photo-box img { width: 100%; height: 100%; object-fit: cover; }
        .q-list { list-style: none; padding: 0; margin-bottom: 20px; }
        .q-list li { position: relative; padding-left: 20px; margin-bottom: 8px; font-size: 13px; line-height: 1.5; color: #1e293b; }
        .q-list li::before { content: '●'; position: absolute; left: 0; color: #0b4f6c; font-size: 10px; }
        .q-extras-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; }
        .q-extra-badge { background: #0b4f6c; color: white; padding: 4px 12px; border-radius: 30px; font-size: 11px; font-weight: 600; }
        .q-price-bar { background: #0b4f6c; color: white; padding: 20px 40px; border-radius: 10px; margin-top: 40px; font-size: 24px; }
        .q-price-val { font-weight: 800; font-size: 32px; }
        .q-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: flex-end; }
        .q-disclaimer { max-width: 60%; font-size: 10px; color: #64748b; line-height: 1.6; }
        .q-seal img { height: 80px; opacity: 0.8; }
        @media print {
          html, body, .container, .content-area, .main-content, #root { background: white !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; display: block !important; box-shadow: none !important; }
          .sidebar, .topbar, .mobile-menu-btn, .sidebar-overlay, .no-print, .quote-sidebar { display: none !important; }
          .quote-preview-container { display: block !important; padding: 0 !important; margin: 0 !important; width: 100% !important; height: 100% !important; overflow: visible !important; }
          .quote-doc { width: 100% !important; height: auto !important; box-shadow: none !important; padding: 10mm !important; margin: 0 !important; border: none !important; background: white !important; display: block !important; min-height: auto !important; }
          .q-head-text, .q-price-bar, .q-badge, .q-num, .q-extra-badge { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .page-wrap.page-1 { break-after: page; margin: 0 !important; padding: 0 !important; }
          .page-wrap.page-1 .q-section { margin-bottom: 40px; }
          .page-wrap.page-2 { break-before: page; margin: 0 !important; padding-top: 20mm !important; }
          .q-section { margin-bottom: 24px; }
          .page-1 .q-section { break-after: initial; break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default QuoteForm;
