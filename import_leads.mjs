/**
 * Eski CRM'den lead aktarimi.
 *
 * Kullanim:
 *   node import_leads.mjs <dosya.xlsx>            -> PROVA (hicbir sey yazilmaz)
 *   node import_leads.mjs <dosya.xlsx> --commit   -> gercekten aktarir
 *
 * Lead sablonuna alan EKLENMEZ. Eski verideki her sutun mevcut bir alana eslenir;
 * karsiligi olmayan bilgiler kaybolmasin diye note ve tags alanlarina yazilir.
 */
import { readFileSync } from 'fs';
import xlsx from 'xlsx';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, doc, getDocs, getDoc,
  writeBatch, updateDoc, setDoc
} from 'firebase/firestore';

const SLUG = 'istanbulhaircenter';
const FILE = process.argv[2];
const COMMIT = process.argv.includes('--commit');

if (!FILE) {
  console.error('Kullanim: node import_leads.mjs <dosya.xlsx> [--commit]');
  process.exit(1);
}

/* ----------------------------------------------------------
 * Esleme tablolari
 * -------------------------------------------------------- */

// Karsilastirma icin: kucuk harf, noktalama ve bosluk yok.
// Turkce karakterler ASCII'ye katlanir; boylece 'Bağlıyor' ile 'bagliyor'
// ayni anahtara duser ve yazim farklari esleme bozmaz.
const norm = (s) =>
  String(s ?? '')
    .replace(/[İIı]/g, 'i').replace(/[Çç]/g, 'c').replace(/[Ğğ]/g, 'g')
    .replace(/[Öö]/g, 'o').replace(/[Şş]/g, 's').replace(/[Üü]/g, 'u')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

// Eski CRM metni -> bizim sablondaki karsiligi.
// Anahtarlar norm() ile uretilir; normalize edilmis anahtari elle yazmak
// hataya acik oldugu icin esleme ciftleri okunabilir haliyle tutulur.
const buildMap = (pairs) => {
  const out = {};
  for (const [from, to] of pairs) out[norm(from)] = to;
  return out;
};

const STATUS_MAP = buildMap([
  ['Aranmayı bekliyor', 'Aranmayı Bekliyor'],
  ['Aradım, açmadı', 'Aradım, Açmadı'],
  ['Aramayı reddetti', 'Aramayı Reddeti'],
  ['Başka bir klinikle anlaşmış', 'Başka Bir Klinikle Anlaşmış'],
  ['Başka ülkede sanmış', 'Lokasyon Olumsuz'],
  ['Bilet alındı/ Randevu oluşturuldu', 'Randevu Oluşturuldu'],
  ['Bilgi Verdim sonra ulaşamadım', 'İletişim Eksik'],
  ['Destek tedavisine uygun', 'Destek Tedavisine Uygun'],
  ['Dil sorunu', 'Dil Sorunu'],
  ['Engelledi/Engelledim', 'Engelledi/Engelledim'],
  ['Fiyatı pahalı buldu', 'Fiyatı Pahalı Buldu'],
  ['Fotoğraf Alındı Teklif Verildi', 'Fotoğraf Alındı, Teklif Verildi'],
  ['Fotoğraf bekleniyor', 'Fotoğraf Bekleniyor'],
  ['Hiçbir şekilde iletişim kurulamadı', 'İletişim Kurulamıyor'],
  ['İleri bir tarih için düşünüyor', 'İleri Tarihte Düşünüyor'],
  ['İleri Tarih', 'İleri Tarihte Düşünüyor'],
  ['İletişimdeyim', 'İletişimdeyim'],
  ['İletişime geçiyorum', 'İletişime Geçiyorum'],
  ['İlgisiz', 'İlgisiz'],
  ['İptal Edildi', 'Randevu İptal Edildi'],
  ['Kapora alındı', 'Kaporalı Randevu Oluşturuldu'],
  ['Mesaj attım, cevap bekliyorum', 'Mesaj Attım, Bekleniyor'],
  ['Operasyona girdi', 'Operasyona Girdi'],
  ['Operasyona uygun değil', 'Operasyona Uygun Değil'],
  ['Saç ekimi düşünmüyor', 'Saç Ekimi Düşünmüyor'],
  ['Sadece Fiyat İstedi', 'Sadece Fiyat Sordu'],
  ['Teklif verildi, kararsız', 'Teklif Verildi, Kararsız'],
  ['Teklif verildi, olumlu', 'Teklif Verildi, Olumlu'],
  ['Teklife Dönüş yapmadı', 'Teklife Dönüş Yapmadı'],
  ['Tekrar gelen lead', 'Tekrar Gelen Lead'],
  ['Telesekretere Bağlıyor', 'Telesekretere Bağlanıyor'],
  ['Yanlış başvuru', 'Yanlış Başvuru'],
  ['Yanlış numara', 'Yanlış Numara'],
  ['Yüz yüze görüşmeye gelecek', 'Yüzyüze Görüşme'],
  // Sablonda karsiligi olmayan ilgi alanlari: sac ekimi istemiyor ama
  // baska tedaviyle ilgileniyor. Asil ilgi alani nota yazilir.
  ['Estetik ile ilgileniyor', 'Saç Ekimi Düşünmüyor'],
  ['Diş tedavileri ile ilgileniyor', 'Saç Ekimi Düşünmüyor'],
]);

const SOURCE_MAP = buildMap([
  ['Whatsapp', 'Whatsaap'],
  ['Whatsaap', 'Whatsaap'],
  ['Meta', 'Meta'],
  ['Google', 'Google'],
  ['Web Sitesi', 'Web Sitesi'],
  ['Instagram DM', 'İnstagram DM'],
  ['Yandex', 'Yandex'],
  ['Referans', 'Referans'],
  ['Organik/Kendisi Buldu', 'Organik/Kendisi Buldu'],
  ['Agency/Acente', 'Acente'],
  ['Acente', 'Acente'],
  ['Mail', 'Mail'],
]);

const LANGUAGE_MAP = buildMap([
  ['Türkçe', 'Türkçe'],
  ['İngilizce', 'İngilizce'],
  ['Almanca', 'Almanca'],
  ['Fransızca', 'Fransızca'],
  ['İspanyolca', 'İspanyolca'],
  ['İtalyanca', 'İtalyanca'],
  ['Rusça', 'Rusça'],
  ['Arapça', 'Arapça'],
  ['Rumence', 'Rumence'],
  ['Bulgarca', 'Bulgarca'],
  ['Hollandaca', 'Hollandaca'],
]);

// PDF ciktisinda sutuna sigmayan degerler ucnokta ile kirpilmis
// ("Organik/Kendisi …"). Segment/Referans/Dil kapali listeler oldugu icin
// kirpik degerin normalize hali tek bir anahtarin on eki ise o anahtara
// coozulur. Birden fazla adaya uyuyorsa cozulmez, ESLESMEYEN'e duser.
const TRUNC_RE = /…|\.\.\.$/;

const resolve = (map, rawValue) => {
  const key = norm(rawValue);
  if (map[key]) return map[key];
  if (!TRUNC_RE.test(rawValue) || !key) return null;
  const hits = Object.keys(map).filter((k) => k.startsWith(key));
  const values = [...new Set(hits.map((k) => map[k]))];
  return values.length === 1 ? values[0] : null;
};

// Ulke serbest metin oldugu icin on ek cozumu yapilamaz; kirpilan uc deger
// PDF'te hicbir zaman tam halde gecmiyor, bu yuzden acikca yazildi.
const COUNTRY_FIX = buildMap([
  ['Amerika Birleşik …', 'Amerika Birleşik Devletleri'],
  ['Birleşik Arap Emi…', 'Birleşik Arap Emirlikleri'],
  ['Dominik Cumhuri…', 'Dominik Cumhuriyeti'],
]);

// CRM'de olmayan eski temsilciler; aktif kullanici olarak olusturulur.
const NEW_REPS = ['Birnur Yaray', 'Olga Kocabaş', 'Lis Bayram', 'Anar', 'Şeyma', 'İlia'];

// phoneUtils.js ile ayni on ek tablosu.
const PHONE_PREFIXES = {
  '+90': 'tr', '+994': 'az', '+1': 'us', '+44': 'gb', '+49': 'de',
  '+43': 'at', '+41': 'ch', '+33': 'fr', '+32': 'be', '+31': 'nl',
  '+34': 'es', '+39': 'it', '+7': 'ru', '+971': 'ae', '+966': 'sa',
  '+965': 'kw', '+974': 'qa', '+40': 'ro', '+359': 'bg', '+46': 'se',
  '+47': 'no', '+45': 'dk', '+351': 'pt', '+55': 'br', '+30': 'gr',
};

const countryCodeFromPhone = (phone) => {
  const p = String(phone || '').replace(/[\s()-]/g, '');
  const prefixes = Object.keys(PHONE_PREFIXES).sort((a, b) => b.length - a.length);
  for (const pre of prefixes) if (p.startsWith(pre)) return PHONE_PREFIXES[pre];
  return '';
};

// "03.08.2026" -> ISO. Excel'in sayisal tarih hucreleri de desteklenir.
const parseDate = (v) => {
  if (v == null || v === '') return null;
  if (v instanceof Date) return isNaN(v) ? null : v.toISOString();
  if (typeof v === 'number') {
    const d = new Date(Date.UTC(1899, 11, 30 + v));
    return isNaN(d) ? null : d.toISOString();
  }
  const m = String(v).trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return isNaN(d) ? null : d.toISOString();
};

/* ----------------------------------------------------------
 * Excel okuma
 * -------------------------------------------------------- */

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const db = getFirestore(initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
}));

const wb = xlsx.readFile(FILE, { cellDates: true });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false });

if (!rows.length) { console.error('Dosyada satir bulunamadi.'); process.exit(1); }

// Sutun basliklarini esnek eslestir (buyuk/kucuk harf, bosluk farketmez).
const headers = Object.keys(rows[0]);
const findCol = (...names) => {
  for (const n of names) {
    const hit = headers.find(h => norm(h) === norm(n));
    if (hit) return hit;
  }
  return null;
};
const COL = {
  id: findCol('ID'),
  name: findCol('Ad', 'Ad Soyad'),
  phone: findCol('Telefon'),
  email: findCol('E-Posta', 'EPosta', 'Email'),
  status: findCol('Segment'),
  rep: findCol('Satış tems.', 'Satis tems', 'Satış Temsilcisi'),
  type: findCol('Tip'),
  country: findCol('Ülke'),
  language: findCol('Dil'),
  source: findCol('Referans', 'Kaynak'),
  date: findCol('Kayıt tarihi', 'Kayit tarihi'),
};

console.log('=== SUTUN ESLESMESI ===');
for (const [k, v] of Object.entries(COL)) {
  console.log('  ' + k.padEnd(9) + ' -> ' + (v || '(BULUNAMADI)'));
}
console.log('\nDosyada ' + rows.length + ' satir var.\n');

/* ----------------------------------------------------------
 * Donusturme
 * -------------------------------------------------------- */

const unmatched = {
  status: new Map(), source: new Map(), language: new Map(),
  rep: new Map(), country: new Map(),
};
const track = (bucket, val) => {
  if (!val) return;
  unmatched[bucket].set(val, (unmatched[bucket].get(val) || 0) + 1);
};

const buildLead = (row, userIdByName) => {
  const raw = (c) => (c ? String(row[c] ?? '').trim() : '');

  const rawStatus = raw(COL.status);
  const rawSource = raw(COL.source);
  const rawLang = raw(COL.language);
  const rawRep = raw(COL.rep);

  const status = resolve(STATUS_MAP, rawStatus);
  const source = resolve(SOURCE_MAP, rawSource);
  const language = resolve(LANGUAGE_MAP, rawLang);

  if (rawStatus && !status) track('status', rawStatus);
  if (rawSource && !source) track('source', rawSource);
  if (rawLang && !language) track('language', rawLang);

  // Temsilci adi 'İlia - İhairium Acente' gibi aciklama tasiyabilir;
  // tam ad tutmazsa tire oncesi kisimla tekrar denenir.
  const repKey = norm(rawRep);
  const repShort = norm(rawRep.split(/[-–(]/)[0]);
  // Excel'de ad soyad ('Özlem Öztürk'), CRM'de yalniz ad ('Özlem') olabilir.
  const repFirst = norm(rawRep.trim().split(/\s+/)[0]);
  const assigneeId = rawRep
    ? (userIdByName.get(repKey) ?? userIdByName.get(repShort) ?? userIdByName.get(repFirst) ?? null)
    : null;
  if (rawRep && !assigneeId) track('rep', rawRep);

  const rawCountry = raw(COL.country);
  const country = COUNTRY_FIX[norm(rawCountry)] || rawCountry;
  if (rawCountry && TRUNC_RE.test(rawCountry) && country === rawCountry) {
    track('country', rawCountry);
  }

  const phone = raw(COL.phone);
  const createdAt = parseDate(raw(COL.date)) || new Date().toISOString();

  // Sablona sigmayan bilgiler kaybolmasin: eski kayit no ve varsa
  // asil ilgi alani nota yazilir.
  const noteParts = [];
  if (raw(COL.id)) noteParts.push('Eski CRM kaydı #' + raw(COL.id));
  if (rawStatus && norm(rawStatus).includes('ilgileniyor')) noteParts.push(rawStatus);
  if (rawStatus && !status) noteParts.push('Eski durum: ' + rawStatus);
  if (rawSource && !source) noteParts.push('Eski kaynak: ' + rawSource);

  return {
    nameSurname: raw(COL.name),
    email: raw(COL.email),
    phone,
    country,
    countryCode: countryCodeFromPhone(phone),
    gender: '',
    birthDate: '',
    source: source || '',
    language: language || '',
    note: noteParts.join(' | '),
    communicationSource: '',
    communicationPreference: '',
    referringPatient: '',
    discountGroup: '',
    relatedPersonnel: [],
    tags: raw(COL.type),
    status: status || 'Aranmayı Bekliyor',
    assigneeId,
    createdAt,
    history: [{
      date: createdAt,
      note: 'Eski CRM verisinden aktarıldı.',
      status: status || 'Aranmayı Bekliyor',
      author: 'Sistem',
    }],
    importedFrom: 'legacy',
  };
};

/* ----------------------------------------------------------
 * Calistir
 * -------------------------------------------------------- */

const run = async () => {
  const tenantRef = doc(db, 'tenants', SLUG);
  const usersSnap = await getDocs(collection(tenantRef, 'users'));

  const userIdByName = new Map();
  for (const d of usersSnap.docs) {
    const n = d.data().name || '';
    userIdByName.set(norm(n), d.id);
    userIdByName.set(norm(n.split(' ')[0]), d.id); // "Özlem Öztürk" -> "Özlem"
  }

  // Eksik temsilcileri belirle
  const toCreate = NEW_REPS.filter(n => !userIdByName.has(norm(n)));

  // Mevcut telefonlar (mukerrer kayit engeli)
  const leadsSnap = await getDocs(collection(tenantRef, 'leads'));
  const existingPhones = new Set(
    leadsSnap.docs.map(d => String(d.data().phone || '').replace(/[\s()-]/g, '')).filter(Boolean)
  );

  // Once kullanicilari olustur ki lead'ler onlara baglanabilsin
  if (toCreate.length) {
    console.log('=== EKLENECEK KULLANICILAR (' + toCreate.length + ') ===');
    for (const name of toCreate) {
      const id = 'legacy_' + norm(name);
      console.log('  + ' + name);
      if (COMMIT) {
        await setDoc(doc(tenantRef, 'users', id), {
          name,
          email: norm(name) + '@istanbulhaircenter.com',
          password: Math.random().toString(36).slice(2, 10),
          role: 'Satış Danışmanı',
          level: 2,
          status: 'active',
          languages: [],
          createdAt: new Date().toISOString(),
        });
      }
      userIdByName.set(norm(name), id);
      userIdByName.set(norm(name.split(' ')[0]), id);
    }
    console.log('');
  }

  // Satirlari donustur
  const leads = [];
  let skippedDuplicate = 0, skippedEmpty = 0;
  const seenInFile = new Set();

  for (const row of rows) {
    const lead = buildLead(row, userIdByName);
    if (!lead.phone && !lead.email) { skippedEmpty++; continue; }
    const key = lead.phone.replace(/[\s()-]/g, '');
    if (key && (existingPhones.has(key) || seenInFile.has(key))) { skippedDuplicate++; continue; }
    if (key) seenInFile.add(key);
    leads.push(lead);
  }

  // Ozet
  const nameById = new Map();
  for (const d of usersSnap.docs) nameById.set(d.id, d.data().name);
  for (const n of NEW_REPS) nameById.set('legacy_' + norm(n), n);

  const byStatus = {}, bySource = {}, byRep = {};
  for (const l of leads) {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    bySource[l.source || '(boş)'] = (bySource[l.source || '(boş)'] || 0) + 1;
    const who = l.assigneeId ? (nameById.get(l.assigneeId) || l.assigneeId) : '(havuzda)';
    byRep[who] = (byRep[who] || 0) + 1;
  }

  // Hem duz nesne hem Map kabul eder; Object.entries(Map) bos doner.
  const top = (o, n) =>
    (o instanceof Map ? [...o.entries()] : Object.entries(o))
      .sort((a, b) => b[1] - a[1])
      .slice(0, n || 8);

  console.log('=== SONUC ===');
  console.log('  Aktarilacak      : ' + leads.length);
  console.log('  Mukerrer atlandi : ' + skippedDuplicate);
  console.log('  Bos atlandi      : ' + skippedEmpty);

  console.log('\n  Durum dagilimi (ilk 10):');
  for (const [k, v] of top(byStatus, 10)) console.log('    ' + String(v).padStart(5) + '  ' + k);
  console.log('\n  Kaynak dagilimi:');
  for (const [k, v] of top(bySource, 12)) console.log('    ' + String(v).padStart(5) + '  ' + k);
  console.log('\n  Temsilci dagilimi:');
  for (const [k, v] of top(byRep, 15)) console.log('    ' + String(v).padStart(5) + '  ' + k);

  for (const [bucket, map] of Object.entries(unmatched)) {
    if (!map.size) continue;
    console.log('\n  !! ESLESMEYEN ' + bucket.toUpperCase() + ' (' + map.size + ' farkli deger):');
    for (const [k, v] of top(map, 15)) console.log('    ' + String(v).padStart(5) + '  "' + k + '"');
  }

  console.log('\n  Ornek kayit:');
  console.log(JSON.stringify(leads[0], null, 2).split('\n').map(l => '    ' + l).join('\n'));

  if (!COMMIT) {
    console.log('\n>>> PROVA MODU - hicbir sey yazilmadi.');
    console.log('>>> Aktarmak icin sonuna --commit ekle.');
    process.exit(0);
  }

  // Yaz (Firestore batch limiti 500)
  console.log('\nYaziliyor...');
  let written = 0;
  for (let i = 0; i < leads.length; i += 400) {
    const batch = writeBatch(db);
    for (const lead of leads.slice(i, i + 400)) {
      batch.set(doc(collection(tenantRef, 'leads')), lead);
    }
    await batch.commit();
    written += Math.min(400, leads.length - i);
    process.stdout.write('\r  ' + written + '/' + leads.length);
  }

  const tenant = await getDoc(tenantRef);
  await updateDoc(tenantRef, {
    leadCount: (tenant.data().leadCount || 0) + written,
    maxUsers: Math.max(Number(tenant.data().maxUsers) || 10, 15),
  });

  console.log('\n\nTamamlandi: ' + written + ' lead aktarildi.');
  process.exit(0);
};

run().catch(e => { console.error('HATA:', e.message); process.exit(1); });
