import { useLanguage } from "../LanguageContext";
import { WA_NUMBER } from "../config";
import "../seo.css";

const content = {
  en: {
    tag: "Airport transfers · Costa Rica",
    title: "Private SJO & LIR airport transfers",
    intro: "Request a private airport pickup with a bilingual English- and Spanish-speaking driver. Travel door to door from Juan Santamaría International Airport (SJO), near San José, or Guanacaste Airport (LIR), near Liberia, to your hotel or next destination in Costa Rica.",
    lastMinuteTitle: "Last-minute airport pickup",
    lastMinute: "Landing soon or need a transfer today? Send your airport, arrival time, destination and passenger count on WhatsApp. Last-minute airport pickup is subject to driver availability. A submitted request is not a confirmed ride; wait for our team to confirm availability, pickup details and the fare.",
    cta: "Ask about last-minute availability",
    message: "Hi, I need a last-minute airport pickup in Costa Rica.",
    routesTitle: "Airport and hotel transfers across Costa Rica",
    routes: "Plan your SJO airport transfer to San José hotels, La Fortuna / Arenal, Monteverde, Manuel Antonio / Quepos or Puerto Viejo. Request a LIR airport transfer to Tamarindo, other Guanacaste destinations or your hotel. Custom pickup addresses and onward transfers can also be requested.",
    stepsTitle: "How to request your transfer",
    steps: [
      "Enter your pickup point, destination, date, Costa Rica pickup time and passenger count in the booking form.",
      "Provide your name and a WhatsApp number with country code. For airport arrivals, share your flight number when coordinating with our team.",
      "Keep your request reference and wait for our team to confirm the ride. Custom routes require a quote.",
    ],
    faqTitle: "Airport pickup questions",
    questions: [
      ["Can I book an airport transfer at the last minute?", "You can request one. Contact us on WhatsApp with your arrival details so we can check availability before you rely on a pickup."],
      ["Which Costa Rica airports do you serve?", "We accept pickup requests for SJO, serving the San José area, and LIR, serving Liberia and Guanacaste. Tell us your destination when requesting a ride."],
      ["Is my ride confirmed after submitting the form?", "No. The form records your request. Our team must confirm availability, the fare and meeting details directly with you."],
      ["What time zone should I use?", "Use the local pickup date and time in Costa Rica (UTC−6), even if you are booking from another country."],
    ],
  },
  es: {
    tag: "Traslados de aeropuerto · Costa Rica",
    title: "Traslados privados desde SJO y LIR",
    intro: "Solicita una recogida privada con un chofer bilingüe en inglés y español. Viaja puerta a puerta desde el Aeropuerto Internacional Juan Santamaría (SJO), cerca de San José, o el Aeropuerto de Guanacaste (LIR), cerca de Liberia, hasta tu hotel o próximo destino en Costa Rica.",
    lastMinuteTitle: "Recogidas de aeropuerto de último minuto",
    lastMinute: "¿Aterrizas pronto o necesitas un traslado hoy? Envía por WhatsApp tu aeropuerto, hora de llegada, destino y cantidad de pasajeros. Las recogidas de último minuto dependen de la disponibilidad del chofer. Enviar una solicitud no confirma el viaje; espera a que nuestro equipo confirme la disponibilidad, los detalles de recogida y la tarifa.",
    cta: "Consultar disponibilidad para hoy",
    message: "Hola, necesito una recogida de aeropuerto de último minuto en Costa Rica.",
    routesTitle: "Traslados de aeropuerto y hotel en Costa Rica",
    routes: "Organiza tu traslado desde SJO a hoteles en San José, La Fortuna / Arenal, Monteverde, Manuel Antonio / Quepos o Puerto Viejo. Solicita un traslado desde LIR a Tamarindo, otros destinos de Guanacaste o tu hotel. También puedes consultar direcciones de recogida personalizadas y traslados entre destinos.",
    stepsTitle: "Cómo solicitar tu traslado",
    steps: [
      "Ingresa el punto de recogida, destino, fecha, hora local de Costa Rica y cantidad de pasajeros en el formulario.",
      "Indica tu nombre y un número de WhatsApp con código de país. Para llegadas al aeropuerto, comparte tu número de vuelo al coordinar con nuestro equipo.",
      "Guarda la referencia de tu solicitud y espera la confirmación del equipo. Las rutas personalizadas requieren una cotización.",
    ],
    faqTitle: "Preguntas sobre recogidas de aeropuerto",
    questions: [
      ["¿Puedo reservar un traslado de último minuto?", "Puedes solicitarlo. Escríbenos por WhatsApp con los detalles de llegada para consultar disponibilidad antes de contar con la recogida."],
      ["¿Qué aeropuertos de Costa Rica atienden?", "Aceptamos solicitudes de recogida en SJO, para la zona de San José, y en LIR, para Liberia y Guanacaste. Indica tu destino al solicitar el viaje."],
      ["¿El viaje queda confirmado al enviar el formulario?", "No. El formulario registra tu solicitud. Nuestro equipo debe confirmar contigo la disponibilidad, la tarifa y el punto de encuentro."],
      ["¿Qué zona horaria debo usar?", "Usa la fecha y hora local de recogida en Costa Rica (UTC−6), incluso si haces la reserva desde otro país."],
    ],
  },
};

export default function SeoContent() {
  const { lang } = useLanguage();
  const t = content[lang] || content.en;

  return (
    <section id="airport-transfers" className="airport-guide" aria-labelledby="airport-guide-title">
      <div className="wrap airport-guide-inner">
        <header className="airport-guide-head">
          <span className="section-tag">{t.tag}</span>
          <h2 id="airport-guide-title">{t.title}</h2>
          <p>{t.intro}</p>
        </header>
        <div className="airport-guide-grid">
          <div>
            <h3>{t.lastMinuteTitle}</h3>
            <p>{t.lastMinute}</p>
            <a className="airport-guide-contact" href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t.message)}`} target="_blank" rel="noopener noreferrer">
              {t.cta} <span aria-hidden="true">↗</span>
            </a>
            <p className="airport-guide-phone">WhatsApp · +506 6105-7000</p>
          </div>
          <div>
            <h3>{t.routesTitle}</h3>
            <p>{t.routes}</p>
            <h3>{t.stepsTitle}</h3>
            <ol>{t.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          </div>
        </div>
        <div className="airport-guide-faq">
          <h3>{t.faqTitle}</h3>
          {t.questions.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
