import React from "react";
import { useLanguage } from "../LanguageContext";
import Icon from "./Icon";
import { motion, AnimatePresence } from "framer-motion";
import sedanImg from "../assets/sedan_illustration.png";
import interiorImg from "../assets/interior.png";

export default function Vehicle() {
  const { lang } = useLanguage();
  const [view, setView] = React.useState('ext'); // 'ext' or 'int'

  const content = {
    en: {
      tag: "§02 · The Vehicle",
      title1: "Nissan",
      title2: "Versa 2022.",
      desc: "Modern, spotless, and built for long Central American highways. Full leather interior, USB-C charging, chilled bottled water, and a class-leading trunk big enough for three checked bags.",
      spec1: "Capacity", spec1v: "5 pax",
      spec2: "Luggage", spec2v: "3 + carry",
      spec3: "Climate", spec3v: "Dual A/C",
      spec4: "Connectivity", spec4v: "Free Wi-Fi",
      badge1: "Fresh-washed daily",
      badge2: "Leather · Cool A/C",
      badge3: "Trunk: 3 suitcases",
      ext: "Exterior",
      int: "Interior"
    },
    es: {
      tag: "§02 · El Vehículo",
      title1: "Nissan",
      title2: "Versa 2022.",
      desc: "Moderno, impecable y diseñado para las largas carreteras centroamericanas. Interior de cuero, carga USB-C, agua fría y un maletero líder en su clase suficientemente grande para tres maletas de bodega.",
      spec1: "Capacidad", spec1v: "5 pax",
      spec2: "Equipaje", spec2v: "3 + mano",
      spec3: "Clima", spec3v: "A/C Dual",
      spec4: "Conectividad", spec4v: "Wi-Fi Gratis",
      badge1: "Lavado diario",
      badge2: "Cuero · A/C Frío",
      badge3: "Maletero: 3 valijas",
      ext: "Exterior",
      int: "Interior"
    }
  };
  const t = content[lang];

  return (
    <section id="vehicle" className="vehicle">
      <div className="wrap vehicle-grid">
        <motion.div 
          className="vehicle-text"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="section-tag">{t.tag}</span>
          <h2 className="section-title">{t.title1} <em>{t.title2}</em></h2>
          <p>{t.desc}</p>
          <div className="specs">
            <div className="spec"><span className="k">{t.spec1}</span><span className="v">{t.spec1v}</span></div>
            <div className="spec"><span className="k">{t.spec2}</span><span className="v">{t.spec2v}</span></div>
            <div className="spec"><span className="k">{t.spec3}</span><span className="v">{t.spec3v}</span></div>
            <div className="spec"><span className="k">{t.spec4}</span><span className="v">{t.spec4v}</span></div>
          </div>
          
          <div className="view-toggle">
            <button className={view==='ext'?'active':''} onClick={()=>setView('ext')}>{t.ext}</button>
            <button className={view==='int'?'active':''} onClick={()=>setView('int')}>{t.int}</button>
          </div>
        </motion.div>

        <div className="vehicle-visual">
          <AnimatePresence mode="wait">
            {view === 'ext' ? (
              <motion.div 
                key="ext"
                className="sedan-wrap"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="sun"></div>
                <img src={sedanImg} alt="Nissan Versa 2022" className="sedan" />
                <motion.span className="badge b1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>◉ {t.badge1}</motion.span>
                <motion.span className="badge b2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>◉ {t.badge2}</motion.span>
                <motion.span className="badge b3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>◉ {t.badge3}</motion.span>
              </motion.div>
            ) : (
              <motion.div 
                key="int"
                className="interior-wrap"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <img src={interiorImg} alt="Luxury Interior" className="interior-img" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
