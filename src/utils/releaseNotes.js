import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, orderBy, where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Guncelleme notlari.
 *
 * Notlar eskiden bilesenin icine gomulu bir diziydi; her surumde kodu
 * degistirmek gerekiyordu ve bu yuzden aylardir guncellenmemisti. Artik
 * ust duzey release_notes koleksiyonunda duruyor: super admin panelinden
 * yazilip yayinlaniyor, tum firmalarin panelinde ayni anda goruluyor.
 *
 * Guvenlik kurallari: giris yapmis herkes okuyabilir, yalnizca super admin
 * yazabilir.
 */

const notesCollection = collection(db, 'release_notes');

/** Yayindaki notlar - firma panellerinde gosterilenler. */
export const getPublishedReleaseNotes = async () => {
  const snapshot = await getDocs(
    query(notesCollection, where('published', '==', true), orderBy('publishedAt', 'desc'))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Taslaklar dahil hepsi - yalnizca super admin panelinde. */
export const getAllReleaseNotes = async () => {
  const snapshot = await getDocs(query(notesCollection, orderBy('createdAt', 'desc')));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createReleaseNote = async (data) => {
  const now = new Date().toISOString();
  const payload = {
    title: String(data.title || '').trim(),
    version: String(data.version || '').trim(),
    body: String(data.body || '').trim(),
    published: false,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(notesCollection, payload);
  return { id: ref.id, ...payload };
};

export const updateReleaseNote = async (id, data) => {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(doc(db, 'release_notes', id), payload);
  return payload;
};

/**
 * Notu yayinlar. publishedAt ilk yayinda damgalanir; geri alinip tekrar
 * yayinlanirsa tarih tazelenir, boylece kullanicilarda yeni olarak gorunur.
 */
export const publishReleaseNote = async (id) => {
  const publishedAt = new Date().toISOString();
  await updateDoc(doc(db, 'release_notes', id), {
    published: true,
    publishedAt,
    updatedAt: publishedAt,
  });
  return publishedAt;
};

export const unpublishReleaseNote = async (id) => {
  await updateDoc(doc(db, 'release_notes', id), {
    published: false,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteReleaseNote = async (id) => {
  await deleteDoc(doc(db, 'release_notes', id));
};

/* ----------------------------------------------------------
 * Okundu bilgisi
 * --------------------------------------------------------
 * Kullanici basina, cihazda tutuluyor. Firestore'a yazmak her kullanici
 * icin ek okuma/yazma demek olurdu; okundu isareti o kadar kritik degil.
 */

const readKey = (userId) => `zbt_release_notes_read_${userId || 'anon'}`;

export const getReadNoteIds = (userId) => {
  try {
    const raw = localStorage.getItem(readKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const markNotesAsRead = (userId, ids) => {
  try {
    const merged = Array.from(new Set([...getReadNoteIds(userId), ...ids]));
    localStorage.setItem(readKey(userId), JSON.stringify(merged));
  } catch {
    // Depolama kapali olabilir; okundu bilgisi kaybolur, akis bozulmaz.
  }
};
