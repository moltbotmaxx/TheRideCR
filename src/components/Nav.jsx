import React from "react";
import Icon from "./Icon";
import { useLanguage } from "../LanguageContext";

export default function Nav() {
  const { lang, toggleLang } = useLanguage();
  const content = {
    en: { vehicle: "Vehicle", routes: "Routes", dest: "Destinations", book: "Book Now →" },
    es: { vehicle: "Vehículo", routes: "Rutas", dest: "Destinos", book: "Reservar →" }
  };
  const t = content[lang];

  return (
    <nav className="nav">
      <a href="#top" className="logo" aria-label="TheRideCR">
        <svg className="logo-mark" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M7 22 C 12 8, 24 8, 29 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          <circle cx="11.5" cy="22" r="2.2" fill="currentColor"/>
          <circle cx="24.5" cy="22" r="2.2" fill="currentColor"/>
          <path d="M11 22 L25 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span className="logo-word">
          <span className="lw-dim">The</span>Ride<span className="lw-accent">CR</span>
        </span>
      </a>
      <div className="links">
        <a href="#vehicle" className="hide-sm">{t.vehicle}</a>
        <a href="#map" className="hide-sm">{t.routes}</a>
        <a href="#destinations" className="hide-sm">{t.dest}</a>
        <a href="#booking" className="book">{t.book}</a>
        <button 
          className="lang-btn" 
          onClick={toggleLang}
        >
          {lang === 'en' ? 'ES' : 'EN'}
        </button>
      </div>
    </nav>
  );
}
