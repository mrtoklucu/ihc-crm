import React, { createContext, useState, useEffect, useContext } from 'react';
import { AppContext } from './AppContext';
import { AdminContext } from './AdminContext';


export const I18nContext = createContext();

const translations = {
  tr: {
    dashboard: "Analiz Paneli",
    newLead: "Yeni Lead",
    leads: "Lead Listesi",
    profile: "Profilim",
    users: "Yetkilendirme",
    logs: "Log Geçmişi",
    support: "Destek Talebi",
    leadPool: "Lead Havuzu",
    logout: "Çıkış Yap",
    welcome: "Hoş Geldiniz",
    settings: "Ayarlar",
    language: "Panel Dili",
    save: "Değişiklikleri Kaydet",
    email: "E-posta",
    password: "Yeni Şifre",
    submit: "Kaydet",
    languageSelection: "Dil Seçimi",
    management: "Yönetim Paneli",
    tenants: "Firma Yönetimi",
    tickets: "Destek Talepleri",
    integrations: "Entegrasyonlar",
    system: "Sistem"
  },
  en: {
    dashboard: "Analytics Panel",
    newLead: "New Lead",
    leads: "Lead List",
    profile: "My Profile",
    users: "Authorization",
    logs: "Log History",
    support: "Support Request",
    leadPool: "Lead Pool",
    logout: "Logout",
    welcome: "Welcome",
    settings: "Settings",
    language: "Panel Language",
    save: "Save Changes",
    email: "Email",
    password: "New Password",
    submit: "Save",
    languageSelection: "Language Selection",
    management: "Management Panel",
    tenants: "Firm Management",
    tickets: "Support Tickets",
    integrations: "Integrations",
    system: "System"
  },
  de: {
    dashboard: "Analyse-Panel",
    newLead: "Neuer Lead",
    leads: "Lead-Liste",
    profile: "Mein Profil",
    users: "Autorisierung",
    logs: "Protokollhistorie",
    support: "Support-Anfrage",
    leadPool: "Lead-Pool",
    logout: "Abmelden",
    welcome: "Willkommen",
    settings: "Einstellungen",
    language: "Panelsprache",
    save: "Änderungen speichern",
    email: "E-Mail",
    password: "Neues Passwort",
    submit: "Speichern",
    languageSelection: "Sprachauswahl",
    management: "Management-Panel",
    tenants: "Firmenmanagement",
    tickets: "Support-Tickets",
    integrations: "Integrationen",
    system: "System"
  },
  ru: {
    dashboard: "Панель анализа",
    newLead: "Новый лид",
    leads: "Список лидов",
    profile: "Мой профиль",
    users: "Авторизация",
    logs: "История логов",
    support: "Запрос поддержки",
    leadPool: "Пул лидов",
    logout: "Выйти",
    welcome: "Добро пожаловать",
    settings: "Настройки",
    language: "Язык панели",
    save: "Сохранить изменения",
    email: "Электронная почта",
    password: "Новый пароль",
    submit: "Сохранить",
    languageSelection: "Выбор языка",
    management: "Панель управления",
    tenants: "Управление фирмами",
    tickets: "Тикеты поддержки",
    integrations: "Интеграции",
    system: "Система"
  },
  fr: {
    dashboard: "Tableau d'analyse",
    newLead: "Nouveau Lead",
    leads: "Liste des Leads",
    profile: "Mon Profil",
    users: "Autorisation",
    logs: "Historique des logs",
    support: "Demande de Support",
    leadPool: "Pool de Leads",
    logout: "Déconnexion",
    welcome: "Bienvenue",
    settings: "Paramètres",
    language: "Langue du Panneau",
    save: "Enregistrer les modifications",
    email: "E-mail",
    password: "Nouveau mot de passe",
    submit: "Enregistrer",
    languageSelection: "Choix de la langue",
    management: "Tableau de gestion",
    tenants: "Gestion des entreprises",
    tickets: "Tickets de Support",
    integrations: "Intégrations",
    system: "Système"
  },
  es: {
    dashboard: "Panel de Análisis",
    newLead: "Nuevo Lead",
    leads: "Lista de Leads",
    profile: "Mi Perfil",
    users: "Autorización",
    logs: "Historial de Logs",
    support: "Solicitud de Soporte",
    leadPool: "Pool de Leads",
    logout: "Cerrar Sesión",
    welcome: "Bienvenido",
    settings: "Ajustes",
    language: "Idioma del Panel",
    save: "Guardar Cambios",
    email: "Correo electrónico",
    password: "Nueva Contraseña",
    submit: "Guardar",
    languageSelection: "Selección de Idioma",
    management: "Panel de Gestión",
    tenants: "Gestión de Empresas",
    tickets: "Tickets de Soporte",
    integrations: "Integraciones",
    system: "Sistema"
  },
  ar: {
    dashboard: "لوحة التحليل",
    newLead: "عميل جديد",
    leads: "قائمة العملاء",
    profile: "ملفي الشخصي",
    users: "التفويض",
    logs: "تاريخ السجل",
    support: "طلب الدعم",
    leadPool: "مجمع العملاء",
    logout: "تسجيل الخروج",
    welcome: "أهلاً بك",
    settings: "الإعدادات",
    language: "لغة اللوحة",
    save: "حفظ التغييرات",
    email: "البريد الإلكتروني",
    password: "كلمة مرور جديدة",
    submit: "حفظ",
    languageSelection: "اختيار اللغة",
    management: "لوحة الإدارة",
    tenants: "إدارة الشركات",
    tickets: "تذاكر الدعم",
    integrations: "التكاملات",
    system: "النظام"
  }
};

export const I18nProvider = ({ children }) => {
  const { currentUser } = useContext(AppContext) || {};
  const { adminUser } = useContext(AdminContext) || {};
  
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('app_language') || 'tr';
  });

  useEffect(() => {
    // If user has a saved language in Firestore, sync it
    if (currentUser?.language && currentUser.language !== currentLang) {
      setCurrentLang(currentUser.language);
      localStorage.setItem('app_language', currentUser.language);
    }
  }, [currentUser]);

  const t = (key) => {
    return translations[currentLang]?.[key] || translations['tr']?.[key] || key;
  };

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setCurrentLang(lang);
      localStorage.setItem('app_language', lang);
    }
  };

  return (
    <I18nContext.Provider value={{ t, currentLang, changeLanguage, languages: Object.keys(translations) }}>
      {children}
    </I18nContext.Provider>
  );
};
