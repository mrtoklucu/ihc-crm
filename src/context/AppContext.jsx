import React, { createContext, useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, query, orderBy, limit as firestoreLimit, increment, where } from 'firebase/firestore';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorageKey, isTenantUserLimitReached } from '../utils/tenantUtils';

export const AppContext = createContext();

// Yukleme sinirlari storage.rules ile ayni tutulmalidir.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const validateUpload = (file) => {
  const type = file.type || '';
  if (!type.startsWith('image/') && type !== 'application/pdf') {
    throw new Error('Yalnizca gorsel veya PDF yukleyebilirsiniz.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Dosya boyutu 10 MB sinirini asiyor.');
  }
};

// Ayni isimli dosyalarin birbirini ezmemesi icin zaman damgasi eklenir.
const buildUploadPath = (folder, originalName) => {
  const safeName = originalName.replace(/[^A-Za-z0-9._-]+/g, '_');
  return `${folder}/${Date.now()}_${safeName}`;
};


export const AppProvider = ({ children, tenantSlug, tenantConfig }) => {
  const [loading, setLoading] = useState(true);
  // Oturum Firebase Authentication tarafindan tutuluyor. localStorage'a
  // yazilan eski oturum artik yetki kaynagi degil; yalnizca sayfa yenilenirken
  // profil bilgisi hazir dursun diye onbellek olarak kullaniliyor ve
  // onAuthStateChanged gecerli oturumu dogrulayana kadar gecicidir.
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(`tenant_${tenantSlug}_current_user`);
    return saved ? JSON.parse(saved) : null;
  });
  const [authReady, setAuthReady] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);
  
  const [currentTenantConfig, setCurrentTenantConfig] = useState(tenantConfig);
  const [users, setUsers] = useState([]);
  const [billingWarning, setBillingWarning] = useState(false);
  const [leads, setLeads] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tickets, setTickets] = useState([]);
  
  // Keep config in sync if prop changes
  useEffect(() => {
    setCurrentTenantConfig(tenantConfig);
  }, [tenantConfig]);
  
  const initialRoles = [
    { level: 1, name: 'Misafir', permissions: { viewDashboard: false, viewLeads: false, addLead: false, editLead: false, assignLead: false, exportExcel: false, manageUsers: false, viewLogs: false, editProfile: false } },
    { level: 2, name: 'Satış Danışmanı', permissions: { viewDashboard: false, viewLeads: true, addLead: false, editLead: true, assignLead: false, exportExcel: false, manageUsers: false, viewLogs: false, editProfile: true } },
    { level: 3, name: 'Uzman', permissions: { viewDashboard: false, viewLeads: true, addLead: false, editLead: true, assignLead: false, exportExcel: false, manageUsers: false, viewLogs: false, editProfile: true } },
    { level: 4, name: 'Genel Koordinatör', permissions: { viewDashboard: true, viewLeads: true, addLead: true, editLead: true, assignLead: true, deleteLead: true, exportExcel: true, manageUsers: false, viewLogs: false, editProfile: true } },
    { level: 5, name: 'Admin', permissions: { viewDashboard: true, viewLeads: true, addLead: true, editLead: true, assignLead: true, deleteLead: true, exportExcel: true, manageUsers: true, viewLogs: true, editProfile: true } },
  ];

  const [roles, setRoles] = useState(initialRoles);

  // Firestore'dan verileri çek (Tenant bazlı subcollections)
  //
  // Yalnizca giris yapildiktan sonra calisir: guvenlik kurallari artik kimlik
  // dogrulamasi istiyor, ayrica giris ekraninda beklerken 6.800+ leadin
  // cekilmesinin de anlami yoktu.
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const tenantRef = doc(db, 'tenants', tenantSlug);
        
        // Users
        const usersSnap = await getDocs(collection(tenantRef, 'users'));
        const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Not: Varsayilan yonetici burada olusturulmuyor. Kullanicinin artik bir
        // Firebase Authentication hesabi olmasi gerekiyor ve bunu istemci acamaz;
        // ilk yonetici firma olusturulurken sunucuda aciliyor
        // (functions/user_admin.js -> provisionTenant).
        setUsers(usersList);

        // Sync count with Super Admin metadata if mismatch exists
        const currentMetadata = await getDoc(tenantRef);
        if (currentMetadata.exists() && currentMetadata.data().userCount !== usersList.length) {
          await updateDoc(tenantRef, { userCount: usersList.length });
          console.log("Kullanıcı sayısı senkronize edildi:", usersList.length);
        }

        // Leads
        const leadsSnap = await getDocs(collection(tenantRef, 'leads'));
        setLeads(leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Logs (Son 100)
        const logsRef = collection(tenantRef, 'logs');
        const logsQuery = query(logsRef, orderBy('date', 'desc'), firestoreLimit(100));
        const logsSnap = await getDocs(logsQuery);
        setLogs(logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Roles (Özel roller varsa getireceğiz, yoksa default)
        const rolesSnap = await getDoc(doc(tenantRef, 'config', 'roles'));
        if (rolesSnap.exists()) {
          setRoles(rolesSnap.data().roles);
        }

        // Support Tickets (Root collection filtered by tenant)
        const qTickets = query(collection(db, 'support_tickets'), where('tenantSlug', '==', tenantSlug));
        const ticketsSnap = await getDocs(qTickets);
        setTickets(ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));

        // Subscription Check (30+7 or 365+7 enforcement)
        if (tenantConfig.subscriptionEndDate) {
          const subEndDate = new Date(tenantConfig.subscriptionEndDate);
          const graceEndDate = new Date(tenantConfig.graceEndDate || subEndDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          const now = new Date();

          if (now > graceEndDate) {
            // Total expiration + grace over -> Auto suspend
            await updateDoc(tenantRef, { status: 'suspended' });
            // Let the main.jsx Gateway handle the suspended UI on next check or reload
          } else if (now > subEndDate) {
            // Inside +7 day grace period
            setBillingWarning(true);
          }
        }

      } catch (err) {
        console.error("Veri çekme hatası:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Bagimlilik nesnenin kendisi degil kimligi: profil her guncellendiginde
    // butun leadlerin yeniden cekilmesini istemiyoruz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, currentUser?.id]);

  /**
   * Firebase oturumu degistiginde kullanici profilini cozer.
   *
   * Profil, tokendaki tenantSlug/userId alanlarindan dogrudan okunur; boylece
   * tum kullanici listesini cekmeye gerek kalmaz. Pasiflestirilmis veya silinmis
   * hesaplarin oturumu burada da kapatilir - eskiden bu kontrol yalnizca giris
   * aninda yapildigi icin acik kalan oturumlar erisime devam edebiliyordu.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setAuthReady(true);
        return;
      }

      try {
        const token = await firebaseUser.getIdTokenResult();
        const claimTenant = token.claims.tenantSlug;
        const claimUserId = token.claims.userId;

        // Baska bir firmanin hesabiyla bu panele girilemez.
        if (!claimTenant || !claimUserId || (tenantSlug && claimTenant !== tenantSlug)) {
          await signOut(auth);
          setCurrentUser(null);
          setAuthReady(true);
          return;
        }

        const snap = await getDoc(doc(db, 'tenants', claimTenant, 'users', claimUserId));
        if (!snap.exists()) {
          await signOut(auth);
          setCurrentUser(null);
          setAuthReady(true);
          return;
        }

        const profile = { id: snap.id, ...snap.data() };
        setEmailVerified(firebaseUser.emailVerified);

        // Dogrulama durumu kullanici dokumanina da yazilir; yoneticiler
        // Kullanicilar sayfasindan kimin adresinin dogrulanmadigini gorebilsin.
        if (profile.emailVerified !== firebaseUser.emailVerified) {
          updateDoc(snap.ref, { emailVerified: firebaseUser.emailVerified }).catch(() => {});
        }

        if (profile.status === 'passive') {
          await signOut(auth);
          setCurrentUser(null);
          setAuthReady(true);
          alert("Hesabınız pasif durumdadır. Lütfen yöneticinizle iletişime geçin.");
          return;
        }

        setCurrentUser(profile);
      } catch (err) {
        console.error("Oturum cozulemedi:", err);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [tenantSlug]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`tenant_${tenantSlug}_current_user`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`tenant_${tenantSlug}_current_user`);
    }
  }, [currentUser, tenantSlug]);

  /**
   * Tek bir leadi Firestore'tan cekip listeye katar.
   *
   * Lead listesi yalnizca acilista bir kez cekiliyor; bildirime tiklanarak
   * acilan yeni lead bellekte olmadigi icin detay sayfasi bos kaliyordu.
   * Zaten listedeyse istek yapilmaz.
   */
  const fetchLeadById = async (leadId) => {
    if (!leadId || !tenantSlug) return null;
    if (leads.some(l => String(l.id) === String(leadId))) return null;

    try {
      const snap = await getDoc(doc(db, 'tenants', tenantSlug, 'leads', String(leadId)));
      if (!snap.exists()) return null;

      const fetched = { id: snap.id, ...snap.data() };
      setLeads(prev =>
        prev.some(l => String(l.id) === String(fetched.id)) ? prev : [fetched, ...prev]
      );
      return fetched;
    } catch (err) {
      console.error("Lead cekilemedi:", err);
      return null;
    }
  };

  /**
   * Giris artik Firebase Authentication uzerinden yapiliyor.
   *
   * Onceden sifre tarayicida Firestore'tan cekilen kullanici listesiyle
   * karsilastiriliyordu; bu, sifrelerin duz metin durmasini ve veritabaninin
   * herkese acik kalmasini zorunlu kiliyordu. Artik sifreyi Firebase dogruluyor,
   * kullanicinin tenant ve yetki bilgisi de token icindeki ozel alanlardan
   * geliyor; guvenlik kurallari bunlara guvenebiliyor.
   *
   * E-posta adresleri harf duyarli degildir; mobil klavyeler ilk harfi buyutup
   * sonuna bosluk ekleyebildigi icin normallestiriliyor.
   */
  const login = async (email, password) => {
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
      addLog('Sistem Girişi', `${normalizedEmail} başarıyla giriş yaptı.`);
      return true;
    } catch (err) {
      console.error("Giris hatasi:", err.code || err.message);
      return false;
    }
  };

  /** Giris yapmis kullaniciya dogrulama e-postasi gonderir. */
  const sendVerificationEmail = async () => {
    if (!auth.currentUser) return false;
    try {
      await sendEmailVerification(auth.currentUser);
      return true;
    } catch (err) {
      console.error("Dogrulama e-postasi gonderilemedi:", err);
      return false;
    }
  };

  const logout = async () => {
    if (currentUser) {
      addLog('Sistem Çıkışı', `${currentUser.name} sistemden çıkış yaptı.`);
    }
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Cikis hatasi:", err);
    }
    setCurrentUser(null);
  };

  const addLog = async (action, detail) => {
    const newLog = {
      date: new Date().toISOString(),
      user: currentUser ? currentUser.name : 'Sistem',
      action,
      detail
    };
    try {
      const tenantRef = doc(db, 'tenants', tenantSlug);
      const docRef = await addDoc(collection(tenantRef, 'logs'), newLog);
      setLogs(prev => [{ id: docRef.id, ...newLog }, ...prev].slice(0, 1000));
    } catch (err) {
      console.error("Log kaydetme hatası", err);
    }
  };

  const addLead = async (lead) => {
    const newLead = { 
      ...lead, 
      assigneeId: null, 
      createdAt: new Date().toISOString(),
      status: 'Havuzda',
      history: [{ date: new Date().toISOString(), note: 'Lead havuzuna düştü.', status: 'Havuzda', author: currentUser ? currentUser.name : 'Sistem' }]
    };

    try {
      const tenantRef = doc(db, 'tenants', tenantSlug);
      const docRef = await addDoc(collection(tenantRef, 'leads'), newLead);
      
      // Tenant sayacını artır (İleride daha performanslı count için)
      await updateDoc(tenantRef, { leadCount: increment(1) });
      
      setLeads(prev => [...prev, { id: docRef.id, ...newLead }]);
      addLog('Yeni Lead', `${newLead.nameSurname} isimli lead eklendi.`);
      return true;
    } catch (err) {
      alert("Hata oluştu: " + err.message);
      return false;
    }
  };

  /**
   * Yeni kullanici ekler.
   *
   * Kullanici olusturmak artik Auth hesabi da gerektiriyor; bunu istemci
   * yapamaz (baskasinin hesabini acamaz), bu yuzden sunucudaki fonksiyona
   * devrediliyor. Lisans siniri da orada dogrulaniyor.
   */
  /**
   * Lead durumlarinin olumlu/notr/olumsuz eslesmesini kaydeder.
   * Firma dokumaninda saklanir, boylece tum kullanicilar ayni renkleri gorur.
   */
  const updateStatusCategories = async (categories) => {
    try {
      await updateDoc(doc(db, 'tenants', tenantSlug), { statusCategories: categories });
      setCurrentTenantConfig(prev => ({ ...prev, statusCategories: categories }));
      addLog('Ayar Değişikliği', 'Lead durum kategorileri güncellendi.');
      return true;
    } catch (err) {
      console.error("Durum kategorileri kaydedilemedi:", err);
      return false;
    }
  };

  const addUser = async (userData) => {
    const roleDef = roles.find(r => r.name === userData.role);

    try {
      const createUser = httpsCallable(getFunctions(undefined, 'europe-west3'), 'createTenantUser');
      const res = await createUser({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        level: roleDef ? roleDef.level : 1,
        languages: userData.languages || [],
      });

      const created = {
        id: res.data.userId,
        name: userData.name,
        email: String(userData.email || '').trim().toLowerCase(),
        role: userData.role,
        level: roleDef ? roleDef.level : 1,
        languages: userData.languages || [],
        status: 'active',
        authUid: res.data.authUid,
        createdAt: new Date().toISOString(),
      };
      setUsers(prev => [...prev, created]);
      addLog('Kullanıcı Ekleme', `${created.name} (${created.role}) sisteme eklendi.`);
      return true;
    } catch (err) {
      alert("Hata oluştu: " + (err.message || err));
      return false;
    }
  };

  const updateLeadHistory = async (leadId, note, status) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newHistory = [...(lead.history || []), { 
      date: new Date().toISOString(), 
      note, 
      status: status || lead.status,
      author: currentUser ? currentUser.name : 'Sistem'
    }];

    try {
      const tenantRef = doc(db, 'tenants', tenantSlug);
      const leadRef = doc(tenantRef, 'leads', leadId);
      await updateDoc(leadRef, {
        status: status || lead.status,
        history: newHistory
      });
      
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: status || l.status, history: newHistory } : l));
      addLog('Lead Güncelleme', `${lead.nameSurname} için not/durum güncellendi.`);
    } catch (err) {
      console.error("Lead geçmişi güncelleme hatası", err);
    }
  };

  const updateLeadData = async (leadId, updatedData) => {
    try {
      const tenantRef = doc(db, 'tenants', tenantSlug);
      const leadRef = doc(tenantRef, 'leads', String(leadId));
      const updatePayload = { ...updatedData, updatedAt: new Date().toISOString() };
      await updateDoc(leadRef, updatePayload);
      
      setLeads(prev => prev.map(l => String(l.id) === String(leadId) ? { ...l, ...updatePayload } : l));
      addLog('Lead Düzenleme', `Lead ana detayları güncellendi.`);
      return true;
    } catch (err) {
      console.error("Lead data güncelleme hatası", err);
      return false;
    }
  };

  /**
   * Kullanici gunceller.
   *
   * Sifre ve yetki/durum degisiklikleri Auth tarafini da ilgilendirdigi icin
   * sunucudaki fonksiyonlara devredilir: sifre Firestore'a yazilsa bile giris
   * sifresini degistirmez, seviye ise tokendaki ozel alanda tutulur.
   */
  const updateUser = async (userId, updatedData) => {
    try {
      const fns = getFunctions(undefined, 'europe-west3');

      // Sifre alani asla Firestore'a yazilmaz.
      const { password, ...firestoreData } = updatedData;
      if (password) {
        await httpsCallable(fns, 'setUserPassword')({
          targetUserId: String(userId),
          newPassword: password,
        });
      }
      updatedData = firestoreData;

      const tenantRef = doc(db, 'tenants', tenantSlug);
      const userRef = doc(tenantRef, 'users', String(userId));
      const oldUser = users.find(u => String(u.id) === String(userId));
      
      // Durum değişimi kontrolü (Pasif -> Aktif limit kontrolü)
      if (updatedData.status === 'active' && oldUser?.status === 'passive') {
        const maxUsers = Number(tenantConfig?.maxUsers) || 5;
        const activeUsersCount = users.filter(u => u.status !== 'passive').length;
        if (activeUsersCount >= maxUsers) {
          alert(`Maksimum aktif kullanıcı limitine (${maxUsers}) ulaşıldı! Bir kullanıcıyı aktifleştirmek için önce başkasını pasife almalısınız.`);
          return false;
        }
        await updateDoc(tenantRef, { userCount: increment(1) });
      } else if (updatedData.status === 'passive' && oldUser?.status === 'active') {
        await updateDoc(tenantRef, { userCount: increment(-1) });
      }

      await updateDoc(userRef, updatedData);
      
      if (currentUser && String(currentUser.id) === String(userId)) {
        setCurrentUser(prev => ({ ...prev, ...updatedData }));
      }
      
      setUsers(prev => prev.map(u => String(u.id) === String(userId) ? { ...u, ...updatedData } : u));

      // Seviye veya durum degistiyse Auth tarafindaki yetki alanlarini esitle.
      if (updatedData.level !== undefined || updatedData.status !== undefined) {
        try {
          await httpsCallable(getFunctions(undefined, 'europe-west3'), 'syncUserAccount')({
            targetUserId: String(userId),
          });
        } catch (err) {
          console.error("Yetki esitlenemedi:", err);
        }
      }

      return true;
    } catch (err) {
      console.error("Kullanıcı güncelleme hatası", err);
      alert("Kullanıcı güncellenemedi: " + (err.message || err));
      return false;
    }
  };

  const assignLead = async (leadId, userId) => {
    // ... assign lead logic (no changes) ...
    const assignee = users.find(u => u.id === userId);
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newHistory = [...(lead.history || []), {
      date: new Date().toISOString(),
      note: `Lead ${assignee ? assignee.name : 'birine'} atandı.`,
      status: lead.status,
      author: currentUser ? currentUser.name : 'Sistem'
    }];

    try {
      const tenantRef = doc(db, 'tenants', tenantSlug);
      const leadRef = doc(tenantRef, 'leads', leadId);
      
      const newStatus = lead.status === 'Havuzda' ? 'Aranmayı Bekliyor' : lead.status;
      
      await updateDoc(leadRef, {
        assigneeId: userId,
        status: newStatus,
        history: newHistory
      });
      
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assigneeId: userId, status: newStatus, history: newHistory } : l));
    } catch (err) {
      console.error("Atama hatası", err);
    }
  };

  const deleteLead = async (leadId) => {
    try {
      const tenantRef = doc(db, 'tenants', tenantSlug);
      const leadRef = doc(tenantRef, 'leads', leadId);
      await deleteDoc(leadRef);
      await updateDoc(tenantRef, { leadCount: increment(-1) });
      setLeads(prev => prev.filter(l => l.id !== leadId));
      addLog('Lead Silme', `Bir lead sistemden silindi.`);
      return true;
    } catch (err) {
      console.error("Lead silme hatası", err);
      return false;
    }
  };

  // Firebase Storage'a tenant klasoru altina yukler.
  // Donen sekil ticket eklerinin ve lead galerisinin bekledigi bicimdir:
  // { url, name, isImage, ... }
  const uploadFile = async (file) => {
    if (!file) return null;
    validateUpload(file);

    const path = buildUploadPath(`tenants/${tenantSlug}/uploads`, file.name);
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file, { contentType: file.type });
    const url = await getDownloadURL(fileRef);

    return {
      url,
      path,
      name: file.name,
      size: file.size,
      type: file.type,
      isImage: (file.type || '').startsWith('image/'),
      uploadedAt: new Date().toISOString()
    };
  };

  const addTicket = async (subject, text, category, file = null) => {
    let attachment = null;
    if (file) {
      try {
        attachment = await uploadFile(file);
      } catch (err) {
        console.error("Ticket oluşturulurken dosya yükleme hatası:", err);
        if (!confirm("Dosya yüklenemedi. Bilet yine de dosyası olmadan oluşturulsun mu?")) {
          return false;
        }
      }
    }

    const newTicket = {
      tenantSlug,
      tenantName: tenantConfig?.name || 'Bilinmeyen Firma',
      subject,
      category: category || 'Genel',
      status: 'Açık',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: Date.now().toString(),
          sender: currentUser?.name || 'Kullanıcı',
          senderType: 'user',
          text,
          attachment,
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      const docRef = await addDoc(collection(db, 'support_tickets'), newTicket);
      setTickets(prev => [{ id: docRef.id, ...newTicket }, ...prev]);
      return true;
    } catch (err) {
      console.error("Ticket oluşturma hatası:", err);
      return false;
    }
  };

  const addTicketReply = async (ticketId, text, file = null) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return false;

    let attachment = null;
    if (file) {
      try {
        attachment = await uploadFile(file);
      } catch (err) {
        console.error("Ticket yanıtı dosya yükleme hatası:", err);
        // We continue without attachment or could alert user.
        // For now, let's keep it robust and try to send the text at least.
        if (!confirm("Dosya yüklenemedi. Yanıtınız dosyası olmadan gönderilsin mi?")) {
          return false;
        }
      }
    }

    const newMessage = {
      id: Date.now().toString(),
      sender: currentUser?.name || 'Kullanıcı',
      senderType: 'user',
      text,
      attachment,
      timestamp: new Date().toISOString()
    };

    try {
      const ticketRef = doc(db, 'support_tickets', ticketId);
      await updateDoc(ticketRef, {
        messages: [...(ticket.messages || []), newMessage],
        status: 'Açık', // user replied, status goes back to open
        updatedAt: new Date().toISOString()
      });

      setTickets(prev => prev.map(t => 
        t.id === ticketId 
          ? { ...t, status: 'Açık', updatedAt: new Date().toISOString(), messages: [...(t.messages || []), newMessage] } 
          : t
      ));
      return true;
    } catch (err) {
      console.error("Ticket yanıtlama hatası:", err);
      return false;
    }
  };

  const updateTenantConfig = async (newConfig) => {
    try {
      const tenantRef = doc(db, 'tenants', tenantSlug);
      await updateDoc(tenantRef, newConfig);
      setCurrentTenantConfig(prev => ({ ...prev, ...newConfig }));
      addLog('Sistem Güncelleme', `Firma ayarları güncellendi.`);
      return true;
    } catch (err) {
      console.error("Firma güncelleme hatası", err);
      return false;
    }
  };

  const checkPermission = (permKey) => {
    if (!currentUser) return false;
    const role = roles.find(r => r.level === currentUser.level);
    return role?.permissions?.[permKey] || false;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f111a', color: 'white' }}>
        <div className="admin-login-spinner" style={{ width: '40px', height: '40px', borderColor: 'rgba(99, 102, 241, 0.3)', borderTopColor: '#6366f1' }}></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      currentUser, authReady, emailVerified, sendVerificationEmail, users, leads, roles, logs, tickets,
      tenantSlug, tenantConfig: currentTenantConfig,
      billingWarning,
      login, logout, addLead, deleteLead, assignLead, addUser, addLeadHistory: updateLeadHistory, updateLeadData, updateUser, addLog, checkPermission,
      fetchLeadById,
      updateTenantConfig, updateStatusCategories,
      addTicket, addTicketReply, uploadFile
    }}>
      {children}
    </AppContext.Provider>
  );
};

