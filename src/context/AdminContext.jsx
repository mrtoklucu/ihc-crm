import React, { createContext, useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDocs, updateDoc, addDoc, query, where, orderBy, onSnapshot, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAllTenants, createTenant, updateTenant, deleteTenant, getTenantLeadCount, getTenantUserCount } from '../utils/tenantUtils';

export const AdminContext = createContext();

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


export const AdminProvider = ({ children }) => {
  // Panele giris eskiden istemci paketine gomulu sabit sifrelerle yapiliyordu;
  // paket herkese acik oldugu icin bu sifreler de aciktaydi. Yetki artik
  // Firebase Authentication tokenindaki superAdmin alanindan geliyor ve
  // yalnizca sunucu tarafindan verilebiliyor.
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('zbt_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [adminLogs, setAdminLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem('zbt_admin_user', JSON.stringify(adminUser));
      refreshTenants();
      refreshAdminLogs();
      refreshAdminUsers();
    } else {
      localStorage.removeItem('zbt_admin_user');
      setLoadingTenants(false);
    }
  }, [adminUser]);

  const refreshTenants = async () => {
    setLoadingTenants(true);
    setLoadingTickets(true);
    try {
      console.log("AdminContext: Start refreshing data...");
      const data = await getAllTenants();
      setTenants(data);

      console.log("AdminContext: Loading support tickets...");
      const ticketsSnap = await getDocs(collection(db, 'support_tickets'));
      setSupportTickets(ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error("Veri getirme hatası", err);
    }
    setLoadingTenants(false);
    setLoadingTickets(false);
  };

  const refreshAdminLogs = async () => {
    setLoadingLogs(true);
    try {
      const logsSnap = await getDocs(query(collection(db, 'admin_logs'), orderBy('date', 'desc')));
      setAdminLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Admin log yükleme hatası:', err);
      // orderBy index yoksa indexsiz dene
      try {
        const logsSnap = await getDocs(collection(db, 'admin_logs'));
        const logs = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        logs.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAdminLogs(logs);
      } catch (e) {
        console.error('Admin log fallback hatası:', e);
      }
    }
    setLoadingLogs(false);
  };

  const refreshAdminUsers = async () => {
    setLoadingAdminUsers(true);
    try {
      const snap = await getDocs(collection(db, 'admin_users'));
      setAdminUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Admin user yükleme hatası:', err);
    }
    setLoadingAdminUsers(false);
  };

  const addAdminLog = async (action, detail, category = 'system') => {
    const logEntry = {
      action,
      detail,
      category,
      user: adminUser?.email || 'system',
      userName: adminUser?.name || 'Sistem',
      date: new Date().toISOString()
    };
    try {
      const docRef = await addDoc(collection(db, 'admin_logs'), logEntry);
      setAdminLogs(prev => [{ id: docRef.id, ...logEntry }, ...prev]);
    } catch (err) {
      console.error('Admin log ekleme hatası:', err);
    }
  };

  const clearAdminLogs = async () => {
    try {
      const logsSnap = await getDocs(collection(db, 'admin_logs'));
      const batch = writeBatch(db);
      logsSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setAdminLogs([]);
      return { success: true };
    } catch (err) {
      console.error('Admin log temizleme hatası:', err);
      return { success: false, error: err.message };
    }
  };

  const adminLogin = async (email, password) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const token = await cred.user.getIdTokenResult();

      // Panele yalnizca superAdmin yetkisi olan hesaplar girebilir.
      if (!token.claims.superAdmin) {
        await signOut(auth);
        return false;
      }

      const user = {
        email: normalizedEmail,
        name: cred.user.displayName || 'Süper Admin',
        role: 'superadmin',
        level: 3,
        uid: cred.user.uid,
      };
      setAdminUser(user);
      addAdminLog('Sistem Girişi', `${normalizedEmail} başarıyla giriş yaptı.`, 'login');
      return true;
    } catch (err) {
      console.error('Admin giris hatasi:', err.code || err.message);
      return false;
    }
  };

  const addAdminUser = async (userData) => {
    try {
      const cleanData = {
        ...userData,
        createdAt: new Date().toISOString(),
        level: userData.role === 'superadmin' ? 3 : userData.role === 'muhasebe' ? 2 : 1
      };
      const docRef = await addDoc(collection(db, 'admin_users'), cleanData);
      setAdminUsers(prev => [...prev, { id: docRef.id, ...cleanData }]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteAdminUser = async (id) => {
    try {
      await deleteDoc(doc(db, 'admin_users', id));
      setAdminUsers(prev => prev.filter(u => u.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const adminLogout = async () => {
    addAdminLog('Sistem Çıkışı', `${adminUser?.email || 'Bilinmeyen'} sistemden çıkış yaptı.`, 'login');
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Cikis hatasi:', err);
    }
    setAdminUser(null);
  };

  const addTenant = async (tenantData) => {
    try {
      const newTenant = await createTenant(tenantData);
      await refreshTenants();
      addAdminLog('Firma Ekleme', `Yeni firma oluşturuldu: ${tenantData.name} (${tenantData.slug})`, 'tenant');
      return { success: true, tenant: newTenant };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const editTenant = async (slug, updatedData) => {
    try {
      const updated = await updateTenant(slug, updatedData);
      await refreshTenants();
      addAdminLog('Firma Güncelleme', `Firma düzenlendi: ${slug}`, 'tenant');
      return { success: true, tenant: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const removeTenant = async (slug) => {
    try {
      await deleteTenant(slug);
      await refreshTenants();
      addAdminLog('Firma Silme', `Firma silindi: ${slug}`, 'tenant');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const toggleTenantStatus = async (slug) => {
    const tenant = tenants.find(t => t.slug === slug);
    if (tenant) {
      const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
      const result = await editTenant(slug, { status: newStatus });
      if (result.success) {
        addAdminLog(
          newStatus === 'suspended' ? 'Firma Askıya Alma' : 'Firma Aktifleştirme',
          `${tenant.name} firması ${newStatus === 'suspended' ? 'askıya alındı' : 'aktifleştirildi'}.`,
          'tenant'
        );
      }
      return result;
    }
    return { success: false, error: 'Firma bulunamadı.' };
  };

  // Super admin panelinin destek biletlerine ekledigi dosyalar.
  const uploadAdminFile = async (file) => {
    if (!file) return null;
    validateUpload(file);

    const path = buildUploadPath('admin/uploads', file.name);
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

  // Firma logosu. Tenant klasorune yazilir ki depolama izolasyonu korunsun.
  const uploadTenantLogo = async (slug, file) => {
    if (!file) return null;
    validateUpload(file);

    const path = buildUploadPath(`tenants/${slug}/branding`, file.name);
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file, { contentType: file.type });
    const url = await getDownloadURL(fileRef);

    return { url, path, name: file.name };
  };

  const getTenantUsers = async (slug) => {
    try {
      const usersSnap = await getDocs(collection(db, 'tenants', slug, 'users'));
      return usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Tenant kullanıcıları getirme hatası:", err);
      return [];
    }
  };

  const adminReplyTicket = async (ticketId, text, file = null) => {
    const ticket = supportTickets.find(t => t.id === ticketId);
    if (!ticket) return false;

    let attachment = null;
    if (file) {
      try {
        attachment = await uploadAdminFile(file);
      } catch (err) {
        console.error("Admin ticket yanıtı dosya yükleme hatası:", err);
        if (!confirm("Admin dosyası yüklenemedi. Yanıt yine de dosyası olmadan gönderilsin mi?")) {
          return false;
        }
      }
    }

    const newMessage = {
      id: Date.now().toString(),
      sender: adminUser?.name || 'Süper Admin',
      senderType: 'admin',
      text,
      attachment,
      timestamp: new Date().toISOString()
    };

    try {
      const ticketRef = doc(db, 'support_tickets', ticketId);
      await updateDoc(ticketRef, {
        messages: [...(ticket.messages || []), newMessage],
        status: 'Yanıtlandı',
        updatedAt: new Date().toISOString()
      });

      setSupportTickets(prev => prev.map(t => 
        t.id === ticketId 
          ? { ...t, status: 'Yanıtlandı', updatedAt: new Date().toISOString(), messages: [...(t.messages || []), newMessage] } 
          : t
      ));
      addAdminLog('Destek Yanıtı', `Ticket #${ticketId.slice(0,6)} yanıtlandı.`, 'ticket');
      return true;
    } catch (err) {
      console.error("Admin ticket yanıtlama hatası:", err);
      return false;
    }
  };

  const adminCloseTicket = async (ticketId) => {
    try {
      const ticketRef = doc(db, 'support_tickets', ticketId);
      await updateDoc(ticketRef, {
        status: 'Kapandı',
        updatedAt: new Date().toISOString()
      });

      setSupportTickets(prev => prev.map(t => 
        t.id === ticketId 
          ? { ...t, status: 'Kapandı', updatedAt: new Date().toISOString() } 
          : t
      ));
      return true;
    } catch (err) {
      console.error("Ticket kapatma hatası:", err);
      return false;
    }
  };

  const clearTenantLogs = async (slug) => {
    try {
      const tenantRef = doc(db, 'tenants', slug);
      const logsSnap = await getDocs(collection(tenantRef, 'logs'));
      const batch = writeBatch(db);
      logsSnap.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      addAdminLog('Log Temizleme', `${slug} firmasının logları temizlendi. (${logsSnap.docs.length} kayıt)`, 'system');
      return { success: true };
    } catch (err) {
      console.error("Log temizleme hatası", err);
      return { success: false, error: err.message };
    }
  };

  const clearTenantTickets = async (slug) => {
    try {
      const q = query(collection(db, 'support_tickets'), where('tenantSlug', '==', slug));
      const ticketsSnap = await getDocs(q);
      const batch = writeBatch(db);
      ticketsSnap.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      await refreshTenants();
      addAdminLog('Ticket Temizleme', `${slug} firmasının destek talepleri silindi. (${ticketsSnap.docs.length} kayıt)`, 'system');
      return { success: true };
    } catch (err) {
      console.error("Ticket temizleme hatası", err);
      return { success: false, error: err.message };
    }
  };

  const getStats = () => {
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const suspendedTenants = tenants.filter(t => t.status === 'suspended').length;
    const trialTenants = tenants.filter(t => t.status === 'trial').length;

    let totalLeads = 0;
    let totalUsers = 0;
    tenants.forEach(t => {
      totalLeads += getTenantLeadCount(t);
      totalUsers += getTenantUserCount(t);
    });

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      trialTenants,
      totalLeads,
      totalUsers
    };
  };

  const updateTenantUser = async (slug, userId, updatedData) => {
    try {
      const userRef = doc(db, 'tenants', slug, 'users', userId);
      await updateDoc(userRef, updatedData);
      addAdminLog('Kullanıcı Güncelleme', `${slug} firmasındaki ${userId} ID'li kullanıcı güncellendi.`, 'tenant');
      return { success: true };
    } catch (err) {
      console.error("Kullanıcı güncelleme hatası:", err);
      return { success: false, error: err.message };
    }
  };

    return (
    <AdminContext.Provider value={{
      adminUser,
      tenants,
      loadingTenants,
      supportTickets,
      loadingTickets,
      adminLogs,
      loadingLogs,
      adminUsers,
      loadingAdminUsers,
      adminLogin,
      adminLogout,
      addTenant,
      editTenant,
      removeTenant,
      toggleTenantStatus,
      getStats,
      refreshTenants,
      getTenantLeadCount,
      getTenantUserCount,
      adminReplyTicket,
      adminCloseTicket,
      clearTenantLogs,
      clearTenantTickets,
      uploadTenantLogo,
      getTenantUsers,
      addAdminLog,
      clearAdminLogs,
      addAdminUser,
      deleteAdminUser,
      updateTenantUser
    }}>
      {children}
    </AdminContext.Provider>
  );
};
