import React from "react";
import Icon from "./Icon";
import { useLanguage } from "../LanguageContext";
import arenal from "../assets/arenal.png";
import monteverde from "../assets/monteverde.png";
import tamarindo from "../assets/tamarindo.png";
import puertoviejo from "../assets/puertoviejo.png";

export default function Destinations() {
  const { lang } = useLanguage();
  
  const content = {
    en: {
      tag: "§04 · Destinations",
      title1: "Pura", title2: "vida,", title3: "delivered.",
      c1t: "La Fortuna", c1s: "Volcano & thermal springs", c1c: "AR · VOLCANO",
      c2t: "Monteverde", c2s: "Cloud forest canopy", c2c: "MV · 1440 MASL",
      c3t: "Tamarindo", c3s: "Guanacaste surf break", c3c: "TAM · PACIFIC",
      c4t: "Puerto Viejo", c4s: "Afro-Caribbean coast", c4c: "PV · LIMÓN"
    },
    es: {
      tag: "§04 · Destinos",
      title1: "Pura", title2: "vida,", title3: "a tu alcance.",
      c1t: "La Fortuna", c1s: "Volcán y aguas termales", c1c: "AR · VOLCÁN",
      c2t: "Monteverde", c2s: "Bosque nuboso", c2c: "MV · 1440 MSNM",
      c3t: "Tamarindo", c3s: "Capital del surf", c3c: "TAM · PACÍFICO",
      c4t: "Puerto Viejo", c4s: "Costa afrocaribeña", c4c: "PV · LIMÓN"
    }
  };
  const t = content[lang];

  const cards = [
    { t: t.c1t, s: t.c1s, code: t.c1c, p: '$200', stamp: 'A', img: arenal },
    { t: t.c2t, s: t.c2s, code: t.c2c, p: '$230', stamp: 'B', img: monteverde },
    { t: t.c3t, s: t.c3s, code: t.c3c, p: '$280', stamp: 'C', img: tamarindo },
    { t: t.c4t, s: t.c4s, code: t.c4c, p: '$300', stamp: 'D', img: puertoviejo },
  ];

  return (
    <section id="destinations" className="destinations">
      <div className="wrap head">
        <span className="section-tag">{t.tag}</span>
        <h2 className="section-title">{t.title1} <em>{t.title2}</em> <br/>{t.title3}</h2>
      </div>
      <div className="wrap postcard-row">
        {cards.map((c, i) => (
          <div key={i} className="postcard">
            <div className="frame" style={{
              backgroundImage: `url(${c.img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              <span className="stamp-mini">{c.stamp}</span>
              <span className="price">{c.p}</span>
            </div>
            <h4>{c.t}</h4>
            <div className="sub">{c.code}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
