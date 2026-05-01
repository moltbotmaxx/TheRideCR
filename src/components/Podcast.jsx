import React from "react";
import { useLanguage } from "../LanguageContext";

export default function Podcast() {
  const { lang } = useLanguage();

  const content = {
    en: {
      tag: "§07 · Podcast",
      title1: "Listen to", title2: "TheRideCR.",
    },
    es: {
      tag: "§07 · Podcast",
      title1: "Escucha", title2: "TheRideCR.",
    }
  };
  const t = content[lang] || content.en;

  return (
    <section className="podcast" style={{ padding: '80px 0', background: 'var(--ink)', color: 'var(--cream)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="wrap head" style={{ marginBottom: '40px' }}>
        <div>
          <span className="section-tag" style={{ color: 'var(--gold)' }}>{t.tag}</span>
          <h2 className="section-title" style={{ color: 'var(--cream)' }}>{t.title1} <em style={{ color: 'var(--gold)' }}>{t.title2}</em></h2>
        </div>
      </div>
      <div className="wrap" style={{ display: 'flex', justifyContent: 'center' }}>
        <iframe 
          style={{ borderRadius: '12px' }} 
          src="https://open.spotify.com/embed/show/4W2eehoU6oilzOyEyPuEpE?utm_source=generator&theme=0" 
          width="100%" 
          height="352" 
          frameBorder="0" 
          allowFullScreen="" 
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
          loading="lazy">
        </iframe>
      </div>
    </section>
  );
}
