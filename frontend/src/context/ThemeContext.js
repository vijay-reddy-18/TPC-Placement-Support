import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Supported Languages ───────────────────────────────────────────────────
export const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇬🇧', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi',      flag: '🇮🇳', nativeLabel: 'हिन्दी' },
  { code: 'ta', label: 'Tamil',      flag: '🇮🇳', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu',     flag: '🇮🇳', nativeLabel: 'తెలుగు' },
];

// ─── Translations (UI labels) ─────────────────────────────────────────────
export const TRANSLATIONS = {
  en: {
    dashboard:       'Dashboard',
    tickets:         'My Tickets',
    raiseTicket:     'Raise Ticket',
    notifications:   'Notifications',
    helpCenter:      'Help Center',
    feedback:        'Feedback',
    profile:         'Profile',
    logout:          'Logout',
    search:          'Search tickets...',
    settings:        'Settings',
    theme:           'Theme',
    language:        'Language',
    light:           'Light',
    dark:            'Dark',
    auto:            'System',
    welcome:         'Welcome back',
    openTickets:     'Open Tickets',
    resolved:        'Resolved',
    inProgress:      'In Progress',
    allRightsResv:   'All rights reserved',
  },
  hi: {
    dashboard:       'डैशबोर्ड',
    tickets:         'मेरे टिकट',
    raiseTicket:     'टिकट बनाएं',
    notifications:   'सूचनाएं',
    helpCenter:      'सहायता केंद्र',
    feedback:        'फीडबैक',
    profile:         'प्रोफाइल',
    logout:          'लॉग आउट',
    search:          'टिकट खोजें...',
    settings:        'सेटिंग्स',
    theme:           'थीम',
    language:        'भाषा',
    light:           'हल्का',
    dark:            'गहरा',
    auto:            'सिस्टम',
    welcome:         'स्वागत है',
    openTickets:     'खुले टिकट',
    resolved:        'हल किया',
    inProgress:      'प्रगति में',
    allRightsResv:   'सर्वाधिकार सुरक्षित',
  },
  ta: {
    dashboard:       'டாஷ்போர்டு',
    tickets:         'என் டிக்கெட்கள்',
    raiseTicket:     'டிக்கெட் உருவாக்கு',
    notifications:   'அறிவிப்புகள்',
    helpCenter:      'உதவி மையம்',
    feedback:        'கருத்து',
    profile:         'சுயவிவரம்',
    logout:          'வெளியேறு',
    search:          'டிக்கெட்கள் தேடு...',
    settings:        'அமைப்புகள்',
    theme:           'தீம்',
    language:        'மொழி',
    light:           'ஒளி',
    dark:            'இருள்',
    auto:            'கணினி',
    welcome:         'மீண்டும் வரவேற்கிறோம்',
    openTickets:     'திறந்த டிக்கெட்கள்',
    resolved:        'தீர்க்கப்பட்டது',
    inProgress:      'செயல்பாட்டில்',
    allRightsResv:   'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை',
  },
  te: {
    dashboard:       'డాష్‌బోర్డ్',
    tickets:         'నా టిక్కెట్లు',
    raiseTicket:     'టిక్కెట్ సృష్టించు',
    notifications:   'నోటిఫికేషన్లు',
    helpCenter:      'సహాయ కేంద్రం',
    feedback:        'అభిప్రాయం',
    profile:         'ప్రొఫైల్',
    logout:          'లాగ్ అవుట్',
    search:          'టిక్కెట్లు శోధించు...',
    settings:        'సెట్టింగ్లు',
    theme:           'థీమ్',
    language:        'భాష',
    light:           'వెలుతురు',
    dark:            'చీకటి',
    auto:            'సిస్టమ్',
    welcome:         'తిరిగి స్వాగతం',
    openTickets:     'తెరిచిన టిక్కెట్లు',
    resolved:        'పరిష్కారమైంది',
    inProgress:      'పురోగతిలో',
    allRightsResv:   'అన్ని హక్కులు రిజర్వు చేయబడ్డాయి',
  },
};

// ─── CSS variable maps per theme ──────────────────────────────────────────
const THEME_VARS = {
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8fafc',
    '--bg-surface': '#ffffff',
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--text-muted': '#94a3b8',
    '--border-color': '#e2e8f0',
    '--accent': '#6366f1',
    '--accent-light': '#eef2ff',
    '--shadow': '0 2px 12px rgba(0,0,0,0.07)',
    '--topbar-bg': '#ffffff',
    '--sidebar-bg': 'linear-gradient(180deg,#1e1b4b 0%,#312e81 40%,#1e1b4b 100%)',
    'color-scheme': 'light',
  },
  dark: {
    '--bg-primary': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--bg-surface': '#1e293b',
    '--text-primary': '#f1f5f9',
    '--text-secondary': '#94a3b8',
    '--text-muted': '#64748b',
    '--border-color': '#334155',
    '--accent': '#818cf8',
    '--accent-light': '#1e1b4b',
    '--shadow': '0 2px 12px rgba(0,0,0,0.4)',
    '--topbar-bg': '#1e293b',
    '--sidebar-bg': 'linear-gradient(180deg,#020617 0%,#0f172a 40%,#020617 100%)',
    'color-scheme': 'dark',
  },
  auto: {
    '--bg-primary': 'color-mix(in srgb, #ffffff, #0f172a 0%)',
    '--bg-secondary': '#f8fafc',
    '--bg-surface': '#ffffff',
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--text-muted': '#94a3b8',
    '--border-color': '#e2e8f0',
    '--accent': '#6366f1',
    '--accent-light': '#eef2ff',
    '--shadow': '0 2px 12px rgba(0,0,0,0.07)',
    '--topbar-bg': '#ffffff',
    '--sidebar-bg': 'linear-gradient(180deg,#1e1b4b 0%,#312e81 40%,#1e1b4b 100%)',
    'color-scheme': 'light dark',
  },
};

const ThemeContext = createContext(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};

// Translate helper — returns text for current language or falls back to English
export const useT = () => {
  const { language } = useTheme();
  return (key) => TRANSLATIONS[language]?.[key] ?? TRANSLATIONS.en[key] ?? key;
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('tpc_theme') || 'light');
  const [language, setLanguage] = useState(() => localStorage.getItem('tpc_lang') || 'en');

  const applyTheme = useCallback((t) => {
    const root = document.documentElement;
    const vars = THEME_VARS[t] || THEME_VARS.light;
    Object.entries(vars).forEach(([k, v]) => {
      if (k === 'color-scheme') {
        root.style.colorScheme = v;
      } else {
        root.style.setProperty(k, v);
      }
    });
    root.setAttribute('data-theme', t);

    // Apply dark mode body background directly for full coverage
    if (t === 'dark') {
      document.body.style.background = '#0f172a';
      document.body.style.color = '#f1f5f9';
    } else {
      document.body.style.background = '';
      document.body.style.color = '';
    }
  }, []);

  const changeTheme = (t) => {
    setTheme(t);
    localStorage.setItem('tpc_theme', t);
    applyTheme(t);
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('tpc_lang', lang);
    document.documentElement.setAttribute('lang', lang);
  };

  // Apply on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
    document.documentElement.setAttribute('lang', language);
  }, [theme, language, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, language, changeTheme, changeLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
}
