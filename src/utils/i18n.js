export const LANG_STORAGE_KEY = "lang";
export const DEFAULT_LANG = "vi";

export function normalizeLang(value) {
  return String(value || DEFAULT_LANG).toLowerCase().startsWith("en")
    ? "en"
    : "vi";
}

export function getCurrentLanguage() {
  if (typeof window !== "undefined") {
    return normalizeLang(
      window.localStorage.getItem(LANG_STORAGE_KEY) ||
        document.documentElement.lang ||
        DEFAULT_LANG
    );
  }

  return DEFAULT_LANG;
}

export function getLocaleForLanguage(lang = getCurrentLanguage()) {
  return normalizeLang(lang) === "en" ? "en-US" : "vi-VN";
}

export function pickLocalizedLabel(value, lang = getCurrentLanguage()) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const normalized = normalizeLang(lang);
    return value[normalized] || value.vi || value.en || "";
  }
  return String(value);
}
