import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  MapPin,
  Navigation2,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "../LanguageContext";
import heroBg from "../assets/hero_bg.jpeg";

function goToTab(tab) {
  window.dispatchEvent(new CustomEvent("therideapp:navigate", { detail: { tab } }));
}

export default function MobileHome() {
  const { lang } = useLanguage();
  const content = {
    en: {
      status: "Online now · San José",
      title: "Private rides across Costa Rica.",
      subtitle: "Airport pickups, hotel transfers and long routes with clear fares before you go.",
      primary: "Reserve ride",
      secondary: "View routes",
      today: "Today",
      ready: "24/7 pickup",
      fareLabel: "Fare",
      fareValue: "Fixed price",
      routeLabel: "Route",
      routeValue: "Door to door",
      routesTitle: "Popular routes",
      routesSub: "Fast starting points",
      servicesTitle: "Trip essentials",
      routes: [
        ["SJO", "San José Hotels", "$60", "25m"],
        ["SJO", "La Fortuna", "$200", "3h 10m"],
        ["SJO", "Manuel Antonio", "$250", "3h"],
      ],
      services: [
        ["Fixed fare", "No surge pricing", ShieldCheck],
        ["Flight tracked", "Airport timing handled", Clock3],
        ["Door to door", "No shared stops", Navigation2],
      ],
    },
    es: {
      status: "En linea · San José",
      title: "Viajes privados por Costa Rica.",
      subtitle: "Aeropuerto, hoteles y rutas largas con tarifas claras antes de salir.",
      primary: "Reservar viaje",
      secondary: "Ver rutas",
      today: "Hoy",
      ready: "24/7 recogidas",
      fareLabel: "Tarifa",
      fareValue: "Precio fijo",
      routeLabel: "Ruta",
      routeValue: "Puerta a puerta",
      routesTitle: "Rutas populares",
      routesSub: "Puntos de salida rapidos",
      servicesTitle: "Esenciales del viaje",
      routes: [
        ["SJO", "Hoteles San José", "$60", "25m"],
        ["SJO", "La Fortuna", "$200", "3h 10m"],
        ["SJO", "Manuel Antonio", "$250", "3h"],
      ],
      services: [
        ["Tarifa fija", "Sin precios dinamicos", ShieldCheck],
        ["Vuelo rastreado", "Llegada coordinada", Clock3],
        ["Puerta a puerta", "Sin paradas compartidas", Navigation2],
      ],
    },
  };
  const t = content[lang];

  return (
    <section className="mobile-home" aria-label="TheRideCR mobile home">
      <motion.div
        className="mobile-hero-panel"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <img src={heroBg} alt="" className="mobile-hero-image" />
        <div className="mobile-hero-shade" />
        <div className="mobile-hero-copy">
          <span className="mobile-status"><span />{t.status}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
          <div className="mobile-hero-actions">
            <button type="button" className="mobile-primary-action" onClick={() => goToTab("book")}>
              <CalendarCheck size={18} />
              {t.primary}
            </button>
            <button type="button" className="mobile-icon-action" onClick={() => goToTab("map")} aria-label={t.secondary}>
              <Navigation2 size={18} />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="mobile-metrics" aria-label="Service highlights">
        <div><span>{t.today}</span><strong>{t.ready}</strong></div>
        <div><span>{t.fareLabel}</span><strong>{t.fareValue}</strong></div>
        <div><span>{t.routeLabel}</span><strong>{t.routeValue}</strong></div>
      </div>

      <div className="mobile-section-head">
        <div>
          <h2>{t.routesTitle}</h2>
          <p>{t.routesSub}</p>
        </div>
        <button type="button" onClick={() => goToTab("map")} aria-label={t.secondary}>
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="mobile-route-scroller">
        {t.routes.map(([from, to, fare, time]) => (
          <button type="button" className="mobile-route-card" key={`${from}-${to}`} onClick={() => goToTab("book")}>
            <span className="route-kicker">{from}</span>
            <strong>{to}</strong>
            <span className="route-meta"><MapPin size={13} />{time}</span>
            <span className="route-fare">{fare}</span>
          </button>
        ))}
      </div>

      <div className="mobile-section-head compact">
        <div>
          <h2>{t.servicesTitle}</h2>
        </div>
      </div>

      <div className="mobile-service-list">
        {t.services.map(([title, desc, ServiceIcon]) => (
          <button type="button" className="mobile-service-row" key={title} onClick={() => goToTab("book")}>
            <span className="service-icon"><ServiceIcon size={18} /></span>
            <span>
              <strong>{title}</strong>
              <small>{desc}</small>
            </span>
            <ArrowRight size={16} />
          </button>
        ))}
      </div>
    </section>
  );
}
