import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Lang = 'en' | 'ar';

type Dict = Record<string, string>;

type I18nContextType = {
  lang: Lang;
  t: (key: string) => string;
  setLang: (l: Lang) => void;
};

const en: Dict = {
  dashboard: 'Dashboard',
  usersAuth: 'Users & Auth',
  missions: 'Missions',
  employees: 'Employees',
  drivers: 'Drivers',
  technicians: 'Technicians',
  sites: 'Sites',
  generators: 'Generators',
  reports: 'Reports',
  notifications: 'Notifications',
  settings: 'Settings',
  settingsGeneral: 'General Settings',
  settingsCities: 'Cities',
  settingsZones: 'Zones',
  settingsAdminLog: 'Admin Log',
  adminUsers: 'Admin Users',
  authorizations: 'Authorizations',
  generalSettings: 'General Settings',
  literPrice: 'Liter price',
  maxDistance: 'Maximum distance from station to confirm task',
  language: 'Language',
  save: 'Save',
  saving: 'Saving...',
  signInTitle: 'Sign in to Super Admin',
  signInSubtitle: 'Enter your details to sign in to your account',
  username: 'Username',
  password: 'Password',
  rememberMe: 'Remember me',
  forgotPassword: 'Forgot password?',
  login: 'Login',
  signingIn: 'Signing in…',
  searchPlaceholder: 'Search…',
  signedInAs: 'Signed in as',
  logout: 'Logout',
  resetPassword: 'Reset password',
  enterEmailToReset: 'Enter your email to receive a reset link',
  sendResetLink: 'Send reset link',
  cancel: 'Cancel',
  resetEmailSent: 'If an account exists, a reset email has been sent.',
  invalidEmail: 'Please enter a valid email.',
  totalLitersToday: 'Total Liters Added Today',
  totalLiters30: 'Total Liters Added in Last 30 Days',
  stcCow30: 'Stc-cow – Last 30 Days',
  totalTasksStatusCount: 'Total tasks status count',
  totalTasksZonesCount: 'Total tasks zones count',
  activeMissions: 'Active Missions',
  activeDrivers: 'Active Drivers',
  noDataYet: 'No data yet',
  manageAdminsIntro:
    'Manage who can log in to Administrative and Authorizations',
  export: 'Export',
  columns: 'Columns',
  add: 'Add',
  excelPrintColumnVisibility: 'Excel | Print | Column visibility',
  search: 'Search',
  email: 'Email',
  webAuthorization: 'Web Authorization',
  settingsCol: 'Settings',
  noResults: 'No results',
  showing: 'Showing',
  of: 'of',
  entries: 'entries',
  prev: 'Prev',
  next: 'Next',
  loading: 'Loading...',
  failedToLoad: 'Failed to load.',
  addUser: 'Add User',
  editUser: 'Edit User',
  required: 'This field is required.',
  edit: 'Edit',
  delete: 'Delete',
  hide: 'Hide',
  show: 'Show',
  settingName: 'Setting name',
  editSetting: 'Edit Setting',
  details: 'Details',
  setting: 'Setting',
  name: 'Name',
  position: 'Position',
  admin: 'Admin',
  user: 'User',
  time: 'Time',
  sync: 'Sync',
  sitesOverview: 'Sites Overview',
  siteName: 'Site name',
  vendor: 'Vendor',
  region: 'Region',
  district: 'District',
  city: 'City',
  cowStatus: 'COW Status',
  latitude: 'Latitude',
  longitude: 'Longitude',
  powerSource: 'Power source',
  showSitesOverview: 'Show Sites Overview',
  hideSitesOverview: 'Hide Sites Overview',
  litersToday: 'Liters today',
  liters30d: 'Liters (30 days)',
  regionTotals: 'Region totals (liters)',
  central: 'Central',
  east: 'East',
  welcome: 'Welcome',
  navigateSidebar: 'Use the sidebar to navigate sections',
};

const ar: Dict = {
  dashboard: 'لوحة التحكم',
  usersAuth: 'المستخدمون والصلاحيات',
  missions: 'المهام',
  employees: 'الموظفون',
  drivers: 'السائقون',
  technicians: 'الفنيون',
  sites: 'المواقع',
  generators: 'المولدات',
  reports: 'التقارير',
  notifications: 'الإشعارات',
  settings: 'الإعدادات',
  settingsGeneral: 'الإعدادات العامة',
  settingsCities: 'المدن',
  settingsZones: 'المناطق',
  settingsAdminLog: 'سجل المشرف',
  adminUsers: '��ستخدمو المشرف',
  authorizations: 'الصلاحيات',
  generalSettings: 'الإ��دادات العامة',
  literPrice: 'سعر اللتر',
  maxDistance: 'أقصى مسافة من المحطة لتأكيد المهمة',
  language: 'اللغة',
  save: 'حفظ',
  saving: 'جارٍ الحفظ...',
  signInTitle: 'تسجيل الدخول إلى المشرف العام',
  signInSubtitle: 'أدخل بياناتك لتسجيل الدخول إلى حسابك',
  username: 'اسم المستخدم',
  password: 'كلمة المرور',
  rememberMe: 'تذكرني',
  forgotPassword: 'نسيت كلمة المرور؟',
  login: 'تسجيل الدخول',
  signingIn: 'جارٍ تسجيل الدخول...',
  searchPlaceholder: 'ابحث…',
  signedInAs: 'مسجل الدخول باسم',
  logout: 'تسجيل الخروج',
  resetPassword: 'إعادة تعيين كلمة المرور',
  enterEmailToReset: 'أدخل بريدك الإلكتروني لاستلام رابط إعادة التعيين',
  sendResetLink: 'إرسال رابط إعادة التعيين',
  cancel: 'إلغاء',
  resetEmailSent: 'إذا كان الحساب موجودًا، فقد تم إرسال رسالة إعادة التعيين.',
  invalidEmail: 'يرج�� إدخال بريد إلكتروني صالح.',
  totalLitersToday: 'إجمالي اللترات ا��مضافة اليوم',
  totalLiters30: 'إجمالي اللترات المضافة خلال آخر 30 يومًا',
  stcCow30: 'Stc-cow – آخر 30 يومًا',
  totalTasksStatusCount: 'إجمالي عدد حالات المهام',
  totalTasksZonesCount: 'إجمالي عدد المناطق للمهام',
  activeMissions: 'المهام النشطة',
  activeDrivers: 'السائقون النشطون',
  noDataYet: 'لا توجد بيانات بعد',
  manageAdminsIntro: 'إدارة من يمكنه تسجيل الدخول إلى الإدارة والصلاحيات',
  export: 'تصدير',
  columns: 'الأعمدة',
  add: 'إضافة',
  excelPrintColumnVisibility: 'إكسل | طباعة | إظهار/إخفاء الأعمدة',
  search: 'بحث',
  email: 'البريد الإلكتروني',
  webAuthorization: 'صلاحية الويب',
  settingsCol: 'الإعدادات',
  noResults: 'لا توجد نتائج',
  showing: 'عرض',
  of: 'من',
  entries: 'مدخلات',
  prev: 'السابق',
  next: 'التالي',
  loading: 'جارٍ التحميل...',
  failedToLoad: 'فشل التحميل.',
  addUser: 'إضافة مستخدم',
  editUser: 'تعديل مستخدم',
  required: 'هذا الحقل مطلوب.',
  edit: 'تعديل',
  delete: 'حذف',
  hide: 'إخفاء',
  show: 'إظهار',
  settingName: 'اسم الإعداد',
  editSetting: 'تعديل الإعداد',
  details: 'التفاصيل',
  setting: 'الإعداد',
  name: 'الاسم',
  position: 'المنصب',
  admin: 'مشرف',
  user: 'مستخدم',
  time: 'الوقت',
  sync: 'مزامنة',
  sitesOverview: 'نظرة عامة على المواقع',
  siteName: 'اسم الموقع',
  vendor: 'المزود',
  region: 'المنطقة',
  district: 'الحي',
  city: 'المدينة',
  cowStatus: 'حالة COW',
  latitude: 'خط العرض',
  longitude: 'خط الطول',
  powerSource: 'مصدر الطاقة',
  showSitesOverview: 'عرض نظرة عامة على المواقع',
  hideSitesOverview: 'إخفاء نظرة عامة على المواقع',
  litersToday: 'لترات اليوم',
  liters30d: 'اللترات (30 يومًا)',
  regionTotals: 'إجمالي المناطق (لترات)',
  central: 'ا��وسطى',
  east: 'الشرقية',
  welcome: 'مرحبًا',
  navigateSidebar: 'استخدم الشريط الجانبي للتنقل بين الأقسام',
};

const dictionaries: Record<Lang, Dict> = { en, ar };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getInitialLang(): Lang {
  const saved =
    typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
  return saved === 'ar' ? 'ar' : 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang());

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: string) => {
      const d = dictionaries[lang] || en;
      return d[key] ?? key;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback for cases where the provider isn't mounted (pre-render or mis-wiring).
    // Avoid throwing to prevent the whole app from crashing; return a minimal safe API.
    return {
      lang: 'en',
      t: (key: string) => key,
      setLang: (l: Lang) => {},
    } as I18nContextType;
  }
  return ctx;
}
