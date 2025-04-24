import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import zhTranslations from './locales/zh.json';
import enTranslations from './locales/en.json';

type Locale = 'zh' | 'en';
type Translations = typeof zhTranslations;

interface I18nContextType {
  locale: Locale;
  t: (key: string) => string;
  changeLocale: (locale: Locale) => void;
}

const translations: Record<Locale, Translations> = {
  zh: zhTranslations,
  en: enTranslations,
};

const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the key path if translation not found
    }
  }
  
  return result as string;
};

export const I18nContext = createContext<I18nContextType>({
  locale: 'zh',
  t: (key: string) => key,
  changeLocale: () => {},
});

export const useI18n = () => useContext(I18nContext);

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

export const I18nProvider = ({ children, defaultLocale = 'zh' }: I18nProviderProps) => {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    // Try to get locale from localStorage or browser settings
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    const browserLocale = navigator.language.startsWith('zh') ? 'zh' : 'en';
    
    setLocale(savedLocale || browserLocale || defaultLocale);
  }, [defaultLocale]);

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string): string => {
    return getNestedValue(translations[locale], key);
  };

  return (
    <I18nContext.Provider value={{ locale, t, changeLocale }}>
      {children}
    </I18nContext.Provider>
  );
};
