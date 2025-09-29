// --------- i18n loader (external JSON) ---------
const LS_LANG_KEY = "site_lang";
const LS_THEME_KEY = "site_theme";
const LS_I18N_CACHE_PREFIX = "i18n_"; // e.g., i18n_en

async function fetchI18n(lang) {
  const cacheKey = LS_I18N_CACHE_PREFIX + lang;
  // 1) try cache
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (_) {}
  }
  // 2) try network
  try {
    const res = await fetch(`i18n/${lang}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed ${res.status}`);
    const json = await res.json();
    localStorage.setItem(cacheKey, JSON.stringify(json));
    return json;
  } catch (e) {
    console.warn("i18n fetch error:", e);
    return null;
  }
}
// // найди элемент
// const avatar = document.querySelector(".profile-avatar");

// if (avatar) {
//   avatar.addEventListener("click", () => {
//     avatar.classList.toggle("expanded");
//   });
// }
// ——— Lightbox for profile avatar ———
(function(){
  const avatarImg = document.querySelector('.profile-avatar img');
  if (!avatarImg) return;

  // создаём DOM один раз
  const backdrop = document.createElement('div');
  backdrop.className = 'lb-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');

  const dialog = document.createElement('div');
  dialog.className = 'lb-dialog';

  const img = document.createElement('img');
  img.className = 'lb-img';
  img.alt = avatarImg.alt || 'profile photo enlarged';

  const btn = document.createElement('button');
  btn.className = 'lb-close';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Close');
  btn.innerHTML = '✕';

  dialog.appendChild(img);
  dialog.appendChild(btn);
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);

  const open = () => {
    // если указали data-fullsrc — используем его, иначе текущий src
    const full = avatarImg.getAttribute('data-fullsrc');
    img.src = full && full.trim() ? full : avatarImg.getAttribute('src');
    backdrop.classList.add('open');
    // блокируем прокрутку фона (опционально)
    document.documentElement.style.overflow = 'hidden';
    // фокус на кнопку закрытия
    btn.focus();
  };

  const close = () => {
    backdrop.classList.remove('open');
    document.documentElement.style.overflow = '';
    avatarImg.closest('.profile-avatar')?.focus?.();
  };

  // клики
  avatarImg.addEventListener('click', open);
  btn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close(); // клик вне диалога — закрыть
  });

  // Esc
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('open')) close();
  });
})();

function applyI18nDict(dict) {
  if (!dict) return;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
}

async function setLang(lang) {
  const supported = ["en","de","ru"];
  const ln = supported.includes(lang) ? lang : "en";
  const dict = await fetchI18n(ln) || await fetchI18n("en");
  applyI18nDict(dict);
  document.documentElement.setAttribute("lang", ln);
  localStorage.setItem(LS_LANG_KEY, ln);
}

// init year
document.getElementById("year").textContent = new Date().getFullYear();

// burger + smooth scroll + theme (как было)
const burger = document.getElementById("burger");
const navLinks = document.getElementById("nav-links");
burger?.addEventListener("click", () => {
  const isOpen = navLinks.style.display === "block";
  navLinks.style.display = isOpen ? "none" : "block";
  burger.setAttribute("aria-expanded", String(!isOpen));
});
navLinks?.querySelectorAll("a,button").forEach(el => {
  el.addEventListener("click", () => {
    if (getComputedStyle(burger).display !== "none") {
      navLinks.style.display = "none";
      burger.setAttribute("aria-expanded", "false");
    }
  });
});
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const id = a.getAttribute("href");
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
});

// theme toggle (как было)
const root = document.documentElement;
function applyTheme(theme){
  if (theme === "light") root.classList.add("light");
  else root.classList.remove("light");
  localStorage.setItem(LS_THEME_KEY, theme);
}
document.getElementById("theme-toggle")?.addEventListener("click", () => {
  const isLight = root.classList.contains("light");
  applyTheme(isLight ? "dark" : "light");
});

// lang buttons
document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.addEventListener("click", () => setLang(btn.dataset.lang));
});

// initial theme + lang (supports ?lang=de|en|ru)
(async function init(){
  const savedTheme = localStorage.getItem(LS_THEME_KEY);
  if (savedTheme) applyTheme(savedTheme);
  else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) applyTheme("light");

  const urlLang = new URLSearchParams(location.search).get("lang");
  const savedLang = localStorage.getItem(LS_LANG_KEY);
  const navLang = (navigator.language || "en").slice(0,2);
  await setLang(urlLang || savedLang || (["en","de","ru"].includes(navLang) ? navLang : "en"));
})();



// ----- Site "variables" (config) -----
const SITE_CONFIG = {
  firstName: "Aleksandr",
  fullName: "Aleksandr Ditkin",
  location: "Hamburg, DE",
  langs: "EN · DE · RU",
  emailText: "ditkincontact@gmail.com",
  email: "mailto:ditkincontact@gmail.com",
  mailto: "mailto:ditkincontact@gmail.com",
  linkedinText: "/aleksandrditkin",
  linkedin: "https://www.linkedin.com/in/aleksandrditkin",
  avatar: "img/me.jpg",
  statLanguages: "3"
};

// ----- i18n -----
const SUPPORTED_LOCALES = ["en","de","ru"];
let currentLocale = localStorage.getItem("locale") || "en";
if (!SUPPORTED_LOCALES.includes(currentLocale)) currentLocale = "en";

const dictionaries = {}; // cache

async function loadDict(locale){
  if (dictionaries[locale]) return dictionaries[locale];
  const res = await fetch(`${locale}.json?v=${(new Date()).getMonth()+1}`);
  const json = await res.json();
  dictionaries[locale] = json;
  return json;
}

function applyConfig(){
  // text nodes
  document.querySelectorAll("[data-config]").forEach(el=>{
    const key = el.getAttribute("data-config");
    if (SITE_CONFIG[key] != null) el.textContent = SITE_CONFIG[key];
  });
  // hrefs
  document.querySelectorAll("[data-config-href]").forEach(el=>{
    const key = el.getAttribute("data-config-href");
    if (SITE_CONFIG[key] != null) el.setAttribute("href", SITE_CONFIG[key]);
  });
  // srcs (e.g., avatar)
  document.querySelectorAll("[data-config-src]").forEach(el=>{
    const key = el.getAttribute("data-config-src");
    if (SITE_CONFIG[key] != null) el.setAttribute("src", SITE_CONFIG[key]);
  });
}

function applyI18n(dict){
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    if (dict[key] != null) {
      if (el.tagName.toLowerCase() === "title") {
        document.title = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });
}

async function setLocale(locale){
  currentLocale = locale;
  localStorage.setItem("locale", locale);
  const dict = await loadDict(locale);
  applyI18n(dict);
}

// ----- UI helpers -----
function initTheme(){
  const saved = localStorage.getItem("theme") || "dark";
  if (saved === "light") document.documentElement.classList.add("light");
  document.getElementById("theme-toggle")?.addEventListener("click", ()=>{
    document.documentElement.classList.toggle("light");
    localStorage.setItem("theme", document.documentElement.classList.contains("light") ? "light":"dark");
  });
}

function initBurger(){
  const burger = document.getElementById("burger");
  const links = document.getElementById("nav-links");
  if (!burger || !links) return;
  burger.addEventListener("click", ()=>{
    const open = links.style.display === "block";
    links.style.display = open ? "none" : "block";
    burger.setAttribute("aria-expanded", String(!open));
  });
  // close on click outside (mobile)
  document.addEventListener("click", (e)=>{
    if (!links.contains(e.target) && !burger.contains(e.target) && window.getComputedStyle(burger).display !== "none"){
      links.style.display = "none";
      burger.setAttribute("aria-expanded","false");
    }
  });
}

function initLangButtons(){
  document.querySelectorAll(".lang-btn").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const lang = btn.getAttribute("data-lang");
      await setLocale(lang);
    });
  });
}

function setYear(){
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

// ----- boot -----
(async function(){
  applyConfig();
  await setLocale(currentLocale);
  initTheme();
  initBurger();
  initLangButtons();
  setYear();
})();
