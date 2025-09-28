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
