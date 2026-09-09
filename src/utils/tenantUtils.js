/**
 * Multi-Tenant CRM Utility Functions
 * 
 * Subdomain algılama ve tenant yönetimi için yardımcı fonksiyonlar.
 */

/**
 * Hostname'den tenant (firma) slug'ını çıkarır.
 * 
 * Örnekler:
 *   "istanbulhaircenter.zbtcrmsys.com" → "istanbulhaircenter"
 *   "estheaura.zbtcrmsys.com"          → "estheaura"
 *   "zbtcrmsys.com"                    → null  (admin panel)
 *   "localhost"                        → null  (geliştirme - admin)
 * 
 * Geliştirme ortamında ?tenant=xxx query parametresi ile test edilebilir.
 */
import { db } from '../config/firebase';
import { MAIN_DOMAINS } from '../config/appConfig';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const getTenantSlug = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam) return tenantParam;

  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return null;
  }

  const mainDomains = MAIN_DOMAINS;
  
  for (const mainDomain of mainDomains) {
    if (hostname === mainDomain) {
      return null;
    }
    if (hostname.endsWith('.' + mainDomain)) {
      const subdomain = hostname.replace('.' + mainDomain, '');
      if (subdomain === 'www') return null;
      return subdomain;
    }
  }

  return null;
};

export const isAdminPanel = () => {
  return getTenantSlug() === null;
};

export const getStorageKey = (tenantSlug, key) => {
  return `tenant_${tenantSlug}_${key}`;
};

const tenantsCollection = collection(db, 'tenants');

// Asenkron Firestore fonksiyonları
export const getAllTenants = async () => {
  const snapshot = await getDocs(tenantsCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getTenantBySlug = async (slug) => {
  const docRef = doc(db, 'tenants', slug);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  }
  return null;
};

/**
 * Mobil uygulama erisim koduyla firmayi bulur.
 *
 * Native uygulamada subdomain olmadigi icin firma subdomain'den
 * cozulemez; kullanici super admin panelinde tanimlanan appCode'u girer.
 */
export const getTenantByAppCode = async (code) => {
  const normalized = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!normalized) return null;

  const snapshot = await getDocs(query(tenantsCollection, where('appCode', '==', normalized)));
  if (snapshot.empty) return null;

  const found = snapshot.docs[0];
  return { id: found.id, ...found.data() };
};

/** Uygulamanin hatirladigi firma slug'i (native surumde kullanilir). */
export const APP_TENANT_KEY = 'zbt_app_tenant_slug';

export const getRememberedTenantSlug = () => {
  try {
    return localStorage.getItem(APP_TENANT_KEY);
  } catch {
    return null;
  }
};

export const rememberTenantSlug = (slug) => {
  try {
    if (slug) localStorage.setItem(APP_TENANT_KEY, slug);
    else localStorage.removeItem(APP_TENANT_KEY);
  } catch {
    // Depolama kapaliysa kod her acilista tekrar sorulur.
  }
};

/**
 * Yeni firma olusturur.
 *
 * Islem sunucudaki provisionTenant fonksiyonuna devredilir: yonetici sifresi
 * artik firma dokumanina yazilmiyor (o dokuman giris ekraninda okunabiliyor)
 * ve ilk yoneticinin Firebase Authentication hesabi orada aciliyor.
 */
export const createTenant = async (tenantData) => {
  const provision = httpsCallable(getFunctions(undefined, 'europe-west3'), 'provisionTenant');
  const res = await provision({
    slug: tenantData.slug,
    name: tenantData.name,
    logo: tenantData.logo || null,
    backgroundImage: tenantData.backgroundImage || null,
    maxUsers: tenantData.maxUsers || 5,
    status: tenantData.status || 'active',
    expiresAt: tenantData.expiresAt || null,
    primaryColor: tenantData.primaryColor || '#6366f1',
    adminEmail: tenantData.adminEmail,
    adminPassword: tenantData.adminPassword,
    appCode: tenantData.appCode || '',
  });

  const snapshot = await getDoc(doc(db, 'tenants', res.data.slug));
  return { id: snapshot.id, ...snapshot.data() };
};

export const updateTenant = async (slug, updatedData) => {
  const docRef = doc(db, 'tenants', slug);
  await updateDoc(docRef, updatedData);
  const snapshot = await getDoc(docRef);
  return { id: snapshot.id, ...snapshot.data() };
};

export const deleteTenant = async (slug) => {
  const docRef = doc(db, 'tenants', slug);
  await deleteDoc(docRef);

  // Lokal temizlik işlemlerine devam:
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`tenant_${slug}_`)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
};


export const getTenantLeadCount = (tenant) => {
  if (!tenant) return 0;
  return tenant.leadCount || 0;
};

export const getTenantUserCount = (tenant) => {
  if (!tenant) return 0;
  return tenant.userCount || 0;
};

export const isTenantUserLimitReached = (tenant) => {
  if (!tenant) return true;
  return getTenantUserCount(tenant) >= tenant.maxUsers;
};
