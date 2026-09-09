/**
 * Kullanici hesabi yonetimi.
 *
 * Giris Firebase Authentication'a tasindiktan sonra sifre ve hesap islemleri
 * artik istemciden Firestore'a yazilarak yapilamiyor: sifre Auth tarafinda
 * duruyor ve bir kullanici baskasinin hesabini istemciden olusturamaz.
 * Bu yuzden islemler burada, cagiranin yetkisi dogrulanarak yapiliyor.
 *
 * Yetki kaynagi istemcinin gonderdigi veri degil, tokendaki ozel alanlardir
 * (tenantSlug / userId / level). Bunlari yalnizca sunucu yazabilir.
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();
const REGION = "europe-west3";
const ADMIN_LEVEL = 5;

const MIN_PASSWORD_LENGTH = 8;

/** Cagiranin kimligini ve yetkisini tokendan cozer. */
const requireCaller = (context) => {
  const auth = context.auth;
  if (!auth) {
    throw new functions.https.HttpsError("unauthenticated", "Oturum açmanız gerekiyor.");
  }
  const { tenantSlug, userId, level } = auth.token || {};
  if (!tenantSlug || !userId) {
    throw new functions.https.HttpsError("permission-denied", "Hesabınız bir firmaya bağlı değil.");
  }
  return { uid: auth.uid, tenantSlug, userId, level: Number(level) || 1 };
};

const requireAdmin = (caller) => {
  if (caller.level !== ADMIN_LEVEL) {
    throw new functions.https.HttpsError("permission-denied", "Bu işlem için yönetici yetkisi gerekiyor.");
  }
};

const validatePassword = (password) => {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`
    );
  }
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

/**
 * Sifre degistirir.
 *
 * Kullanici kendi sifresini degistirebilir; yonetici ayni firmadaki herkesin
 * sifresini belirleyebilir.
 */
exports.setUserPassword = functions.region(REGION).https.onCall(async (data, context) => {
  const caller = requireCaller(context);
  const targetUserId = String(data?.targetUserId || caller.userId);
  const newPassword = data?.newPassword;

  validatePassword(newPassword);

  const isSelf = targetUserId === caller.userId;
  if (!isSelf) requireAdmin(caller);

  const userRef = db
    .collection("tenants").doc(caller.tenantSlug)
    .collection("users").doc(targetUserId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Kullanıcı bulunamadı.");
  }

  const user = userDoc.data();
  let uid = user.authUid;
  if (!uid) {
    // Auth hesabi henuz yoksa e-postadan bulunur veya olusturulur.
    const email = normalizeEmail(user.email);
    try {
      uid = (await admin.auth().getUserByEmail(email)).uid;
    } catch (err) {
      if (err.code !== "auth/user-not-found") throw err;
      uid = (await admin.auth().createUser({ email, password: newPassword, displayName: user.name })).uid;
    }
    await admin.auth().setCustomUserClaims(uid, {
      tenantSlug: caller.tenantSlug,
      userId: targetUserId,
      level: Number(user.level) || 1,
    });
  }

  await admin.auth().updateUser(uid, { password: newPassword });
  // Duz metin sifre artik hicbir yerde tutulmuyor.
  await userRef.update({
    authUid: uid,
    password: admin.firestore.FieldValue.delete(),
    passwordUpdatedAt: new Date().toISOString(),
  });

  return { ok: true };
});

/** Yeni kullanici olusturur: once Auth hesabi, sonra firma altindaki dokuman. */
exports.createTenantUser = functions.region(REGION).https.onCall(async (data, context) => {
  const caller = requireCaller(context);
  requireAdmin(caller);

  const email = normalizeEmail(data?.email);
  const password = data?.password;
  const name = String(data?.name || "").trim();
  const level = Number(data?.level) || 1;

  if (!email || !name) {
    throw new functions.https.HttpsError("invalid-argument", "Ad ve e-posta zorunlu.");
  }
  validatePassword(password);

  const tenantRef = db.collection("tenants").doc(caller.tenantSlug);
  const tenantDoc = await tenantRef.get();
  if (!tenantDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Firma bulunamadı.");
  }

  // Lisans siniri sunucuda dogrulaniyor; istemcideki kontrol atlanabilirdi.
  const usersSnap = await tenantRef.collection("users").get();
  const maxUsers = Number(tenantDoc.data().maxUsers) || 0;
  if (maxUsers > 0 && usersSnap.size >= maxUsers) {
    throw new functions.https.HttpsError(
      "resource-exhausted",
      `Kullanıcı sınırına ulaşıldı (${maxUsers}).`
    );
  }

  let authUser;
  try {
    authUser = await admin.auth().createUser({ email, password, displayName: name });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      throw new functions.https.HttpsError("already-exists", "Bu e-posta zaten kayıtlı.");
    }
    throw new functions.https.HttpsError("internal", err.message);
  }

  const userRef = tenantRef.collection("users").doc();
  await admin.auth().setCustomUserClaims(authUser.uid, {
    tenantSlug: caller.tenantSlug,
    userId: userRef.id,
    level,
  });

  await userRef.set({
    name,
    email,
    role: String(data?.role || ""),
    level,
    languages: Array.isArray(data?.languages) ? data.languages : [],
    status: "active",
    authUid: authUser.uid,
    createdAt: new Date().toISOString(),
  });

  await tenantRef.update({ userCount: usersSnap.size + 1 });

  return { ok: true, userId: userRef.id, authUid: authUser.uid };
});

/**
 * Yetki seviyesi veya durum degistiginde Auth tarafini esitler.
 *
 * Seviye tokendaki ozel alanda tutuldugu icin guncellenmezse kullanici eski
 * yetkisiyle devam eder. Pasiflestirilen hesap Auth tarafinda da devre disi
 * birakilir; boylece acik oturumu bir sonraki token yenilemesinde duser.
 */
exports.syncUserAccount = functions.region(REGION).https.onCall(async (data, context) => {
  const caller = requireCaller(context);
  requireAdmin(caller);

  const targetUserId = String(data?.targetUserId || "");
  if (!targetUserId) {
    throw new functions.https.HttpsError("invalid-argument", "Kullanıcı belirtilmedi.");
  }

  const userRef = db
    .collection("tenants").doc(caller.tenantSlug)
    .collection("users").doc(targetUserId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Kullanıcı bulunamadı.");
  }

  const user = userDoc.data();
  if (!user.authUid) return { ok: true, skipped: "auth hesabi yok" };

  const disabled = user.status === "passive";
  await admin.auth().updateUser(user.authUid, { disabled });
  await admin.auth().setCustomUserClaims(user.authUid, {
    tenantSlug: caller.tenantSlug,
    userId: targetUserId,
    level: Number(user.level) || 1,
  });

  return { ok: true, disabled };
});

/**
 * Yeni firma olusturur ve ilk yoneticisinin hesabini acar.
 *
 * Eskiden firma dokumanina adminPassword yaziliyor ve yonetici kullanicisi
 * istemcide olusturuluyordu. Firma dokumani giris ekraninda okunabildigi icin
 * bu, sifreyi herkese acik hale getiriyordu; ayrica Auth hesabi acilmadigi
 * icin yeni yonetici sisteme giremiyordu. Ikisi de burada cozuluyor.
 */
exports.provisionTenant = functions.region(REGION).https.onCall(async (data, context) => {
  const caller = context.auth;
  if (!caller || !caller.token?.superAdmin) {
    throw new functions.https.HttpsError("permission-denied", "Bu işlem için platform yöneticisi olmanız gerekiyor.");
  }

  const slug = String(data?.slug || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const name = String(data?.name || "").trim();
  const adminEmail = normalizeEmail(data?.adminEmail);
  const adminPassword = data?.adminPassword;

  if (!slug || !name || !adminEmail) {
    throw new functions.https.HttpsError("invalid-argument", "Firma adı, subdomain ve yönetici e-postası zorunlu.");
  }
  validatePassword(adminPassword);

  const tenantRef = db.collection("tenants").doc(slug);
  if ((await tenantRef.get()).exists) {
    throw new functions.https.HttpsError("already-exists", "Bu subdomain zaten kullanımda.");
  }

  // Sifre firma dokumanina yazilmaz; yalnizca Auth tarafinda tutulur.
  await tenantRef.set({
    slug,
    name,
    logo: data?.logo || null,
    backgroundImage: data?.backgroundImage || null,
    maxUsers: Number(data?.maxUsers) || 5,
    status: data?.status || "active",
    createdAt: new Date().toISOString(),
    expiresAt: data?.expiresAt || null,
    primaryColor: data?.primaryColor || "#6366f1",
    adminEmail,
    appCode: String(data?.appCode || "").toUpperCase().replace(/[^A-Z0-9]/g, ""),
    userCount: 1,
    leadCount: 0,
  });

  const userRef = tenantRef.collection("users").doc("admin_initial");

  let authUser;
  try {
    authUser = await admin.auth().createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: "Admin",
    });
  } catch (err) {
    // Firma dokumani yalniz kalmasin.
    await tenantRef.delete();
    if (err.code === "auth/email-already-exists") {
      throw new functions.https.HttpsError("already-exists", "Bu e-posta zaten kayıtlı.");
    }
    throw new functions.https.HttpsError("internal", err.message);
  }

  await admin.auth().setCustomUserClaims(authUser.uid, {
    tenantSlug: slug,
    userId: userRef.id,
    level: 5,
  });

  await userRef.set({
    name: "Admin",
    email: adminEmail,
    role: "Admin",
    level: 5,
    status: "active",
    languages: [],
    authUid: authUser.uid,
    createdAt: new Date().toISOString(),
  });

  return { ok: true, slug, authUid: authUser.uid };
});
