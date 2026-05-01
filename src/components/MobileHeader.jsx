import React from "react";
import { useLanguage } from "../LanguageContext";

function goHome() {
  window.dispatchEvent(new CustomEvent("therideapp:navigate", { detail: { tab: "home" } }));
}

export default function MobileHeader() {
  const { lang, toggleLang } = useLanguage();
  
  return (
    <header className="mobile-header">
      <button type="button" className="logo-mini" onClick={goHome} aria-label="TheRideCR home">
        <span className="logo-dot" />
        <span>TheRide<span className="gold">CR</span></span>
      </button>
      <button 
        className="mobile-lang-btn"
        onClick={toggleLang}
        type="button"
        aria-label="Toggle language"
      >
        {lang === 'en' ? 'ES' : 'EN'}
      </button>
    </header>
  );
}
