/* ========= Small site helpers ========= */
// Set current year in footer
function initYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

// Burger menu toggle
function initBurger() {
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav-links");
  if (!burger || !nav) return;

  burger.addEventListener("click", () => {
    const expanded = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("open", !expanded);
  });

  // Close menu after clicking an in-page link
  nav.querySelectorAll("a[href^='#']").forEach((a) => {
    a.addEventListener("click", () => {
      burger.setAttribute("aria-expanded", "false");
      nav.classList.remove("open");
    });
  });
}

// Optional: simple theme toggle (light/dark by html class)
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const root = document.documentElement;
    const isLight = root.classList.toggle("light");
    try { localStorage.setItem("theme", isLight ? "light" : "dark"); } catch {}
  });

  // Restore saved theme
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light") document.documentElement.classList.add("light");
  } catch {}
}

// Optional: config bindings (data-config / data-config-src / data-config-href)
function applyConfigBindings(config) {
  // textContent
  document.querySelectorAll("[data-config]").forEach(el => {
    const key = el.getAttribute("data-config");
    if (key && config[key] != null) el.textContent = String(config[key]);
  });

  // src (images)
  document.querySelectorAll("[data-config-src]").forEach(el => {
    const key = el.getAttribute("data-config-src");
    if (key && config[key]) el.setAttribute("src", config[key]);
  });

  // href
  document.querySelectorAll("[data-config-href]").forEach(el => {
    const key = el.getAttribute("data-config-href");
    if (key && config[key]) el.setAttribute("href", config[key]);
  });
}

/* ========= Avatar lightbox ========= */
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
  btn.setAttribute('aria-label', 'Close'); // add i18n similarly if you want
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


/* ========= Projects modal =========
   - Opens modal by clicking anywhere on a .project-card (links with [data-ignore-modal] will navigate instead)
   - Fills modal from per-card hidden fields:
       .modal-title / .card-title
       .modal-desc  / .card-desc  (HTML allowed only in .modal-desc)
       .modal-tech  / .card-tech
       [data-screenshot], [data-link-live], [data-link-code]
       .modal-live-label / .card-live-label
       .modal-code-label / .card-code-label
   - Image: wheel/pinch zoom (enableImageZoom)
*/
function initProjectModals(){
  const modal = document.getElementById('projModal');
  if (!modal) return;

  // Cache modal elements
  const dlg      = modal.querySelector('.proj-dialog');
  const img      = document.getElementById('projImg');
  const titleEl  = document.getElementById('projTitle');
  const descEl   = document.getElementById('projDesc');
  const techEl   = document.getElementById('projTech');
  const liveBtn  = document.getElementById('projLive');
  const codeBtn  = document.getElementById('projCode');
  const btnClose = modal.querySelector('.proj-close');

  // Enable wheel/pinch zoom for the screenshot (no click-to-zoom)
  enableImageZoom(img, { maxScale: 6, step: 0.25 });

  let lastTrigger = null; // for focus restoration on close

  // --- Fill modal content from the clicked card ---
  function fillFrom(card){
    // Title: prefer detailed modal title, then card title, else fallback
    const titleText =
      card.querySelector('.modal-title')?.textContent?.trim() ||
      card.querySelector('.card-title')?.textContent?.trim() ||
      'Project';

    // Description: prefer .modal-desc (HTML allowed), else use plain text from .card-desc
    const descHtml =
      card.querySelector('.modal-desc')?.innerHTML?.trim() ||
      card.querySelector('.card-desc')?.textContent?.trim() || '';

    // Tech stack: per-project tech if provided
    const techText =
      card.querySelector('.modal-tech')?.textContent?.trim() ||
      card.querySelector('.card-tech')?.textContent?.trim() || '';

    // Links (live is required-ish, code is optional)
    const liveHref = card.getAttribute('data-link-live')
      || card.querySelector('a.project-link')?.getAttribute('href') || '#';
    const codeHref = card.getAttribute('data-link-code') || '#';

    // Optional per-project labels for buttons (override i18n defaults in modal)
    const liveLbl =
      card.querySelector('.modal-live-label')?.textContent?.trim() ||
      card.querySelector('.card-live-label')?.textContent?.trim() || null;

    const codeLbl =
      card.querySelector('.modal-code-label')?.textContent?.trim() ||
      card.querySelector('.card-code-label')?.textContent?.trim() || null;

    // Screenshot URL
    const shot = card.getAttribute('data-screenshot');

    // --- Apply to modal DOM ---
    titleEl.textContent = titleText;
    descEl.innerHTML    = descHtml;    // allow HTML here
    techEl.textContent  = techText;

    if (shot && shot.trim()){
      img.src = shot;
      img.alt = `${titleText} screenshot`;
      img.style.display = '';
    } else {
      img.removeAttribute('src');
      img.alt = '';
      img.style.display = 'none';
    }

    // Buttons: set hrefs + optional per-project labels
    liveBtn.href = liveHref;
    if (liveLbl) liveBtn.textContent = liveLbl;

    codeBtn.href = codeHref;
    codeBtn.style.display = (codeHref && codeHref !== '#') ? '' : 'none';
    if (codeLbl) codeBtn.textContent = codeLbl;
  }

  // --- Open/close logic ---
  function openFrom(card, trigger){
    lastTrigger = trigger || card;
    fillFrom(card);
        // --- Reset zoom state on each open ---
    if (img) {
      img.classList.remove('zoomed', 'grab', 'grabbing');
      img.style.removeProperty('--scale');
      img.style.removeProperty('--tx');
      img.style.removeProperty('--ty');
      img.style.transform = 'none';
      img.style.cursor = 'default';
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.documentElement.style.overflow = 'hidden';
    btnClose.focus();
    window.addEventListener('keydown', onKeydown);
  }

  function close(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow = '';
    window.removeEventListener('keydown', onKeydown);
    if (lastTrigger) lastTrigger.focus();
  }

  function onKeydown(e){
    if (e.key === 'Escape') close();
  }

  // Click anywhere on .project-card to open (except explicit navigation links)
  document.addEventListener('click', (e)=>{
    const card = e.target.closest('.project-card');
    if (!card) return;

    const link = e.target.closest('a');
    if (link) {
      // Allow links with [data-ignore-modal] to navigate
      if (link.hasAttribute('data-ignore-modal')) return;
      // Any other link inside the card should just navigate as usual
      return;
    }
    openFrom(card, card);
  });

  // Keyboard accessibility — Enter/Space on focused card
  document.addEventListener('keydown', (e)=>{
    if (!['Enter',' '].includes(e.key)) return;
    const card = document.activeElement.closest?.('.project-card');
    if (!card) return;
    e.preventDefault();
    openFrom(card, card);
  });

  // Close handlers
  btnClose.addEventListener('click', close);
  modal.addEventListener('click', (e)=>{ if (e.target === modal) close(); });
}


// Wheel / pinch zoom with pan (no click-to-zoom)
// - Wheel zooms towards cursor
// - Pinch zoom on touch devices
// - Drag to pan only when zoomed
function enableImageZoom(img, opts = {}) {
  if (!img) return;

  const parent = img.closest('.proj-media') || img.parentElement;
  const minScale = 1;
  const maxScale = opts.maxScale || 5;
  const step = opts.step || 0.2;   // wheel step
  const rubber = 24;               // pan bounds tolerance

  let scale = 1, tx = 0, ty = 0;
  let dragging = false;
  let startX = 0, startY = 0, startTx = 0, startTy = 0;

  // compute contained image size
  function getBaseSize() {
    const cw = parent.clientWidth, ch = parent.clientHeight;
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const f = Math.min(cw / iw, ch / ih);
    return { baseW: iw * f, baseH: ih * f, cw, ch };
  }

  function clampPan(s = scale) {
    const { baseW, baseH, cw, ch } = getBaseSize();
    const sw = baseW * s, sh = baseH * s;
    const maxX = Math.max(0, (sw - cw) / 2) + rubber;
    const maxY = Math.max(0, (sh - ch) / 2) + rubber;
    tx = Math.min(maxX, Math.max(-maxX, tx));
    ty = Math.min(maxY, Math.max(-maxY, ty));
  }

  function applyTransform() {
    clampPan();
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    img.style.cursor = scale === 1 ? "default" : (dragging ? "grabbing" : "grab");
  }

  function zoomAt(clientX, clientY, nextScale) {
    nextScale = Math.max(minScale, Math.min(maxScale, nextScale));
    if (nextScale === scale) return;

    const rect = parent.getBoundingClientRect();
    const cx = clientX - (rect.left + rect.width / 2);
    const cy = clientY - (rect.top + rect.height / 2);

    const k = nextScale / scale;
    tx = (tx - cx) * k + cx;
    ty = (ty - cy) * k + cy;

    scale = nextScale;
    applyTransform();
  }

  function reset() {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  }

  // --- Wheel zoom (desktop) ---
  parent.addEventListener("wheel", (e) => {
    e.preventDefault();
    const dir = e.deltaY > 0 ? -1 : 1; // up zooms in, down zooms out
    zoomAt(e.clientX, e.clientY, scale * (1 + dir * step));
  }, { passive: false });

  // --- Mouse drag pan (only when zoomed) ---
  parent.addEventListener("mousedown", (e) => {
    if (scale === 1 || e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    img.style.cursor = "grabbing";
    startX = e.clientX; startY = e.clientY;
    startTx = tx; startTy = ty;

    const onMove = (ev) => {
      tx = startTx + (ev.clientX - startX);
      ty = startTy + (ev.clientY - startY);
      applyTransform();
    };
    const onUp = () => {
      dragging = false;
      applyTransform();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });

  // --- Touch pinch zoom & one-finger pan ---
  let pinchStartDist = 0, pinchStartScale = 1, pinchCenter = null;
  parent.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      const [a, b] = e.touches;
      pinchStartDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      pinchStartScale = scale;
      pinchCenter = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
    } else if (e.touches.length === 1 && scale > 1) {
      const t = e.touches[0];
      dragging = true;
      startX = t.clientX; startY = t.clientY;
      startTx = tx; startTy = ty;
    }
  }, { passive: true });

  parent.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      const [a, b] = e.touches;
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      const next = pinchStartScale * (dist / pinchStartDist);
      zoomAt(pinchCenter.x, pinchCenter.y, next);
    } else if (e.touches.length === 1 && dragging) {
      const t = e.touches[0];
      tx = startTx + (t.clientX - startX);
      ty = startTy + (t.clientY - startY);
      applyTransform();
    }
  }, { passive: true });

  parent.addEventListener("touchend", () => { dragging = false; });

  // Optional: ESC to reset on desktop
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && scale !== 1 && parent.closest('.proj-backdrop.open')) reset();
  });

  // init
  applyTransform();
}


/* ========= i18n (flat keys) ========= */
const SUPPORTED_LOCALES = ["en", "de", "ru"];
const LS_LANG_KEY = "locale";
// YYYYMM cache-busting for JSON
const I18N_VERSION = new Date().toISOString().slice(0,7).replace('-','');

function detectInitialLang() {
  try {
    const saved = localStorage.getItem(LS_LANG_KEY);
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
  } catch {}
  const nav = (navigator.language || navigator.userLanguage || "").toLowerCase();
  const short = nav.split("-")[0];
  return SUPPORTED_LOCALES.includes(short) ? short : "en";
}

async function loadDict(lang) {
  const url = `i18n/${lang}.json?v=${I18N_VERSION}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`i18n fetch failed: ${res.status}`);
  return res.json();
}

// Apply translations to elements with data-i18n / data-i18n-attr
function applyI18n(dict) {
  // Text content nodes
  document.querySelectorAll("[data-i18n]").forEach(el => {
    // Skip those that also specify data-i18n-attr (handled below)
    if (el.hasAttribute("data-i18n-attr")) return;
    const key = el.getAttribute("data-i18n");
    if (key && dict[key] != null) {
      el.textContent = dict[key];
    }
  });

  // Attribute targets (single attribute per element)
  document.querySelectorAll("[data-i18n-attr]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const attr = el.getAttribute("data-i18n-attr");
    if (!key || !attr) return;
    if (dict[key] != null) el.setAttribute(attr, dict[key]);
  });

  // <title> inside <head>
  const titleEl = document.querySelector("title[data-i18n]");
  if (titleEl) {
    const key = titleEl.getAttribute("data-i18n");
    if (key && dict[key] != null) document.title = dict[key];
  }

  // Update <html lang="..."> for accessibility/SEO
  const currentLang = getCurrentLang();
  document.documentElement.setAttribute("lang", currentLang);
}

function getCurrentLang() {
  try {
    return localStorage.getItem(LS_LANG_KEY) || detectInitialLang();
  } catch {
    return detectInitialLang();
  }
}

async function setLang(lang) {
  if (!SUPPORTED_LOCALES.includes(lang)) lang = "en";
  try { localStorage.setItem(LS_LANG_KEY, lang); } catch {}
  const dict = await loadDict(lang);
  applyI18n(dict);
}

/* ========= Boot ========= */
document.addEventListener("DOMContentLoaded", () => {
  initYear();
  initBurger();
  initThemeToggle();
  initAvatarLightbox();
  initProjectModals();

  // Example config you can wire from your own source
  const SITE_CONFIG = {
    firstName: "Aleksandr",
    fullName:  "Aleksandr Ditkin",
    location:  "Hamburg, DE",
    langs:     "EN · DE · RU",
    emailText: "ditkincontact@gmail.com",
    email:     "mailto:ditkincontact@gmail.com",
    mailto:    "mailto:ditkincontact@gmail.com",
    linkedinText: "/aleksandrditkin",
    linkedin:     "https://www.linkedin.com/in/aleksandrditkin",
    avatar:    "img/me.jpg",
    statLanguages: "3"
  };
  applyConfigBindings(SITE_CONFIG);

  // Init language and wire language buttons
  setLang(getCurrentLang()).catch(console.error);
  document.querySelectorAll(".lang-btn[data-lang]").forEach(btn => {
    btn.addEventListener("click", () => {
      setLang(btn.getAttribute("data-lang")).catch(console.error);
    });
  });
});
