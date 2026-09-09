const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });
const express = require("express");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors);
app.use(express.json());

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "zbtcrm_meta_v2026";

/**
 * Meta Webhook Verification (GET)
 */
app.get("/v1/webhooks/meta/:tenantSlug", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified by Meta!");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

/**
 * Meta Webhook Notification (POST)
 */
app.post("/v1/webhooks/meta/:tenantSlug", async (req, res) => {
  const { tenantSlug } = req.params;
  const body = req.body;

  console.log(`Incoming lead notification for tenant: ${tenantSlug}`);

  if (body.object !== "page") {
      return res.sendStatus(404);
  }

  try {
    // 1. Get Tenant Token from Firestore
    const tenantDoc = await db.collection("tenants").doc(tenantSlug).get();
    if (!tenantDoc.exists) {
        console.error(`Tenant ${tenantSlug} not found in DB.`);
        return res.sendStatus(404);
    }
    
    const token = tenantDoc.data().integrations?.facebook?.token;
    if (!token) {
        console.error(`Token not found for tenant: ${tenantSlug}`);
        return res.sendStatus(400);
    }

    // 2. Process changes
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field === "leadgen") {
          const { leadgen_id } = change.value;
          
          // 3. Fetch lead details from Graph API
          const leadRes = await axios.get(`https://graph.facebook.com/v18.0/${leadgen_id}?access_token=${token}`);
          const leadData = leadRes.data;

          // 4. Transform field_data to CRM format
          const fieldMap = {};
          leadData.field_data.forEach(field => {
             fieldMap[field.name] = field.values[0];
          });

          const newLead = {
            nameSurname: fieldMap["full_name"] || fieldMap["first_name"] + " " + (fieldMap["last_name"] || ""),
            email: fieldMap["email"] || "",
            phone: fieldMap["phone_number"] || fieldMap["phone"] || "",
            source: "Facebook Lead Ads",
            createdVia: "meta",
            assigneeId: null,
            status: "Havuzda",
            createdAt: new Date().toISOString(),
            metaInfo: {
                leadId: leadgen_id,
                adId: leadData.ad_id,
                adName: leadData.ad_name,
                formId: leadData.form_id,
                pageId: leadData.page_id
            },
            history: [{
                date: new Date().toISOString(),
                note: `Facebook (${leadData.ad_name || 'Reklam'}) üzerinden otomatik olarak eklendi.`,
                status: "Havuzda",
                author: "Sistem"
            }]
          };

          // 5. Save to Firestore sub-collection
          await db.collection("tenants").doc(tenantSlug).collection("leads").add(newLead);
          
          // Increment counter
          await db.collection("tenants").doc(tenantSlug).update({ 
              leadCount: admin.firestore.FieldValue.increment(1) 
          });

          console.log(`Lead saved successfully for ${tenantSlug}: ${newLead.nameSurname}`);
        }
      }
    }

    return res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    return res.sendStatus(500);
  }
});

/**
 * Global Web API - harici web sitesi formlarindan lead alir.
 *
 * POST /v1/leads/webform/:tenantSlug
 * Govde: { nameSurname, phone, email, source, note, country, language }
 *
 * Firma isteğe bagli olarak bir API anahtari tanimlayabilir
 * (tenants/{slug}.integrations.webform.apiKey). Tanimliysa istegin
 * x-api-key basligini tasimasi zorunludur; tanimli degilse endpoint aciktir.
 */
app.post("/v1/leads/webform/:tenantSlug", async (req, res) => {
  const { tenantSlug } = req.params;
  const body = req.body || {};

  try {
    const tenantRef = db.collection("tenants").doc(tenantSlug);
    const tenantDoc = await tenantRef.get();

    if (!tenantDoc.exists) {
      return res.status(404).json({ ok: false, error: "Firma bulunamadi." });
    }

    const tenant = tenantDoc.data();
    if (tenant.status === "suspended") {
      return res.status(403).json({ ok: false, error: "Firma askiya alinmis." });
    }

    // Firma bir anahtar tanimladiysa dogrula.
    const expectedKey = tenant.integrations && tenant.integrations.webform
      ? tenant.integrations.webform.apiKey
      : null;
    if (expectedKey && req.get("x-api-key") !== expectedKey) {
      return res.status(401).json({ ok: false, error: "Gecersiz API anahtari." });
    }

    // En az bir iletisim bilgisi olmadan lead anlamsiz.
    const nameSurname = (body.nameSurname || body.name || "").toString().trim();
    const phone = (body.phone || "").toString().trim();
    const email = (body.email || "").toString().trim();

    if (!phone && !email) {
      return res.status(400).json({
        ok: false,
        error: "phone veya email alanlarindan en az biri zorunludur."
      });
    }

    const now = new Date().toISOString();
    const note = (body.note || "").toString().trim();

    // Sekil, panelden eklenen leadlerle birebir ayni olmali ki
    // liste ve filtreler ayni sekilde calissin.
    const newLead = {
      nameSurname: nameSurname || "Isimsiz Basvuru",
      phone,
      email,
      country: (body.country || "").toString().trim(),
      language: (body.language || "").toString().trim(),
      source: (body.source || "Web Site").toString().trim(),
      createdVia: "webform",
      note,
      assigneeId: null,
      status: "Havuzda",
      createdAt: now,
      history: [{
        date: now,
        note: note
          ? `Web API uzerinden geldi: ${note}`
          : "Web API uzerinden otomatik olarak eklendi.",
        status: "Havuzda",
        author: "Sistem"
      }]
    };

    const docRef = await tenantRef.collection("leads").add(newLead);
    await tenantRef.update({
      leadCount: admin.firestore.FieldValue.increment(1)
    });

    console.log(`Web API lead saved for ${tenantSlug}: ${newLead.nameSurname}`);
    return res.status(201).json({ ok: true, leadId: docRef.id });
  } catch (error) {
    console.error("Web API lead error:", error.message);
    return res.status(500).json({ ok: false, error: "Lead kaydedilemedi." });
  }
});

exports.api = functions.region("europe-west3").https.onRequest(app);


/* ============================================================
 * OTOMATIK LEAD ATAMA
 * ============================================================
 * Yeni lead olusturuldugunda, lead'in dilini konusan satis
 * danismanlari arasindan birine otomatik atar.
 *
 * Tetikleyici olarak yazilmasinin sebebi: lead uc ayri kaynaktan
 * gelebiliyor (panel, Web API, Facebook). Tetikleyici hepsini tek
 * noktadan yakalar, mantik kopyalanmak zorunda kalmaz.
 *
 * Yalnizca entegrasyon kaynakli leadler atanir (createdVia alani
 * webform veya meta ise). Panelden elle eklenenler havuzda kalir.
 */

// Ulke kodundan konusulan dil(ler). Sirali: ilk eslesen kazanir.
// Ulkenin resmi dili sistemde tanimli degilse pratik bir yedek dil eklenir.
const COUNTRY_LANGUAGES = {
  tr: ["Türkçe"],
  az: ["Türkçe", "Rusça"],
  us: ["İngilizce"],
  gb: ["İngilizce"],
  de: ["Almanca"],
  at: ["Almanca"],
  ch: ["Almanca", "Fransızca", "İtalyanca"],
  fr: ["Fransızca"],
  be: ["Hollandaca", "Fransızca"],
  nl: ["Hollandaca"],
  es: ["İspanyolca"],
  it: ["İtalyanca"],
  ru: ["Rusça"],
  ae: ["Arapça", "İngilizce"],
  sa: ["Arapça"],
  kw: ["Arapça"],
  qa: ["Arapça"],
  ro: ["Rumence"],
  bg: ["Bulgarca"],
  se: ["İngilizce"],
  no: ["İngilizce"],
  dk: ["İngilizce"],
  pt: ["İngilizce"],
  br: ["İspanyolca", "İngilizce"],
  gr: ["İngilizce"],
};

// Telefon on ekinden ulke kodu. phoneUtils.js ile ayni tutulmalidir.
const PHONE_PREFIXES = {
  "+90": "tr", "+994": "az", "+1": "us", "+44": "gb", "+49": "de",
  "+43": "at", "+41": "ch", "+33": "fr", "+32": "be", "+31": "nl",
  "+34": "es", "+39": "it", "+7": "ru", "+971": "ae", "+966": "sa",
  "+965": "kw", "+974": "qa", "+40": "ro", "+359": "bg", "+46": "se",
  "+47": "no", "+45": "dk", "+351": "pt", "+55": "br", "+30": "gr",
};

const countryFromPhone = (phone) => {
  if (!phone) return null;
  const normalized = phone.replace(/[\s()-]/g, "");
  // Uzun on ekler once denenmeli, yoksa +9 gibi kisa eslesmeler yanlis sonuc verir.
  const prefixes = Object.keys(PHONE_PREFIXES).sort((a, b) => b.length - a.length);
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) return PHONE_PREFIXES[prefix];
  }
  return null;
};

/**
 * Lead icin aday dilleri sirali olarak dondurur.
 * Once acikca girilmis dil, sonra telefondan/ulkeden cikarilan diller.
 */
const candidateLanguages = (lead) => {
  const candidates = [];
  if (lead.language && lead.language !== "Diğer") candidates.push(lead.language);

  const code = lead.countryCode || countryFromPhone(lead.phone);
  if (code && COUNTRY_LANGUAGES[code]) {
    for (const lang of COUNTRY_LANGUAGES[code]) {
      if (!candidates.includes(lang)) candidates.push(lang);
    }
  }
  return candidates;
};

/** Lead almaya uygun danismanlar: pasif olmayan ve dili tanimli herkes. */
const eligibleUsers = (users, language) =>
  users.filter(
    (u) =>
      u.status !== "passive" &&
      Array.isArray(u.languages) &&
      u.languages.includes(language)
  );

/** Danismanin uzerindeki kapanmamis lead sayisi. */
const openLeadCount = (leads, userId) =>
  leads.filter(
    (l) => String(l.assigneeId) === String(userId) && l.status !== "Satış Yapıldı"
  ).length;

const pickAssignee = (candidates, leads, strategy, lastAssignedId) => {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  if (strategy === "random") {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  if (strategy === "round-robin") {
    // Son atanan kisiden sonraki siradaki kisiye gec.
    const sorted = [...candidates].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const lastIndex = sorted.findIndex((u) => String(u.id) === String(lastAssignedId));
    return sorted[(lastIndex + 1) % sorted.length];
  }

  // Varsayilan: en az yuklu olan.
  return candidates.reduce((best, user) =>
    openLeadCount(leads, user.id) < openLeadCount(leads, best.id) ? user : best
  );
};

exports.autoAssignLead = functions
  .region("europe-west3")
  .firestore.document("tenants/{tenantSlug}/leads/{leadId}")
  .onCreate(async (snap, context) => {
    const lead = snap.data();
    const { tenantSlug, leadId } = context.params;

    // Yalnizca entegrasyon kaynakli leadler otomatik atanir.
    if (lead.createdVia !== "webform" && lead.createdVia !== "meta") return null;
    if (lead.assigneeId) return null;

    const tenantRef = db.collection("tenants").doc(tenantSlug);

    try {
      const tenantDoc = await tenantRef.get();
      if (!tenantDoc.exists) return null;

      const config = tenantDoc.data().autoAssign || {};
      if (config.enabled === false) return null;

      const strategy = config.strategy || "least-loaded";

      const [usersSnap, leadsSnap] = await Promise.all([
        tenantRef.collection("users").get(),
        tenantRef.collection("leads").get(),
      ]);
      const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const leads = leadsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Dilleri sirayla dene; ilk eslesen dilde atama yap.
      let assignee = null;
      let matchedLanguage = null;
      for (const language of candidateLanguages(lead)) {
        const candidates = eligibleUsers(users, language);
        if (candidates.length > 0) {
          assignee = pickAssignee(candidates, leads, strategy, config.lastAssignedId);
          matchedLanguage = language;
          break;
        }
      }

      if (!assignee) {
        console.log(`Auto-assign: ${tenantSlug}/${leadId} icin uygun dil bulunamadi, havuzda kaldi.`);
        await tenantRef.collection("logs").add({
          date: new Date().toISOString(),
          user: "Sistem",
          action: "Otomatik Atama",
          detail: `${lead.nameSurname || "Lead"} icin uygun dili konusan danisman bulunamadi, havuzda bekliyor.`,
        });
        return null;
      }

      const now = new Date().toISOString();
      await snap.ref.update({
        assigneeId: assignee.id,
        status: "Aranmayı Bekliyor",
        autoAssigned: true,
        assignedLanguage: matchedLanguage,
        history: [
          ...(lead.history || []),
          {
            date: now,
            note: `Otomatik atama: ${matchedLanguage} bilen ${assignee.name} adli danismana yonlendirildi.`,
            status: "Aranmayı Bekliyor",
            author: "Sistem",
          },
        ],
      });

      // Round-robin sirasi icin son atanani sakla.
      await tenantRef.update({ "autoAssign.lastAssignedId": assignee.id });

      await tenantRef.collection("logs").add({
        date: now,
        user: "Sistem",
        action: "Otomatik Atama",
        detail: `${lead.nameSurname || "Lead"} -> ${assignee.name} (${matchedLanguage}, ${strategy})`,
      });

      console.log(`Auto-assign: ${tenantSlug}/${leadId} -> ${assignee.name} (${matchedLanguage})`);
      return null;
    } catch (error) {
      console.error("Auto-assign hatasi:", error.message);
      return null;
    }
  });

/* ============================================================
 * ANLIK BILDIRIMLER (Firebase Cloud Messaging)
 * ============================================================
 * Mobil uygulama acilista cihaz tokenini kullanicinin dokumanindaki
 * fcmTokens dizisine yazar (bkz. src/utils/pushNotifications.js).
 * Asagidaki tetikleyiciler yeni lead dustugunde o tokenlara bildirim
 * gonderir. Tarayicidan giren kullanicilara bildirim gitmez.
 */

// Gecersiz hale gelen tokenlari kullanicidan dusurur; aksi halde silinen
// uygulamalarin tokenlari birikir ve her gonderimde hata uretir.
const pruneTokens = async (tenantSlug, userId, tokens, response) => {
  const dead = [];
  response.responses.forEach((r, i) => {
    const code = r.error && r.error.code;
    if (
      code === "messaging/invalid-registration-token" ||
      code === "messaging/registration-token-not-registered"
    ) {
      dead.push(tokens[i]);
    }
  });
  if (dead.length === 0) return;
  await db
    .collection("tenants")
    .doc(tenantSlug)
    .collection("users")
    .doc(userId)
    .update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...dead),
    });
  console.log(`Bildirim: ${userId} icin ${dead.length} gecersiz token silindi.`);
};

const sendToUser = async (tenantSlug, user, title, body, data) => {
  const tokens = (user.fcmTokens || []).filter(Boolean);
  if (tokens.length === 0) return 0;

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
    android: {
      priority: "high",
      // Kanal adi verilmiyor: uygulamada olusturulmamis bir kanal belirtilirse
      // Android 8+ bildirimi hic gostermiyor. FCM kendi varsayilan kanalini kullanir.
      notification: { sound: "default" },
    },
  });

  await pruneTokens(tenantSlug, user.id, tokens, response);
  return response.successCount;
};

const leadNotificationBody = (lead) => {
  const parts = [];
  if (lead.nameSurname) parts.push(lead.nameSurname);
  if (lead.phone) parts.push(lead.phone);
  if (lead.country) parts.push(lead.country);
  return parts.length > 0 ? parts.join(" · ") : "Yeni bir kayit olusturuldu.";
};

const notifyLeadAssigned = async (tenantSlug, leadId, lead, assigneeId) => {
  const userRef = db
    .collection("tenants")
    .doc(tenantSlug)
    .collection("users")
    .doc(assigneeId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return;

  const user = { id: userDoc.id, ...userDoc.data() };
  const sent = await sendToUser(
    tenantSlug,
    user,
    "Yeni lead size atandi",
    leadNotificationBody(lead),
    { leadId, tenantSlug, type: "lead-assigned" }
  );
  console.log(`Bildirim: ${leadId} -> ${user.name} (${sent} cihaz)`);
};

// Havuza dusen (kimseye atanmamis) leadler icin yoneticileri uyarir.
const notifyPoolLead = async (tenantSlug, leadId, lead) => {
  const usersSnap = await db
    .collection("tenants")
    .doc(tenantSlug)
    .collection("users")
    .get();

  const managers = usersSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => Number(u.level) >= 4 && u.status !== "passive");

  await Promise.all(
    managers.map((u) =>
      sendToUser(
        tenantSlug,
        u,
        "Havuza yeni lead dustu",
        leadNotificationBody(lead),
        { leadId, tenantSlug, type: "lead-pool" }
      )
    )
  );
};

/**
 * Lead olusturuldugunda bildirim.
 *
 * Otomatik atama ayni anda calisiyor ve atamayi bir guncelleme olarak
 * yaziyor; o durumda bildirimi asagidaki onUpdate tetikleyicisi gonderir.
 * Burada yalnizca zaten atanmis olarak olusturulan leadler ve otomatik
 * atamanin devrede olmadigi havuz leadleri ele alinir.
 */
exports.notifyNewLead = functions
  .region("europe-west3")
  .firestore.document("tenants/{tenantSlug}/leads/{leadId}")
  .onCreate(async (snap, context) => {
    const lead = snap.data();
    const { tenantSlug, leadId } = context.params;

    try {
      if (lead.assigneeId) {
        await notifyLeadAssigned(tenantSlug, leadId, lead, lead.assigneeId);
        return null;
      }

      // Otomatik atama bu leadi birazdan atayacaksa bildirimi ona birakiyoruz.
      const willAutoAssign =
        lead.createdVia === "webform" || lead.createdVia === "meta";
      if (willAutoAssign) return null;

      await notifyPoolLead(tenantSlug, leadId, lead);
      return null;
    } catch (error) {
      console.error("Yeni lead bildirimi hatasi:", error.message);
      return null;
    }
  });

/** Lead bir danismana atandiginda (otomatik veya elle) bildirim. */
exports.notifyLeadAssignment = functions
  .region("europe-west3")
  .firestore.document("tenants/{tenantSlug}/leads/{leadId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { tenantSlug, leadId } = context.params;

    // Yalnizca atama degistiyse; diger alan guncellemeleri bildirim uretmez.
    if (before.assigneeId === after.assigneeId) return null;
    if (!after.assigneeId) return null;

    try {
      await notifyLeadAssigned(tenantSlug, leadId, after, after.assigneeId);
      return null;
    } catch (error) {
      console.error("Lead atama bildirimi hatasi:", error.message);
      return null;
    }
  });

/**
 * Aranmamis lead hatirlatmasi.
 *
 * Bir lead olusturulduktan 1 saat sonra hala "Aranmayi Bekliyor" durumundaysa
 * atandigi danismana hatirlatma gonderir.
 *
 * Iki koruma var:
 *  - Yalnizca son 24 saatte olusturulan leadler taranir. Eski CRM'den aktarilan
 *    6.879 kaydin 268'i "Aranmayi Bekliyor" durumunda; pencere olmasaydi ilk
 *    calismada hepsi icin bildirim giderdi.
 *  - Gonderim sonrasi lead'e reminderSentAt yazilir, ayni lead icin tekrar
 *    hatirlatma cikmaz.
 *
 * createdAt ISO metin olarak tutuluyor; ISO bicimi sozlukte de kronolojik
 * siralandigi icin metin araligi sorgusu dogru calisir ve bilesik dizin
 * gerektirmez.
 */
exports.remindStaleLeads = functions
  .region("europe-west3")
  .pubsub.schedule("every 15 minutes")
  .timeZone("Europe/Istanbul")
  .onRun(async () => {
    const now = Date.now();
    const olderThan = new Date(now - 60 * 60 * 1000).toISOString();
    const newerThan = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const tenantsSnap = await db.collection("tenants").get();

    for (const tenantDoc of tenantsSnap.docs) {
      const tenantSlug = tenantDoc.id;

      try {
        const leadsSnap = await tenantDoc.ref
          .collection("leads")
          .where("createdAt", ">=", newerThan)
          .where("createdAt", "<=", olderThan)
          .get();

        const stale = leadsSnap.docs.filter((d) => {
          const lead = d.data();
          return (
            lead.status === "Aranmayı Bekliyor" &&
            lead.assigneeId &&
            !lead.reminderSentAt
          );
        });

        if (stale.length === 0) continue;

        for (const leadDoc of stale) {
          const lead = leadDoc.data();
          const userDoc = await tenantDoc.ref
            .collection("users")
            .doc(lead.assigneeId)
            .get();
          if (!userDoc.exists) continue;

          await sendToUser(
            tenantSlug,
            { id: userDoc.id, ...userDoc.data() },
            "Aranmayi bekleyen lead var",
            `${leadNotificationBody(lead)} - 1 saattir aranmadi.`,
            { leadId: leadDoc.id, tenantSlug, type: "lead-reminder" }
          );

          await leadDoc.ref.update({ reminderSentAt: new Date().toISOString() });
        }

        console.log(
          `Hatirlatma: ${tenantSlug} icin ${stale.length} lead bildirildi.`
        );
      } catch (error) {
        console.error(`Hatirlatma hatasi (${tenantSlug}):`, error.message);
      }
    }

    return null;
  });


// Kullanici hesabi yonetimi (sifre, olusturma, yetki esitleme).
const userAdmin = require("./user_admin");
exports.setUserPassword = userAdmin.setUserPassword;
exports.createTenantUser = userAdmin.createTenantUser;
exports.syncUserAccount = userAdmin.syncUserAccount;
exports.provisionTenant = userAdmin.provisionTenant;
