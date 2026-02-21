import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import tr from './locales/tr';
import ru from './locales/ru';
import de from './locales/de';

// Translation resources
const resources = {
  en: { translation: en },
  tr: { translation: tr },
  ru: { translation: ru },
  de: { translation: de },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default to English for Apple Store
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

// Language options for UI
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
];
