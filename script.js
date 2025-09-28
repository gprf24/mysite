// Переводы
const translations = {
  en: {
    title: "Hello!",
    about: "This is a simple website about me.",
  },
  de: {
    title: "Hallo!",
    about: "Dies ist eine einfache Website über mich.",
  },
  ru: {
    title: "Привет!",
    about: "Это простой сайт обо мне.",
  },
};

// Бургер-меню
const burger = document.getElementById("burger");
const navLinks = document.getElementById("nav-links");

burger.addEventListener("click", () => {
  navLinks.style.display =
    navLinks.style.display === "flex" ? "none" : "flex";
});

// Смена языка
document.querySelectorAll("[data-lang]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    const lang = el.getAttribute("data-lang");
    document.getElementById("title").textContent = translations[lang].title;
    document.getElementById("about").textContent = translations[lang].about;
  });
});
