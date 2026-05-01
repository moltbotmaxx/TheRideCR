import React from "react";
import { useLanguage } from "../LanguageContext";

export default function MobileHeader() {
  const { lang, toggleLang } = useLanguage();
  
  return (
    <div className="mobile-header">
      <div className="logo-mini">
        TheRide<span className="gold">CR</span>
      </div>
      <button 
        className="mobile-lang-btn"
        onClick={toggleLang}
      >
        {lang === 'en' ? 'ES' : 'EN'}
      </button>
    </div>
  );
}
