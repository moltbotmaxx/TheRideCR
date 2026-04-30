import React from "react";
import Icon from "./Icon";
import { useLanguage } from "../LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { createReservation } from "../reservationsStore";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
let googleMapsPromise;

const ADDRESS_ALIASES = {
  "SJO Airport": "Juan Santamaria International Airport, Alajuela, Costa Rica",
  "LIR Airport": "Guanacaste Airport, Liberia, Costa Rica",
  "San José Hotels": "San Jose, Costa Rica",
  "San Jose Hotels": "San Jose, Costa Rica",
  "La Fortuna / Arenal": "La Fortuna, Costa Rica",
  "Manuel Antonio / Quepos": "Manuel Antonio, Quepos, Costa Rica",
  "Nicoya / Tamarindo": "Tamarindo, Costa Rica",
  "Uvita / Dominical": "Uvita, Costa Rica",
  "Puerto Viejo": "Puerto Viejo de Talamanca, Costa Rica",
};

function loadGoogleMaps(apiKey) {
  const waitForGoogleMaps = (resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      if (window.google?.maps?.importLibrary) {
        resolve(window.google);
        return;
      }
      if (Date.now() - startedAt > 10000) {
        reject(new Error("Google Maps failed to initialize"));
        return;
      }
      window.setTimeout(check, 50);
    };
    check();
  };

  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-google-maps-booking]");
    if (existing) {
      waitForGoogleMaps(resolve, reject);
      existing.addEventListener("load", () => waitForGoogleMaps(resolve, reject));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.dataset.googleMapsBooking = "true";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&libraries=places&region=CR`;
    script.onload = () => waitForGoogleMaps(resolve, reject);
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function resolveAddress(value) {
  const clean = value.trim();
  return ADDRESS_ALIASES[clean] || clean;
}

function getFallbackFare(routes, from, to) {
  return routes[from]?.[to] || routes[to]?.[from] || 0;
}

function formatDuration(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function roundFare(value) {
  return Math.round(value / 10) * 10;
}

function calculateFare(distanceKm, durationMin, pax) {
  const distanceRate = distanceKm > 170 ? 1.2 : 1.45;
  const paxFactor = pax > 3 ? 1.15 : 1;
  return roundFare(Math.max(60, (30 + (distanceKm * distanceRate) + (durationMin * 0.12)) * paxFactor));
}

function getPickupDateTime(date, time) {
  const value = new Date(`${date}T${time || "00:00"}`);
  return Number.isNaN(value.getTime()) || value <= new Date() ? null : value;
}

export default function Booking() {
  const { lang } = useLanguage();
  const [success, setSuccess] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth <= 820);
  React.useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 820);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const content = {
    en: {
      tag: "§01 · Instant Quote",
      title1: "Book", title2: "your", title3: "ride.",
      desc: "Fixed prices, no surge, no surprises. Confirm in under a minute — your request goes straight into our operations dashboard.",
      inc1: "Flight-tracked pickup", inc1v: "INCLUDED",
      inc2: "Bilingual driver (EN/ES)", inc2v: "INCLUDED",
      inc3: "Child seat on request", inc3v: "FREE",
      inc4: "Free cancellation ≤24h", inc4v: "INCLUDED",
      inc5: "Cold water & wifi onboard", inc5v: "ALWAYS",
      bp: "Boarding Pass",
      lFrom: "From", lTo: "To", lDate: "Date", lTime: "Pickup time",
      lPax: "Passengers — max 5", lDrive: "Drive time (est.)",
      lName: "Full name", lContact: "WhatsApp number",
      lFare: "Flat fare", lDist: "Distance",
      phFrom: "Pickup address or place",
      phTo: "Destination address or place",
      phName: "Guest name",
      phContact: "+506 8888 8888",
      calculating: "Calculating route...",
      needsAddress: "Enter both addresses",
      routeLive: "Route calculated with Google Maps",
      routeFallback: "Preset estimate",
      routeError: "Could not calculate this route with Google Maps",
      routeMissingKey: "Google Maps key needed for custom addresses",
      cta: "Confirm booking",
      paxSingular: "passenger", paxPlural: "passengers",
      thanks: "Reservation saved!",
      thanks_sub: "Your request is now in the operations dashboard for confirmation.",
      close: "New Booking"
    },
    es: {
      tag: "§01 · Cotización Inmediata",
      title1: "Reserva", title2: "tu", title3: "viaje.",
      desc: "Precios fijos, sin tarifas dinámicas, sin sorpresas. Confirma en menos de un minuto — tu solicitud entra directo al panel de operaciones.",
      inc1: "Rastreo de vuelo", inc1v: "INCLUIDO",
      inc2: "Chofer bilingüe (EN/ES)", inc2v: "INCLUIDO",
      inc3: "Silla de bebé a petición", inc3v: "GRATIS",
      inc4: "Cancelación gratis ≤24h", inc4v: "INCLUIDO",
      inc5: "Agua fría y wifi a bordo", inc5v: "SIEMPRE",
      bp: "Pase de Abordar",
      lFrom: "Desde", lTo: "Hacia", lDate: "Fecha", lTime: "Hora de recogida",
      lPax: "Pasajeros — max 5", lDrive: "Tiempo de viaje (est.)",
      lName: "Nombre completo", lContact: "WhatsApp para confirmar",
      lFare: "Tarifa plana", lDist: "Distancia",
      phFrom: "Dirección o lugar de salida",
      phTo: "Dirección o lugar de destino",
      phName: "Nombre del pasajero",
      phContact: "+506 8888 8888",
      calculating: "Calculando ruta...",
      needsAddress: "Ingresa ambas direcciones",
      routeLive: "Ruta calculada con Google Maps",
      routeFallback: "Estimado predefinido",
      routeError: "No se pudo calcular esta ruta con Google Maps",
      routeMissingKey: "Se necesita Google Maps key para direcciones personalizadas",
      cta: "Confirmar reserva",
      paxSingular: "pasajero", paxPlural: "pasajeros",
      thanks: "¡Reserva guardada!",
      thanks_sub: "Tu solicitud ya está en el panel de operaciones para confirmar.",
      close: "Nueva Reserva"
    }
  };
  const t = content[lang];
  
  const routes = {
    'SJO Airport': { 'San José Hotels': 60, 'La Fortuna / Arenal': 200, 'Monteverde': 230, 'Nicoya / Tamarindo': 280, 'Manuel Antonio / Quepos': 250, 'Puerto Viejo': 300, 'Uvita / Dominical': 300 },
    'LIR Airport': { 'San José Hotels': 300, 'La Fortuna / Arenal': 220, 'Monteverde': 250, 'Nicoya / Tamarindo': 110, 'Manuel Antonio / Quepos': 430, 'Puerto Viejo': 530, 'Uvita / Dominical': 500 },
    'San José Hotels': { 'La Fortuna / Arenal': 200, 'Monteverde': 230, 'Nicoya / Tamarindo': 280, 'Manuel Antonio / Quepos': 220, 'Puerto Viejo': 250, 'Uvita / Dominical': 280, 'SJO Airport': 60 },
    'La Fortuna / Arenal': { 'Monteverde': 130, 'Nicoya / Tamarindo': 270, 'Puerto Viejo': 370, 'SJO Airport': 200 },
    'Manuel Antonio / Quepos': { 'San José Hotels': 220, 'Uvita / Dominical': 80, 'SJO Airport': 250 },
  };
  const [from, setFrom] = React.useState('SJO Airport');
  const [to, setTo] = React.useState('San José Hotels');
  const [pax, setPax] = React.useState(2);
  const [customerName, setCustomerName] = React.useState("");
  const [customerContact, setCustomerContact] = React.useState("");
  const [date, setDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = React.useState('14:30');
  const [routeInfo, setRouteInfo] = React.useState({
    status: "idle",
    distanceKm: null,
    durationMin: null,
  });
  const [placesReady, setPlacesReady] = React.useState(false);
  const fromInputRef = React.useRef(null);
  const toInputRef = React.useRef(null);

  const locationOptions = React.useMemo(() => {
    const values = new Set([
      ...Object.keys(routes),
      ...Object.values(routes).flatMap((items) => Object.keys(items)),
      ...Object.keys(ADDRESS_ALIASES),
    ]);
    return [...values].sort((a, b) => a.localeCompare(b));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    let listeners = [];

    if (!GOOGLE_MAPS_API_KEY) return undefined;

    async function initPlacesAutocomplete() {
      try {
        const google = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        await google.maps.importLibrary("places");

        if (cancelled || !fromInputRef.current || !toInputRef.current || !google.maps.places?.Autocomplete) return;

        const costaRicaBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(8.0, -86.25),
          new google.maps.LatLng(11.35, -82.45)
        );
        const autocompleteOptions = {
          bounds: costaRicaBounds,
          componentRestrictions: { country: "cr" },
          fields: ["formatted_address", "name", "place_id"],
          strictBounds: false,
        };
        const attachAutocomplete = (input, setValue) => {
          const autocomplete = new google.maps.places.Autocomplete(input, autocompleteOptions);
          return autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            const nextValue = place.formatted_address || place.name || input.value;
            if (nextValue) setValue(nextValue);
          });
        };

        listeners = [
          attachAutocomplete(fromInputRef.current, setFrom),
          attachAutocomplete(toInputRef.current, setTo),
        ];
        setPlacesReady(true);
      } catch {
        if (!cancelled) setPlacesReady(false);
      }
    }

    initPlacesAutocomplete();

    return () => {
      cancelled = true;
      listeners.forEach((listener) => listener?.remove?.());
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const origin = resolveAddress(from);
    const destination = resolveAddress(to);

    if (!origin || !destination) {
      setRouteInfo({ status: "needs-address", distanceKm: null, durationMin: null });
      return undefined;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      setRouteInfo({ status: "missing-key", distanceKm: null, durationMin: null });
      return undefined;
    }

    const timeout = window.setTimeout(async () => {
      setRouteInfo((prev) => ({ ...prev, status: "loading" }));
      try {
        const google = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        const { Route } = await google.maps.importLibrary("routes");
        const departureTime = getPickupDateTime(date, time);
        const request = {
          origin,
          destination,
          travelMode: "DRIVING",
          routingPreference: "TRAFFIC_AWARE",
          computeAlternativeRoutes: false,
          region: "cr",
          fields: ["distanceMeters", "durationMillis"],
        };
        if (departureTime) request.departureTime = departureTime;

        const { routes: googleRoutes } = await Route.computeRoutes(request);
        const route = googleRoutes?.[0];
        if (cancelled) return;
        if (!route?.distanceMeters || !route?.durationMillis) {
          setRouteInfo({ status: "error", distanceKm: null, durationMin: null });
          return;
        }

        setRouteInfo({
          status: "ready",
          distanceKm: Math.round(route.distanceMeters / 1000),
          durationMin: Math.round(route.durationMillis / 60000),
        });
      } catch {
        if (!cancelled) {
          setRouteInfo({ status: "error", distanceKm: null, durationMin: null });
        }
      }
    }, 650);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [from, to, date, time]);

  const fallbackBase = getFallbackFare(routes, from, to);
  const paxFactor = pax > 3 ? 1.15 : 1;
  const routeReady = routeInfo.status === "ready";
  const fallbackDurationMin = fallbackBase ? Math.round((fallbackBase / 2.2) + 20) : null;
  const durationMin = routeReady ? routeInfo.durationMin : fallbackDurationMin;
  const distanceKm = routeReady ? routeInfo.distanceKm : (fallbackBase ? Math.round(fallbackBase * 2.1) : null);
  const total = routeReady
    ? calculateFare(routeInfo.distanceKm, routeInfo.durationMin, pax)
    : (fallbackBase ? Math.round(fallbackBase * paxFactor) : 0);
  const driveValue = routeInfo.status === "loading"
    ? t.calculating
    : (durationMin ? formatDuration(durationMin) : t.needsAddress);
  const routeStatusText = routeInfo.status === "ready"
    ? t.routeLive
    : routeInfo.status === "loading"
      ? t.calculating
      : routeInfo.status === "error"
        ? t.routeError
        : routeInfo.status === "missing-key" && !fallbackBase
          ? t.routeMissingKey
          : t.routeFallback;
  const handleSubmit = (event) => {
    event.preventDefault();
    createReservation({
      customerName: customerName.trim() || "Guest",
      customerContact: customerContact.trim() || "Not provided",
      from,
      to,
      date,
      time,
      pax,
      distanceKm,
      durationMin,
      total
    });
    setSuccess(true);
  };

  return (
    <section id="booking" className="booking">
      <div className="wrap booking-grid">
        <div className="booking-side">
          <span className="section-tag">{t.tag}</span>
          <h2 className="section-title">{t.title1} <em>{t.title2}</em> {t.title3}</h2>
          <p>{t.desc}</p>
          <div className="eta-list">
            <div className="row"><span>{t.inc1}</span><span className="mono">{t.inc1v}</span></div>
            <div className="row"><span>{t.inc2}</span><span className="mono">{t.inc2v}</span></div>
            <div className="row"><span>{t.inc3}</span><span className="mono">{t.inc3v}</span></div>
            <div className="row"><span>{t.inc4}</span><span className="mono">{t.inc4v}</span></div>
            <div className="row"><span>{t.inc5}</span><span className="mono">{t.inc5v}</span></div>
          </div>
        </div>

        <div className="ticket-wrap">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.form
                key="form"
                id="mobile-booking-form"
                className="ticket"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                <div className="ticket-cutout-l"></div>
                <div className="ticket-cutout-r"></div>
                <div className="ticket-head">
                  <span className="mono">{t.bp} · CR-{String(Math.abs((from+to).split('').reduce((a,c)=>a+c.charCodeAt(0),0))).slice(-4)}</span>
                  <span className="stamp">Pura Vida</span>
                </div>
                <div className="ticket-body">
                  <datalist id="bk-location-options">
                    {locationOptions.map((item) => <option key={item} value={item} />)}
                  </datalist>
                  <div className="ticket-row">
                    <div className="field">
                      <label htmlFor="bk-name">{t.lName}</label>
                      <input
                        id="bk-name"
                        type="text"
                        value={customerName}
                        placeholder={t.phName}
                        onChange={e => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="bk-contact">{t.lContact}</label>
                      <input
                        id="bk-contact"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        value={customerContact}
                        placeholder={t.phContact}
                        onChange={e => setCustomerContact(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="ticket-row">
                    <div className="field">
                      <label htmlFor="bk-from">{t.lFrom}</label>
                      <input
                        id="bk-from"
                        ref={fromInputRef}
                        type="text"
                        autoComplete="off"
                        list={placesReady ? undefined : "bk-location-options"}
                        value={from}
                        placeholder={t.phFrom}
                        onChange={e => setFrom(e.target.value)}
                        onFocus={e => e.target.select()}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="bk-to">{t.lTo}</label>
                      <input
                        id="bk-to"
                        ref={toInputRef}
                        type="text"
                        autoComplete="off"
                        list={placesReady ? undefined : "bk-location-options"}
                        value={to}
                        placeholder={t.phTo}
                        onChange={e => setTo(e.target.value)}
                        onFocus={e => e.target.select()}
                      />
                    </div>
                  </div>
                  <div className="ticket-row">
                    <div className="field">
                      <label htmlFor="bk-date">{t.lDate}</label>
                      <input id="bk-date" type="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="field">
                      <label htmlFor="bk-time">{t.lTime}</label>
                      <input id="bk-time" type="time" value={time} onChange={e => setTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="ticket-row">
                    <div className="field">
                      <label htmlFor="bk-pax">{t.lPax}</label>
                      <select id="bk-pax" value={pax} onChange={e => setPax(+e.target.value)}>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n===1?t.paxSingular:t.paxPlural}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="bk-drive">{t.lDrive}</label>
                      <input id="bk-drive" readOnly value={driveValue} />
                    </div>
                  </div>
                  <div className={`route-calc-status ${routeInfo.status}`} aria-live="polite">
                    {routeStatusText}
                  </div>
                </div>
                <div className="ticket-foot">
                  <div>
                    <span className="quote-label">{t.lFare}</span>
                    <div className="quote-value">{total ? `$${total}` : "—"}{total ? <small> USD</small> : null}</div>
                  </div>
                  <div>
                    <span className="quote-label">{t.lDist}</span>
                    <div className="quote-distance">{distanceKm ? `≈ ${distanceKm} km` : "—"}</div>
                  </div>
                  <button
                    type="submit"
                    className="book-cta"
                    aria-label={t.cta}
                  >
                    {t.cta} <Icon.Arrow size={14}/>
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                className="ticket success-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--paper-2)', borderRadius: '12px', border: '1px solid var(--sunset)', position: 'relative' }}
              >
                <div className="ticket-cutout-l"></div>
                <div className="ticket-cutout-r"></div>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--sunset)', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
                  <Icon.Check size={40} color="white" />
                </div>
                <h3 className="section-title" style={{ fontSize: 32, marginTop: 0, color: 'var(--sunset)' }}>{t.thanks}</h3>
                <p style={{ color: 'var(--ink)', marginBottom: 32, fontSize: '18px' }}>{t.thanks_sub}</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <a href="?admin=1" className="book-cta">Admin <Icon.Arrow size={14}/></a>
                  <button className="book-cta" onClick={() => setSuccess(false)} style={{ background: 'transparent', border: '1px solid var(--ink)', color: 'var(--ink)' }}>
                    {t.close}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isMobile && !success && (
        <div className="mobile-booking-bar">
          <div className="mobile-price-wrap">
            {total ? (
              <>
                <span className="mobile-price-label">{t.lFare}</span>
                <span className="mobile-price-val">${total}<small> USD</small></span>
              </>
            ) : (
              <span className="mobile-price-empty">— USD</span>
            )}
          </div>
          <button type="submit" form="mobile-booking-form" className="mobile-book-btn">
            {t.cta} <Icon.Arrow size={14}/>
          </button>
        </div>
      )}
    </section>
  );
}
