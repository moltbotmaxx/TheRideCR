import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../LanguageContext";

const AIRPORT = "Juan Santamaria International Airport, Alajuela, Costa Rica";

function getRouteEmbedUrl(destination) {
  const params = new URLSearchParams({
    saddr: AIRPORT,
    daddr: destination,
    dirflg: "d",
    output: "embed",
    z: "9",
  });
  return `https://maps.google.com/maps?${params.toString()}`;
}

export default function RouteMap() {
  const { lang } = useLanguage();
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth <= 820);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 820);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const content = {
    en: {
      tag: "§03 · Where we go",
      title1: "The 7", title2: "wonders.", title3: "One route.",
      desc: "A curated route board for Costa Rica's most requested places. These are not the only trips we do; they are the best starting points for planning anything from a direct transfer to a full travel day.",
      from: "Juan Santamaria Airport",
      estimate: "Estimated route",
      mapBadge: "Single driving route",
      labels: { time: "Drive", distance: "Distance", fare: "Fare" },
      places: [
        ["La Fortuna / Arenal", "Volcano & hot springs", "La Fortuna, Costa Rica", "3h 10m", "116 km", "$200"],
        ["Monteverde", "Cloud forest & zip-lines", "Monteverde, Costa Rica", "3h 30m", "140 km", "$230"],
        ["Manuel Antonio", "Rainforest meets beach", "Manuel Antonio, Costa Rica", "3h 00m", "156 km", "$250"],
        ["Tortuguero", "Canals & wildlife", "Tortuguero, Costa Rica", "3h 30m", "120 km", "$280"],
        ["Rincon de la Vieja", "Volcano trails", "Rincon de la Vieja National Park, Costa Rica", "4h 10m", "245 km", "$330"],
        ["Tamarindo", "Guanacaste surf", "Tamarindo, Costa Rica", "4h 40m", "255 km", "$280"],
        ["Puerto Viejo", "Caribbean culture", "Puerto Viejo de Talamanca, Costa Rica", "4h 50m", "230 km", "$300"],
      ],
    },
    es: {
      tag: "§03 · Dónde vamos",
      title1: "Las 7", title2: "maravillas.", title3: "Tu ruta.",
      desc: "Una selección de los lugares turísticos más pedidos de Costa Rica. No son los únicos viajes que hacemos; son el mejor punto de partida para planear desde un traslado directo hasta un día completo en ruta.",
      from: "Aeropuerto Juan Santamaría",
      estimate: "Ruta estimada",
      mapBadge: "Una sola ruta en carro",
      labels: { time: "Manejo", distance: "Distancia", fare: "Tarifa" },
      places: [
        ["La Fortuna / Arenal", "Volcán y aguas termales", "La Fortuna, Costa Rica", "3h 10m", "116 km", "$200"],
        ["Monteverde", "Bosque nuboso", "Monteverde, Costa Rica", "3h 30m", "140 km", "$230"],
        ["Manuel Antonio", "Selva y mar", "Manuel Antonio, Costa Rica", "3h 00m", "156 km", "$250"],
        ["Tortuguero", "Canales y fauna", "Tortuguero, Costa Rica", "3h 30m", "120 km", "$280"],
        ["Rincón de la Vieja", "Senderos volcánicos", "Rincon de la Vieja National Park, Costa Rica", "4h 10m", "245 km", "$330"],
        ["Tamarindo", "Surf en Guanacaste", "Tamarindo, Costa Rica", "4h 40m", "255 km", "$280"],
        ["Puerto Viejo", "Cultura caribeña", "Puerto Viejo de Talamanca, Costa Rica", "4h 50m", "230 km", "$300"],
      ],
    }
  };
  const t = content[lang];

  const pins = t.places.map(([name, blurb, query, time, distance, fare], index) => ({
    id: index,
    num: String(index + 1).padStart(2, "0"),
    name,
    blurb,
    query,
    time,
    distance,
    fare,
  }));
  const [active, setActive] = React.useState(0);
  const act = pins[active];
  const routeUrl = getRouteEmbedUrl(act.query);
  const headReveal = isMobile
    ? { initial: false, animate: { opacity: 1, y: 0 }, transition: { duration: 0.18, ease: "easeOut" } }
    : {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-100px" },
        transition: { duration: 0.8, ease: "easeOut" },
      };
  const pinListReveal = isMobile
    ? { initial: false, animate: "visible" }
    : { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-50px" } };
  const pinVariants = isMobile
    ? undefined
    : {
        visible: { transition: { staggerChildren: 0.1 } },
        hidden: {},
      };
  const pinItemVariants = isMobile
    ? undefined
    : {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
      };
  const mapReveal = isMobile
    ? { initial: false, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.18, ease: "easeOut" } }
    : {
        initial: { opacity: 0, scale: 0.95 },
        whileInView: { opacity: 1, scale: 1 },
        viewport: { once: true, margin: "-100px" },
        transition: { duration: 0.8, delay: 0.2, ease: "easeOut" },
      };

  return (
    <section id="map" className="routemap">
      <div className="wrap">
        <motion.div 
          className="routemap-head"
          {...headReveal}
        >
          <div>
            <span className="section-tag">{t.tag}</span>
            <h2 className="section-title"><em>{t.title1}</em> {t.title2} <br/>{t.title3}</h2>
          </div>
          <p>{t.desc}</p>
        </motion.div>

        <div className="routemap-grid">
          <motion.div 
            className="pin-list"
            {...pinListReveal}
            variants={pinVariants}
          >
            {pins.map((p, i) => (
              <motion.button
                type="button"
                key={p.id} 
                className={`pin ${i===active?'active':''}`} 
                onClick={() => setActive(i)}
                aria-pressed={i === active}
                variants={pinItemVariants}
              >
                <span className="num">/{p.num}/</span>
                <div>
                  <div className="name">{p.name}</div>
                  <div className="pin-blurb">{p.blurb}</div>
                </div>
                <div className="meta">{p.time}<br />{p.fare}</div>
              </motion.button>
            ))}
          </motion.div>

          <motion.div 
            className="map-canvas route-visual"
            {...mapReveal}
          >
            <span className="mapbadge">{t.mapBadge}</span>
            <AnimatePresence mode="wait">
              <motion.div
                key={act.query}
                className="route-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
              >
                <iframe
                  className="route-frame"
                  title={`${t.from} to ${act.name}`}
                  src={routeUrl}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />

                <div className="route-summary">
                  <span className="mono">{t.estimate}</span>
                  <h3>{act.name}</h3>
                  <div className="route-stats">
                    <div><small>{t.labels.time}</small><strong>{act.time}</strong></div>
                    <div><small>{t.labels.distance}</small><strong>{act.distance}</strong></div>
                    <div><small>{t.labels.fare}</small><strong>{act.fare}</strong></div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
