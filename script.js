/* ---------- i18n + Site Logic (all comments in English) ---------- */

/** LocalStorage keys */
const LS_LANG_KEY = "locale";
const LS_THEME_KEY = "theme";

/** Supported languages and defaults */
const SUPPORTED_LOCALES = ["en", "de", "ru"];
const DEFAULT_LANG = "en";

/** Where JSON files are located: "." = same folder as index.html */
const I18N_PATH = "i18n";

/** Detect initial language: localStorage -> browser -> default */
function detectInitialLang() {
  const saved = localStorage.getItem(LS_LANG_KEY);
  if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
  const nav = (navigator.language || navigator.userLanguage || "").toLowerCase();
  const short = nav.split("-")[0];
  if (SUPPORTED_LOCALES.includes(short)) return short;
  return DEFAULT_LANG;
}

/** Load dictionary for given lang with cache-busting disabled */
async function loadDict(lang) {
  const url = `${I18N_PATH}/${lang}.json`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`[i18n] Failed to load ${url}:`, e);
    // Fallback to default lang
    if (lang !== DEFAULT_LANG) {
      try {
        const res = await fetch(`${I18N_PATH}/${DEFAULT_LANG}.json`, { cache: "no-store" });
        if (res.ok) return await res.json();
      } catch {}
    }
    return {};
  }
}

/** Apply translations to DOM: text nodes and attribute-bound nodes */
function applyI18n(dict, lang) {
  // Update <html lang=".."> and <title>
  document.documentElement.setAttribute("lang", lang);
  if (dict["site.title"]) document.title = dict["site.title"];

  // Text content via data-i18n
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const val = dict[key];
    if (val == null) return;

    // If data-i18n-attr is present, apply to listed attributes (e.g., placeholder, aria-label, title)
    const whichAttrs = (el.getAttribute("data-i18n-attr") || "").trim();
    if (whichAttrs) {
      whichAttrs.split(",").map(a => a.trim()).forEach((attr) => {
        if (!attr) return;
        el.setAttribute(attr, val);
      });
      return; // attribute-driven usage usually doesn't need to alter textContent
    }

    // Otherwise set the text content
    el.textContent = val;
  });
}

/** Language state */
let CURRENT_LANG = detectInitialLang();
let CURRENT_DICT = {};

/** Set language: persist, load, apply, and update UI states */
async function setLang(lang) {
  if (!SUPPORTED_LOCALES.includes(lang)) lang = DEFAULT_LANG;
  CURRENT_LANG = lang;
  localStorage.setItem(LS_LANG_KEY, lang);

  CURRENT_DICT = await loadDict(lang);
  applyI18n(CURRENT_DICT, lang);

  // Toggle active state on language buttons
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

/** Wire language buttons */
function initLangButtons() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });
}

/** Footer year */
function initYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

/** Burger menu for mobile */
function initBurger() {
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav-links");
  if (!burger || !nav) return;

  burger.addEventListener("click", () => {
    const expanded = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("open", !expanded);
  });

  // Close after clicking a nav link
  nav.querySelectorAll("a[href^='#']").forEach((a) => {
    a.addEventListener("click", () => {
      burger.setAttribute("aria-expanded", "false");
      nav.classList.remove("open");
    });
  });
}

/** Theme toggle (dark/light) */
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const root = document.documentElement;

  function apply(theme) {
    if (theme === "light") root.classList.add("light");
    else root.classList.remove("light");
  }

  let theme = localStorage.getItem(LS_THEME_KEY) || "dark";
  apply(theme);

  btn.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem(LS_THEME_KEY, theme);
    apply(theme);
  });
}

/** Site config hydrator (name, avatar, links, etc.) */
function initConfig() {
  // You can move this object to a separate file if desired.
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
    statLanguages: "3",
  };

  // data-config="key" -> text
  document.querySelectorAll("[data-config]").forEach((el) => {
    const key = el.getAttribute("data-config");
    if (key in SITE_CONFIG) el.textContent = SITE_CONFIG[key];
  });
  // data-config-src="key" -> src
  document.querySelectorAll("[data-config-src]").forEach((el) => {
    const key = el.getAttribute("data-config-src");
    if (key in SITE_CONFIG) {
      const v = SITE_CONFIG[key];
      if (el.tagName === "IMG") el.src = v;
      else el.setAttribute("src", v);
    }
  });
  // data-config-href="key" -> href
  document.querySelectorAll("[data-config-href]").forEach((el) => {
    const key = el.getAttribute("data-config-href");
    if (key in SITE_CONFIG) el.setAttribute("href", SITE_CONFIG[key]);
  });


}

/** Smooth-scrolling for in-page anchors with sticky offset.
 *  Special case: brand click jumps instantly (no smooth scroll).
 */
function initAnchors() {
  const header = document.getElementById("navbar");
  const offset = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--scroll-offset")
  ) || 0;

  // Intercept all #hash links
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const hash = a.getAttribute("href");
      if (!hash || hash === "#") return;

      const target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();

      // --- спец. случай: домой (#hero или #top) ---
      if (hash === "#hero" || hash === "#top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        history.pushState(null, "", hash);
        return;
      }

      // обычное поведение
      const isBrand = a.classList.contains("brand") || a.closest(".brand");
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top,
        behavior: isBrand ? "auto" : "smooth",
      });

      // Update URL hash without additional scrolling
      history.pushState(null, "", hash);
    });
  });

  // Ensure header stays above sections near the end of the page
  if (header) header.style.zIndex = "1000";
}
// ----- Lightbox for profile avatar -----
function initAvatarLightbox(){
  const avatarImg = document.querySelector('.profile-avatar img');
  if (!avatarImg) return;

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

  const open = ()=>{
    const full = avatarImg.getAttribute('data-fullsrc');
    img.src = (full && full.trim()) ? full : avatarImg.getAttribute('src');
    backdrop.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    btn.focus();
  };

  const close = ()=>{
    backdrop.classList.remove('open');
    document.documentElement.style.overflow = '';
  };

  avatarImg.addEventListener('click', open);
  btn.addEventListener('click', close);
  backdrop.addEventListener('click', e=>{ if (e.target === backdrop) close(); });
  window.addEventListener('keydown', e=>{ if (e.key === 'Escape' && backdrop.classList.contains('open')) close(); });
}

/** Initialize everything */
document.addEventListener("DOMContentLoaded", async () => {
  initYear();
  initBurger();
  initThemeToggle();
  initLangButtons();
  initConfig();
    initAvatarLightbox();
  initAnchors();
  await setLang(CURRENT_LANG);
});
