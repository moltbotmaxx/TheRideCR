import React from "react";
import { CalendarDays, Car, CheckCircle2, Clock, DollarSign, MessageCircle, Search, UserRound, Trash2 } from "lucide-react";
import { getReservations, updateReservationStatus, removeReservation } from "../reservationsStore";

const statusLabels = {
  new: "New",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled"
};

const statusOptions = Object.keys(statusLabels);

function formatDateTime(date, time) {
  return `${date} · ${time}`;
}

function formatCreatedAt(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getWhatsAppHref(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.length === 8 ? `506${digits}` : digits;
  return `https://wa.me/${normalized}`;
}

export default function AdminDashboard() {
  const [reservations, setReservations] = React.useState(() => getReservations());
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState(() => getReservations()[0]?.id || "");

  const filteredReservations = React.useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return reservations.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const haystack = `${item.id} ${item.customerName} ${item.customerContact} ${item.from} ${item.to}`.toLowerCase();
      return matchesStatus && (!cleanQuery || haystack.includes(cleanQuery));
    });
  }, [query, reservations, statusFilter]);

  const selected = reservations.find((item) => item.id === selectedId) || filteredReservations[0] || reservations[0];
  const selectedWhatsAppHref = getWhatsAppHref(selected?.customerContact);
  const stats = React.useMemo(() => {
    const pending = reservations.filter((item) => item.status === "new").length;
    const confirmed = reservations.filter((item) => item.status === "confirmed").length;
    const revenue = reservations
      .filter((item) => item.status !== "cancelled")
      .reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    return { pending, confirmed, revenue, total: reservations.length };
  }, [reservations]);

  const setStatus = (id, status) => {
    const next = updateReservationStatus(id, status);
    setReservations(next);
  };

  const handleRemove = (id) => {
    if (window.confirm("Are you sure you want to completely delete this reservation? This cannot be undone.")) {
      const next = removeReservation(id);
      setReservations(next);
      if (selectedId === id) setSelectedId(next[0]?.id || "");
    }
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a href="./" className="admin-brand" aria-label="Back to TheRideCR">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7 22 C 12 8, 24 8, 29 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="11.5" cy="22" r="2.2" fill="currentColor" />
            <circle cx="24.5" cy="22" r="2.2" fill="currentColor" />
            <path d="M11 22 L25 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span>TheRide<b>CR</b></span>
        </a>
        <nav className="admin-menu" aria-label="Admin navigation">
          <a className="active" href="?admin=1"><CalendarDays size={18} /> Reservations</a>
          <a href="./"><Car size={18} /> Public site</a>
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <span className="admin-eyebrow">Operations</span>
            <h1>Reservations</h1>
          </div>
          <a className="admin-public-link" href="./">View website</a>
        </header>

        <div className="admin-stats">
          <div><Clock size={18} /><span>New</span><strong>{stats.pending}</strong></div>
          <div><CheckCircle2 size={18} /><span>Confirmed</span><strong>{stats.confirmed}</strong></div>
          <div><DollarSign size={18} /><span>Quoted revenue</span><strong>${stats.revenue}</strong></div>
          <div><CalendarDays size={18} /><span>Total</span><strong>{stats.total}</strong></div>
        </div>

        <div className="admin-workspace">
          <section className="admin-list-panel">
            <div className="admin-toolbar">
              <label className="admin-search">
                <Search size={16} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reservations" />
              </label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </div>

            <div className="admin-reservation-list">
              {filteredReservations.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`admin-reservation-row ${selected?.id === item.id ? "active" : ""}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className={`admin-status ${item.status}`}>{statusLabels[item.status]}</span>
                  <strong>{item.customerName}</strong>
                  <small>{item.from} → {item.to}</small>
                  <em>{formatDateTime(item.date, item.time)}</em>
                  <b>${item.total || "TBD"}</b>
                </button>
              ))}
            </div>
          </section>

          {selected && (
            <aside className="admin-detail-panel">
              <div className="admin-detail-head">
                <span className={`admin-status ${selected.status}`}>{statusLabels[selected.status]}</span>
                <h2>{selected.id}</h2>
                <p>Created {formatCreatedAt(selected.createdAt)}</p>
              </div>

              <div className="admin-customer">
                <UserRound size={20} />
                <div>
                  <strong>{selected.customerName}</strong>
                  <span>{selected.customerContact}</span>
                </div>
                {selectedWhatsAppHref && (
                  <a
                    className="admin-whatsapp-link"
                    href={selectedWhatsAppHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Confirm ${selected.customerName} on WhatsApp`}
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                )}
              </div>

              <dl className="admin-detail-grid">
                <div><dt>Pickup</dt><dd>{selected.from}</dd></div>
                <div><dt>Destination</dt><dd>{selected.to}</dd></div>
                <div><dt>Date</dt><dd>{formatDateTime(selected.date, selected.time)}</dd></div>
                <div><dt>Passengers</dt><dd>{selected.pax}</dd></div>
                <div><dt>Distance</dt><dd>{selected.distanceKm ? `${selected.distanceKm} km` : "TBD"}</dd></div>
                <div><dt>Drive time</dt><dd>{selected.durationMin ? `${Math.round(selected.durationMin / 60)}h ${String(selected.durationMin % 60).padStart(2, "0")}m` : "TBD"}</dd></div>
                <div><dt>Fare</dt><dd>${selected.total || "TBD"} USD</dd></div>
                <div><dt>Source</dt><dd>{selected.source}</dd></div>
              </dl>

              <div className="admin-actions">
                {statusOptions.map((status) => (
                  <button
                    type="button"
                    key={status}
                    className={selected.status === status ? "active" : ""}
                    onClick={() => setStatus(selected.id, status)}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
                <button 
                  type="button" 
                  className="admin-btn-delete"
                  style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#ff4d4f', borderColor: 'rgba(255, 77, 79, 0.3)' }}
                  onClick={() => handleRemove(selected.id)}
                >
                  <Trash2 size={16} /> Delete Reservation
                </button>
              </div>
            </aside>
          )}
        </div>
      </section>
    </main>
  );
}
