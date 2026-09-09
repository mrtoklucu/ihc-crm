/**
 * Mevcut danismanlara hizmet verdikleri dilleri atar.
 * Tek seferlik kurulum icin; sonrasinda Kullanicilar sayfasindan duzenlenir.
 */
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const db = getFirestore(initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
}));

const SLUG = 'istanbulhaircenter';

// E-postanin @ oncesi ile eslestirilir.
const LANGUAGES = {
  ihsen: ['İngilizce', 'Arapça', 'Fransızca'],
  ozlem: ['Türkçe'],
  rana:  ['Rusça'],
  afra:  ['Almanca'],
};

const run = async () => {
  const snap = await getDocs(collection(db, 'tenants', SLUG, 'users'));

  for (const d of snap.docs) {
    const user = d.data();
    const handle = (user.email || '').split('@')[0].toLowerCase();
    const languages = LANGUAGES[handle];

    if (!languages) {
      console.log(`- ${user.name || handle}: dil tanimlanmadi, atlandi`);
      continue;
    }

    await updateDoc(doc(db, 'tenants', SLUG, 'users', d.id), { languages });
    console.log(`+ ${user.name || handle}: ${languages.join(', ')}`);
  }
  process.exit(0);
};

run().catch(e => { console.error('HATA:', e.message); process.exit(1); });
