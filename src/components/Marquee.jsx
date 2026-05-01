import React from "react";
import Icon from "./Icon";
import { useLanguage } from "../LanguageContext";

export default function Marquee() {
  const { lang } = useLanguage();
  const content = {
    en: ['Airport Transfers', 'Beach Runs', 'Volcano Day Trips', 'Cloud Forest', 'Jungle Lodges', 'Surf Camps', 'Guanacaste', 'Nicoya', 'Caribbean', 'Zona Sur'],
    es: ['Traslados de Aeropuerto', 'Viajes a la Playa', 'Tours a Volcanes', 'Bosque Nuboso', 'Eco Lodges', 'Campamentos de Surf', 'Guanacaste', 'Nicoya', 'Caribe', 'Zona Sur']
  };
  const items = content[lang];
  const row = (
    <span>
      {items.map((t, i) => <React.Fragment key={i}>{t}<span className="star">✶</span></React.Fragment>)}
    </span>
  );
  return (
    <div className="marquee">
      <div className="marquee-track">{row}{row}</div>
    </div>
  );
}
