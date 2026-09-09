/**
 * Merkezi platform yapilandirmasi.
 *
 * Proje kimligi, alan adi ve API adresleri gibi ortama gore degisen tum
 * degerler burada toplanir ve .env dosyasindan okunur. Firebase projesi
 * degistiginde yalnizca .env guncellenir; kod icinde hicbir yerde proje id
 * veya alan adi sabit olarak yazilmaz.
 */

const env = import.meta.env;

/** Platformun ana alan adi. Tenant subdomainleri bunun altinda cozulur. */
export const APP_DOMAIN = env.VITE_APP_DOMAIN || 'zbtcrmsys.com';

/** Webhook ve web form adreslerinin kok adresi. */
export const API_BASE_URL = env.VITE_API_BASE_URL || `https://${APP_DOMAIN}`;

/** Meta (Facebook) webhook dogrulama anahtari. functions/ tarafiyla ayni olmali. */
export const META_VERIFY_TOKEN = env.VITE_META_VERIFY_TOKEN || 'zbtcrm_meta_v2026';

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

/**
 * Admin paneli sayilan alan adlari. Bu adreslerde tenant slug'i cozulmez,
 * super admin paneli acilir.
 */
export const MAIN_DOMAINS = [
  APP_DOMAIN,
  firebaseConfig.projectId ? `${firebaseConfig.projectId}.web.app` : null,
  firebaseConfig.projectId ? `${firebaseConfig.projectId}.firebaseapp.com` : null,
].filter(Boolean);

/** Bir tenant slug'i icin tam subdomain adresini uretir. */
export const tenantDomain = (slug) => `${slug}.${APP_DOMAIN}`;

// Eksik yapilandirmayi sessizce gecmek yerine gelistirme sirasinda uyar.
if (!firebaseConfig.projectId) {
  console.error(
    'Firebase yapilandirmasi eksik. .env dosyasini .env.example ornegine gore doldurun.'
  );
}
