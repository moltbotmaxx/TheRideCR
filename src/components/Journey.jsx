import React from "react";
import Icon from "./Icon";
import { useLanguage } from "../LanguageContext";

export default function Journey() {
  const { lang } = useLanguage();
  const [playing, setPlaying] = React.useState(true);
  const [t, setT] = React.useState(0.12);

  const content = {
    en: {
      tag: "§05 · The route",
      title1: "A calmer", title2: "travel day.",
      s1: "SJO Airport", s2: "Atenas", s3: "Orotina", s4: "Jaco", s5: "Manuel Antonio",
      prog: "Progress", eta: "ETA", min: "min",
      route: "SJO to Manuel Antonio",
      live: "Route pacing",
      active: "Now passing",
      comfort: "Comfort stop",
      bags: "Bags handled",
      weather: "Weather aware",
      note: "The route is paced around daylight, traffic, and the best rest stops."
    },
    es: {
      tag: "§05 · El recorrido",
      title1: "Un viaje", title2: "más tranquilo.",
      s1: "Aeropuerto SJO", s2: "Atenas", s3: "Orotina", s4: "Jaco", s5: "Manuel Antonio",
      prog: "Progreso", eta: "Llegada en", min: "min",
      route: "SJO a Manuel Antonio",
      live: "Ritmo de ruta",
      active: "Pasando por",
      comfort: "Parada cómoda",
      bags: "Equipaje a cargo",
      weather: "Clima previsto",
      note: "La ruta se ajusta a la luz del día, tráfico y las mejores paradas."
    }
  };
  const tx = content[lang];

  React.useEffect(() => {
    if (!playing) return;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setT((prev) => {
        const next = prev + dt * 0.045;
        return next > 1 ? 0 : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const stops = [
    { t: 0.02, title: tx.s1, m: "0 km", time: "06:40" },
    { t: 0.25, title: tx.s2, m: "32 km", time: "07:25" },
    { t: 0.48, title: tx.s3, m: "81 km", time: "08:35" },
    { t: 0.73, title: tx.s4, m: "126 km", time: "09:45" },
    { t: 0.98, title: tx.s5, m: "158 km", time: "10:20" },
  ];
  const activeStop = stops.reduce((current, stop) => (t >= stop.t ? stop : current), stops[0]);
  const mapSrc = "https://www.google.com/maps?q=Juan%20Santamaria%20International%20Airport%20to%20Manuel%20Antonio%20Costa%20Rica&output=embed";

  return (
    <section id="journey" className="journey">
      <div className="wrap head">
        <span className="section-tag">{tx.tag}</span>
        <h2 className="section-title">{tx.title1} <em>{tx.title2}</em></h2>
      </div>
      <div className="wrap">
        <div className="road-wrap">
          <iframe
            className="road-map-frame"
            title={tx.route}
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="map-route-card">
            <span>{tx.route}</span>
            <strong>{activeStop.title}</strong>
            <small>{activeStop.m} · {activeStop.time}</small>
          </div>
        </div>
        <div className="journey-controls">
          <button className="icon-btn" onClick={() => setPlaying((p) => !p)} aria-label="play/pause">
            {playing ? <Icon.Pause size={14}/> : <Icon.Play size={14}/>}
          </button>
          <span className="mono">{tx.prog} {Math.round(t * 100)}%</span>
          <input className="slider" type="range" min="0" max="1" step="0.001" value={t} onChange={(e) => { setT(+e.target.value); setPlaying(false); }} />
          <span className="mono">{tx.eta} {Math.round((1 - t) * 150)} {tx.min}</span>
        </div>
        <p className="journey-note">{tx.note}</p>
      </div>
    </section>
  );
}
