import { useLanguage } from "../LanguageContext";
import { WA_NUMBER } from "../config";

export default function Footer() {
  const { lang } = useLanguage();
  const content = {
    en: {
      tag: "every ride.",
      contact: "Contact",
      routes: "Routes",
      dest: "Destinations",
      comp: "Company",
      admin: "Admin",
      daily: "24/7 · daily",
      r1: "Airport transfers", r2: "Cross-country", r3: "Day trips", r4: "Custom itineraries",
      c1: "About", c2: "Fleet", c3: "Terms", c4: "Instagram",
      b1: "Licensed transport · INS insured · SJO / LIR", b2: "Made with ☀ in Costa Rica"
    },
    es: {
      tag: "cada viaje.",
      contact: "Contacto",
      routes: "Rutas",
      dest: "Destinos",
      comp: "Compañía",
      admin: "Admin",
      daily: "24/7 · diario",
      r1: "Traslados de aeropuerto", r2: "Viajes nacionales", r3: "Tours de un día", r4: "Itinerarios a medida",
      c1: "Nosotros", c2: "Flota", c3: "Términos", c4: "Instagram",
      b1: "Transporte con licencia · Seguro INS · SJO / LIR", b2: "Hecho con ☀ en Costa Rica"
    }
  };
  const t = content[lang];

  return (
    <footer className="footer">
      <div className="footer-big">
        Pura <em>Vida</em>,<br/>
        <span className="outline">{t.tag}</span>
      </div>
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <h5>{t.contact}</h5>
            <ul>
              <li><a className="footer-phone" href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer">WhatsApp · <span>+506 6105-7000</span></a></li>
              <li><a href="mailto:info@theridecr.com">info@theridecr.com</a></li>
              <li><span>{t.daily}</span></li>
            </ul>
          </div>
          <div>
            <h5>{t.routes}</h5>
            <ul>
              <li><a href="#map">{t.r1}</a></li>
              <li><a href="#map">{t.r2}</a></li>
              <li><a href="#map">{t.r3}</a></li>
              <li><a href="#map">{t.r4}</a></li>
            </ul>
          </div>
          <div>
            <h5>{t.dest}</h5>
            <ul>
              <li><a href="#map">La Fortuna / Arenal</a></li>
              <li><a href="#map">Monteverde</a></li>
              <li><a href="#map">Manuel Antonio</a></li>
              <li><a href="#map">Tortuguero</a></li>
              <li><a href="#map">Rincón de la Vieja</a></li>
              <li><a href="#map">Puerto Viejo</a></li>
            </ul>
          </div>
          <div>
            <h5>{t.comp}</h5>
            <ul>
              <li><a href="#top">{t.c1}</a></li>
              <li><a href="#vehicle">{t.c2}</a></li>
              <li><span>{t.c3}</span></li>
              <li><a href="https://instagram.com/theridecr" target="_blank" rel="noopener noreferrer">{t.c4}</a></li>
              <li><a href="?admin=1">{t.admin}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 The Ride CR · San José</span>
          <span>{t.b1}</span>
          <span>{t.b2}</span>
        </div>
      </div>
    </footer>
  );
}
