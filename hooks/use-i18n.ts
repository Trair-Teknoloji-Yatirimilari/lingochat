import { useTranslation } from 'react-i18next';
import '../lib/i18n';

export function useI18n() {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  return {
    t,
    language: i18n.language,
    changeLanguage,
  };
}
