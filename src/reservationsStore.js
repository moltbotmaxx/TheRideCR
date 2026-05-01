const STORAGE_KEY = "trcr_reservations_v1";

const seedReservations = [
  {
    id: "TRC-1048",
    createdAt: "2026-04-28T08:12:00.000Z",
    customerName: "Megan Carter",
    customerContact: "+1 415 555 0198",
    from: "SJO Airport",
    to: "Manuel Antonio / Quepos",
    date: "2026-05-03",
    time: "11:30",
    pax: 2,
    distanceKm: 158,
    durationMin: 190,
    total: 250,
    status: "new",
    source: "Website"
  },
  {
    id: "TRC-1047",
    createdAt: "2026-04-27T17:40:00.000Z",
    customerName: "Carlos Vega",
    customerContact: "+506 8899 1144",
    from: "San José Hotels",
    to: "La Fortuna / Arenal",
    date: "2026-05-01",
    time: "08:00",
    pax: 4,
    distanceKm: 132,
    durationMin: 165,
    total: 230,
    status: "confirmed",
    source: "Website"
  },
  {
    id: "TRC-1046",
    createdAt: "2026-04-27T10:25:00.000Z",
    customerName: "Sophie Martin",
    customerContact: "+44 7700 900123",
    from: "LIR Airport",
    to: "Nicoya / Tamarindo",
    date: "2026-04-30",
    time: "15:45",
    pax: 3,
    distanceKm: 76,
    durationMin: 95,
    total: 110,
    status: "completed",
    source: "Dummy"
  }
];

function readStoredReservations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredReservations(reservations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
}

export function getReservations() {
  const stored = readStoredReservations();
  if (stored) return stored;
  writeStoredReservations(seedReservations);
  return seedReservations;
}

export function createReservation(data) {
  const reservations = getReservations();
  const nextNumber = reservations.reduce((max, item) => {
    const value = Number(String(item.id).replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 1048) + 1;

  const reservation = {
    id: `TRC-${nextNumber}`,
    createdAt: new Date().toISOString(),
    status: "new",
    source: "Website",
    ...data
  };

  writeStoredReservations([reservation, ...reservations]);
  return reservation;
}

export function updateReservationStatus(id, status) {
  const reservations = getReservations().map((item) => (
    item.id === id ? { ...item, status } : item
  ));
  writeStoredReservations(reservations);
  return reservations;
}

export function removeReservation(id) {
  const reservations = getReservations().filter((item) => item.id !== id);
  writeStoredReservations(reservations);
  return reservations;
}
