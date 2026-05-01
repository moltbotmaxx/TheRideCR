import React from "react";
import { motion } from "framer-motion";
import alfonsoImg from "../assets/alfonso.png";
import { MapPin, Globe, Heart } from "lucide-react";
import { useLanguage } from "../LanguageContext";

export default function DriverProfile() {
  const { lang } = useLanguage();
  
  const content = {
    en: {
      tag: "§05 · Your Driver",
      name: "Alfonso",
      surname: "Perez",
      location: "Heredia, CR",
      langText: "English Spoken",
      badge: "Route expert",
      bio: "Medical doctor by profession and passionate about local tourism, an undisputed expert on Costa Rica's most beautiful routes. His dedication to well-being and exceptional service ensures a safe and memorable journey.",
      family: "A family man; alongside his wife and son Nikola, he understands the value of a peaceful and safe trip for your loved ones."
    },
    es: {
      tag: "§05 · Tu Chofer",
      name: "Alfonso",
      surname: "Pérez",
      location: "Heredia, CR",
      langText: "Habla Inglés",
      badge: "Experto en rutas",
      bio: "Médico de profesión y apasionado del turismo local, experto indiscutible en las rutas más hermosas de Costa Rica. Su dedicación por el bienestar y el servicio excepcional aseguran un viaje seguro y memorable.",
      family: "Hombre de familia; junto a su esposa y su hijo Nikola, entiende el valor de un viaje tranquilo y seguro para los tuyos."
    }
  };
  
  const t = content[lang];

  return (
    <section className="driver-profile">
      <div className="wrap">
        <div className="driver-card">
          <motion.div 
            className="driver-image-wrapper"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <img src={alfonsoImg} alt="Alfonso Perez" className="driver-png" />
            <div className="driver-badge">{t.badge}</div>
          </motion.div>

          <motion.div 
            className="driver-info"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <span className="section-tag">{t.tag}</span>
            <h2 className="section-title">{t.name} <em>{t.surname}</em></h2>
            
            <div className="driver-meta">
              <div className="meta-item"><MapPin size={16} /> {t.location}</div>
              <div className="meta-item"><Globe size={16} /> {t.langText}</div>
            </div>

            <p className="driver-bio">
              {t.bio}
            </p>

            <div className="driver-family">
              <Heart size={16} className="heart-icon" />
              <span>{t.family}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
