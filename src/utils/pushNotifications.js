import { Capacitor } from '@capacitor/core';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Mobil uygulamada anlik bildirim kaydi.
 *
 * Cihaz Firebase Cloud Messaging'e kaydolur, aldigi token kullanicinin
 * dokumanindaki fcmTokens dizisine eklenir. Cloud Function yeni lead
 * dustugunde bu tokenlara bildirim gonderir (bkz. functions/index.js).
 *
 * Tarayicida hicbir sey yapmaz; web push ayri bir kurulum gerektirir.
 */

let registered = false;

export const initPushNotifications = async ({ tenantSlug, userId, onOpenLead }) => {
  if (!Capacitor.isNativePlatform()) return;
  if (!tenantSlug || !userId) return;
  if (registered) return;
  registered = true;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Android 13 ve ustunde bildirim izni kullanicidan ayrica istenir.
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
      permission = await PushNotifications.requestPermissions();
    }
    if (permission.receive !== 'granted') {
      console.log('Bildirim izni verilmedi.');
      registered = false;
      return;
    }

    await PushNotifications.removeAllListeners();

    await PushNotifications.addListener('registration', async (token) => {
      try {
        await updateDoc(doc(db, 'tenants', tenantSlug, 'users', userId), {
          fcmTokens: arrayUnion(token.value),
        });
      } catch (err) {
        console.error('Bildirim tokeni kaydedilemedi:', err);
      }
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('Bildirim kaydi hatasi:', err);
    });

    // Bildirime dokunulunca ilgili lead sayfasini ac.
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const leadId = action?.notification?.data?.leadId;
      if (leadId && typeof onOpenLead === 'function') onOpenLead(leadId);
    });

    await PushNotifications.register();
  } catch (err) {
    console.error('Bildirimler baslatilamadi:', err);
    registered = false;
  }
};

/**
 * Cikis yapildiginda cihazin tokeni kullanicidan dusurulmelidir; aksi halde
 * ayni telefona baska bir kullanicinin leadleri icin bildirim gider.
 */
export const resetPushRegistration = () => {
  registered = false;
};
