import React from "react";
import Icon from "./Icon";
import { motion } from "framer-motion";
import { useLanguage } from "../LanguageContext";

function navigateTab(e, tab) {
  if (window.innerWidth <= 820) {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('therideapp:navigate', { detail: { tab } }));
  }
}

export default function Hero() {
  const { lang } = useLanguage();
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const hhmm = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  
  const text = {
    en: {
      est: "Est. 2018 · San José, CR",
      time: `Local time ${hhmm} · 26°C`,
      kicker: "Pura Vida Premium Transport · 24/7",
      title: ["Costa Rica,", "door to door,", "in style."],
      aboutTitle: "About the ride",
      aboutDesc: "Private transfers across Costa Rica in a premium 5-seater sedan — bilingual driver, every back road known.",
      ctaQuote: "Get a quote",
      ctaCar: "Meet the car",
      whatTitle: "What we do",
      whatDesc: "Airport pickups · Hotel transfers · Cross-country · Day tours",
      scroll: "Scroll"
    },
    es: {
      est: "Est. 2018 · San José, CR",
      time: `Hora local ${hhmm} · 26°C`,
      kicker: "Transporte Premium Pura Vida · 24/7",
      title: ["Costa Rica,", "puerta a puerta,", "con estilo."],
      aboutTitle: "Sobre el viaje",
      aboutDesc: "Traslados privados por toda Costa Rica en un sedán premium de 5 plazas: conductor bilingüe, conocemos cada ruta.",
      ctaQuote: "Obtener cotización",
      ctaCar: "Conozca el vehículo",
      whatTitle: "Lo que hacemos",
      whatDesc: "Recogidas en aeropuerto · Traslados a hoteles · Viajes nacionales · Tours de un día",
      scroll: "Desplazar"
    }
  };

  const t = text[lang];

  return (
    <section id="top" className="hero">
      <div className="hero-bg"></div>
      <div className="hero-corner">
        <div>{t.est}</div>
        <div className="big">N 9.93° / W 84.08°</div>
        <div>{t.time}</div>
      </div>
      <div className="hero-inner">
        <motion.div 
          className="hero-headline"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="hero-kicker"><span className="dot"></span> {t.kicker}</div>
          <h1 className="hero-title">
            {t.title[0]}<br/>
            <em>{t.title[1]}</em><br/>
            <span className="outline">{t.title[2]}</span>
          </h1>
        </motion.div>
        <motion.div 
          className="hero-foot"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <div className="col">
            <span className="label">{t.aboutTitle}</span>
            <p>{t.aboutDesc}</p>
          </div>
          <div className="hero-cta">
            <a href="#booking" className="btn btn-primary" onClick={(e) => navigateTab(e, 'book')}>{t.ctaQuote} <Icon.Arrow size={18}/></a>
            <a href="#vehicle" className="btn btn-ghost" onClick={(e) => navigateTab(e, 'fleet')}>{t.ctaCar}</a>
          </div>
          <div className="col right">
            <span className="label">{t.whatTitle}</span>
            <p>{t.whatDesc}</p>
          </div>
        </motion.div>
      </div>
      <motion.a 
        href="#booking" 
        className="hero-scroll"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <span>{t.scroll}</span>
        <Icon.ArrowDown size={14}/>
      </motion.a>
    </section>
  );
}
