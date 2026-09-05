import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import tr from "./tr.json";
import en from "./en.json";

const saved = (() => {
  try {
    return localStorage.getItem("aurora.lang");
  } catch {
    return null;
  }
})();

i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: saved ?? "tr",
  fallbackLng: "tr",
  interpolation: { escapeValue: false },
});

export const setLanguage = (lng: "tr" | "en") => {
  i18n.changeLanguage(lng);
  try {
    localStorage.setItem("aurora.lang", lng);
  } catch {
    /* storage unavailable */
  }
};

export default i18n;
