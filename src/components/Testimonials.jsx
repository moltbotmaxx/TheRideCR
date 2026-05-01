import React from "react";
import Icon from "./Icon";
import { useLanguage } from "../LanguageContext";

export default function Testimonials() {
  const { lang } = useLanguage();

  const content = {
    en: {
      tag: "§06 · Testimonials",
      title1: "Travellers", title2: "say.",
      stat: "from 312 riders",
      q1: "Best decision of our trip. Picked us up right on time at SJO and even stopped at a coffee finca on the way to La Fortuna.",
      q2: "Car was spotless, driver was a legend. Felt more like a local friend showing us the way than a transfer.",
      q3: "We had three kids and a mountain of luggage. Everything fit. The ride home was the easiest part of the vacation."
    },
    es: {
      tag: "§06 · Testimonios",
      title1: "Los viajeros", title2: "dicen.",
      stat: "de 312 pasajeros",
      q1: "La mejor decisión de nuestro viaje. Nos recogió a tiempo en el SJO y hasta paramos en una finca cafetalera rumbo a La Fortuna.",
      q2: "El auto estaba impecable y el chofer fue excelente. Se sintió más como un amigo local mostrándonos el país que un simple traslado.",
      q3: "Teníamos tres niños y una montaña de maletas. Todo cupo perfectamente. El viaje de regreso fue la parte más fácil de las vacaciones."
    }
  };
  const t = content[lang];

  const quotes = [
    { q: t.q1, name: 'Hannah & Mark', trip: 'SJO → Arenal' , stars: 5},
    { q: t.q2, name: 'Koji T.', trip: 'LIR → Tamarindo', stars: 5 },
    { q: t.q3, name: 'The Alvarez family', trip: 'Uvita → SJO', stars: 5 },
  ];

  return (
    <section className="testimonials">
      <div className="wrap head">
        <div>
          <span className="section-tag">{t.tag}</span>
          <h2 className="section-title">{t.title1} <em>{t.title2}</em></h2>
        </div>
        <div style={{fontFamily:"'Space Grotesk',sans-serif", fontSize:56, fontWeight:600, lineHeight:1, textAlign:'right'}}>
          4.97<span style={{fontSize:20}}> / 5</span><br/>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', fontStyle:'normal'}}>{t.stat}</span>
        </div>
      </div>
      <div className="wrap quotes">
        {quotes.map((q, i) => (
          <div key={i} className="quote">
            <div className="mark">“</div>
            <p>{q.q}</p>
            <div className="who">
              <span>{q.name} · {q.trip}</span>
              <span className="stars">{'★'.repeat(q.stars)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
