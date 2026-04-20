let currentLang = localStorage.getItem('baby-tracker-lang') || 'en';
let strings = {};

export async function initI18n() {
  await loadLang(currentLang);
}

async function loadLang(lang) {
  const res = await fetch(`/js/lang/${lang}.json`);
  strings = await res.json();
  currentLang = lang;
  localStorage.setItem('baby-tracker-lang', lang);
}

export async function setLang(lang) {
  await loadLang(lang);
  // Dispatch event so components can re-render
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

export function getLang() {
  return currentLang;
}

export function t(key) {
  // Support dot notation: 'login.title'
  const keys = key.split('.');
  let val = strings;
  for (const k of keys) {
    if (val && typeof val === 'object' && k in val) {
      val = val[k];
    } else {
      return key; // fallback to key if not found
    }
  }
  return val;
}
