import React from 'react';
import { CalendarDays, Car, CheckCircle2, Clock, DollarSign, MessageCircle, Search, UserRound, Trash2, RefreshCw } from 'lucide-react';

const statusLabels = { new: 'Nueva', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada' };
const statusOptions = Object.keys(statusLabels);
const money = value => value == null ? 'Por cotizar' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const dateTime = (date, time) => `${new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeZone: 'America/Costa_Rica' }).format(new Date(`${date}T12:00:00-06:00`))} · ${time}`;
const createdAt = value => new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Costa_Rica' }).format(new Date(value));

function whatsApp(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits.length === 8 ? `506${digits}` : digits}` : null;
}

export default function AdminDashboard({ apiRequest, onUnauthorized, tools, online }) {
  const [reservations, setReservations] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selectedId, setSelectedId] = React.useState(() => new URLSearchParams(window.location.search).get('reservation') || '');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [updatedAt, setUpdatedAt] = React.useState(null);
  const inFlight = React.useRef(null);
  const savingRef = React.useRef(false);
  const mounted = React.useRef(false);
  const detailRef = React.useRef(null);

  const refresh = React.useCallback(async () => {
    if (inFlight.current || savingRef.current) return;
    const controller = new AbortController();
    inFlight.current = controller;
    setRefreshing(true);
    try {
      const data = await apiRequest('/api/reservations', { signal: controller.signal });
      if (!mounted.current) return;
      setReservations(data.reservations || []);
      setUpdatedAt(new Date());
      setError('');
    } catch (failure) {
      if (!mounted.current || failure.name === 'AbortError') return;
      if (failure.status === 401 || failure.status === 403) onUnauthorized();
      else setError('No se pudieron actualizar las reservas. Revisa tu conexión y vuelve a intentar.');
    } finally {
      if (inFlight.current === controller) inFlight.current = null;
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, [apiRequest, onUnauthorized]);

  React.useEffect(() => {
    mounted.current = true;
    refresh();
    const wake = () => { if (document.visibilityState === 'visible' && navigator.onLine) refresh(); };
    const interval = window.setInterval(wake, 20000);
    window.addEventListener('online', wake);
    document.addEventListener('visibilitychange', wake);
    return () => {
      mounted.current = false;
      inFlight.current?.abort();
      inFlight.current = null;
      clearInterval(interval);
      window.removeEventListener('online', wake);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [refresh]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return reservations.filter(item => (statusFilter === 'all' || item.status === statusFilter) && (!needle || `${item.id} ${item.customerName} ${item.customerContact} ${item.from} ${item.to}`.toLocaleLowerCase().includes(needle)));
  }, [query, reservations, statusFilter]);
  const selected = filtered.find(item => item.id === selectedId) || filtered[0];
  const stats = React.useMemo(() => ({
    pending: reservations.filter(item => item.status === 'new').length,
    confirmed: reservations.filter(item => item.status === 'confirmed').length,
    quoted: reservations.filter(item => item.status !== 'cancelled').reduce((sum, item) => sum + (Number(item.total) || 0), 0),
    total: reservations.length
  }), [reservations]);

  async function mutate(id, method, body) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    inFlight.current?.abort();
    inFlight.current = null;
    try {
      const data = await apiRequest(`/api/reservations/${encodeURIComponent(id)}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      if (!mounted.current) return;
      if (method === 'DELETE') setReservations(items => items.filter(item => item.id !== id));
      else setReservations(items => items.map(item => item.id === id ? data.reservation : item));
      setUpdatedAt(new Date());
    } catch (failure) {
      if (!mounted.current) return;
      if (failure.status === 401 || failure.status === 403) onUnauthorized();
      else setError(failure.message || 'No se pudo guardar el cambio. Intenta de nuevo.');
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  function chooseReservation(id) {
    setSelectedId(id);
    if (window.innerWidth <= 1000) window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  return <main className="admin-shell">
    <aside className="admin-sidebar">
      <a href="/admin/" className="admin-brand" aria-label="TheRideCR Admin"><Car size={30} /><span>TheRide<b>CR</b><small>ADMIN</small></span></a>
      <nav className="admin-menu" aria-label="Administración"><a className="active" href="/admin/"><CalendarDays size={18} /> Reservas</a><a href="https://theridecr.net/" target="_blank" rel="noopener noreferrer"><Car size={18} /> Sitio público</a></nav>
      <p className="admin-sidebar-note">Traslados privados<br />Costa Rica</p>
    </aside>
    <section className="admin-main">
      <header className="admin-header"><div><span className="admin-eyebrow">Operaciones · Costa Rica</span><h1>Reservas</h1></div><button className="admin-small-button" type="button" disabled={refreshing || saving || !online} onClick={refresh}><RefreshCw size={16} className={refreshing ? 'admin-spin' : ''} /> {refreshing ? 'Actualizando…' : 'Actualizar'}</button></header>
      {tools}
      <div className="admin-stats"><div><Clock size={18} /><span>Nuevas</span><strong>{loading ? '—' : stats.pending}</strong></div><div><CheckCircle2 size={18} /><span>Confirmadas</span><strong>{loading ? '—' : stats.confirmed}</strong></div><div><DollarSign size={18} /><span>Cotizado · USD</span><strong>{loading ? '—' : money(stats.quoted)}</strong></div><div><CalendarDays size={18} /><span>Total</span><strong>{loading ? '—' : stats.total}</strong></div></div>
      <div className="admin-sync-line" aria-live="polite">{updatedAt ? `Actualizado ${new Intl.DateTimeFormat('es-CR', { timeStyle: 'short', timeZone: 'America/Costa_Rica' }).format(updatedAt)} · Horarios de Costa Rica (UTC−6)` : 'Conectando con el servidor…'}{saving && ' · Guardando…'}</div>
      {error && <div className="admin-error" role="alert">{error}<button type="button" onClick={refresh} disabled={refreshing || saving}>Reintentar</button></div>}
      <div className="admin-workspace">
        <section className="admin-list-panel" aria-label="Lista de reservas">
          <div className="admin-toolbar"><label className="admin-search"><Search size={17} /><input aria-label="Buscar reservas" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nombre, ruta o código" /></label><select aria-label="Filtrar por estado" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">Todos los estados</option>{statusOptions.map(status => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></div>
          <div className="admin-reservation-list" aria-busy={loading}>
            {loading ? <div className="admin-empty" role="status"><RefreshCw className="admin-spin" size={24} /><h2>Cargando reservas…</h2></div> : filtered.length === 0 ? <div className="admin-empty"><CalendarDays size={28} /><h2>{reservations.length ? 'Sin coincidencias' : 'Todo listo para recibir reservas'}</h2><p>{reservations.length ? 'Prueba otra búsqueda o cambia el filtro.' : 'Las solicitudes del sitio aparecerán aquí en cuanto lleguen.'}</p></div> : filtered.map(item => <button type="button" key={item.id} className={`admin-reservation-row ${selected?.id === item.id ? 'active' : ''}`} onClick={() => chooseReservation(item.id)} aria-pressed={selected?.id === item.id}><span className={`admin-status ${item.status}`}>{statusLabels[item.status]}</span><strong>{item.customerName}</strong><small>{item.from} → {item.to}</small><em>{dateTime(item.date, item.time)}</em><b>{money(item.total)}</b></button>)}
          </div>
        </section>
        {selected && <aside className="admin-detail-panel" ref={detailRef} aria-label={`Detalle de reserva ${selected.id}`}>
          <div className="admin-detail-head"><span className={`admin-status ${selected.status}`}>{statusLabels[selected.status]}</span><h2>{selected.id}</h2><p>Recibida {createdAt(selected.createdAt)}</p></div>
          <div className="admin-customer"><UserRound size={20} /><div><strong>{selected.customerName}</strong><span>{selected.customerContact}</span></div>{whatsApp(selected.customerContact) && <a className="admin-whatsapp-link" href={whatsApp(selected.customerContact)} target="_blank" rel="noopener noreferrer" aria-label={`Contactar a ${selected.customerName} por WhatsApp`}><MessageCircle size={16} /> WhatsApp</a>}</div>
          <dl className="admin-detail-grid"><div><dt>Recogida</dt><dd>{selected.from}</dd></div><div><dt>Destino</dt><dd>{selected.to}</dd></div><div><dt>Fecha y hora · CR</dt><dd>{dateTime(selected.date, selected.time)}</dd></div><div><dt>Pasajeros</dt><dd>{selected.pax}</dd></div><div><dt>Distancia estimada</dt><dd>{selected.distanceKm ? `${selected.distanceKm} km` : 'Por confirmar'}</dd></div><div><dt>Duración estimada</dt><dd>{selected.durationMin ? `${Math.floor(selected.durationMin / 60)} h ${selected.durationMin % 60} min` : 'Por confirmar'}</dd></div><div><dt>Tarifa · USD</dt><dd>{money(selected.total)}</dd></div><div><dt>Origen</dt><dd>{selected.source === 'Website' ? 'Sitio web' : selected.source}</dd></div></dl>
          <div className="admin-actions">{statusOptions.map(status => <button type="button" key={status} disabled={saving || !online || selected.status === status} className={selected.status === status ? 'active' : ''} onClick={() => mutate(selected.id, 'PATCH', { status })}>{statusLabels[status]}</button>)}<button type="button" className="admin-btn-delete" disabled={saving || !online} onClick={() => { if (window.confirm(`¿Eliminar permanentemente la reserva ${selected.id}? Esta acción no se puede deshacer.`)) mutate(selected.id, 'DELETE'); }}><Trash2 size={16} /> Eliminar reserva</button></div>
        </aside>}
      </div>
    </section>
  </main>;
}
