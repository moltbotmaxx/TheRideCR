import React from 'react';
import { Bell, BellOff, Download, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';

export async function adminRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener('abort', abort, { once: true });
  const timer = window.setTimeout(() => { timedOut = true; controller.abort(); }, 22000);
  try {
    const response = await fetch(path, { ...options, signal: controller.signal, headers, credentials: 'same-origin', cache: 'no-store' });
    let data;
    try { data = await response.json(); }
    catch (failure) { if (controller.signal.aborted) throw failure; data = {}; }
    if (!response.ok) {
      const error = new Error(data.error || 'No se pudo completar la solicitud. Intenta de nuevo.');
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (failure) {
    if (timedOut) throw new Error('El servidor tardó demasiado en responder. Revisa la conexión e intenta de nuevo.');
    throw failure;
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}

function applicationKey(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64 + '='.repeat((4 - base64.length % 4) % 4)), character => character.charCodeAt(0));
}

function AdminTools({ user, onUnauthorized }) {
  const [registration, setRegistration] = React.useState(null);
  const [publicKey, setPublicKey] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [installPrompt, setInstallPrompt] = React.useState(null);
  const [installed, setInstalled] = React.useState(() => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  React.useEffect(() => {
    const captureInstall = event => { event.preventDefault(); setInstallPrompt(event); };
    const didInstall = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', captureInstall);
    window.addEventListener('appinstalled', didInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstall);
      window.removeEventListener('appinstalled', didInstall);
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    if (!('serviceWorker' in navigator)) return undefined;
    async function prepare() {
      try {
        const serviceWorker = await navigator.serviceWorker.register('/admin/sw.js', { scope: '/admin/' });
        await navigator.serviceWorker.ready;
        if (!cancelled) setRegistration(serviceWorker);
        if (!supported) return;
        const { publicKey: key } = await adminRequest('/api/push/public-key');
        const existing = await serviceWorker.pushManager.getSubscription();
        if (existing) {
          await adminRequest('/api/push/subscriptions', { method: 'POST', body: JSON.stringify({ subscription: existing.toJSON() }) });
        }
        if (!cancelled) {
          setPublicKey(key || '');
          setSubscribed(Boolean(existing));
          if (!key) setNotice('Las notificaciones todavía no están configuradas.');
        }
      } catch (error) {
        if (cancelled) return;
        if (error.status === 401 || error.status === 403) onUnauthorized();
        else setNotice(supported ? 'No se pudieron preparar las notificaciones. Recarga para reintentar.' : 'No se pudo preparar la app para funcionar sin conexión. Recarga para reintentar.');
      }
    }
    prepare();
    return () => { cancelled = true; };
  }, [supported, onUnauthorized]);

  async function enableNotifications() {
    if (busy || !registration || !publicKey) return;
    if (ios && !installed) {
      setNotice('En iPhone o iPad, abre Compartir → Agregar a pantalla de inicio y abre Admin desde su icono.');
      return;
    }
    // Ask while the click still carries user activation, as required on iOS.
    const permissionPromise = Notification.requestPermission();
    setBusy(true);
    setNotice('');
    let subscription;
    try {
      const permission = await permissionPromise;
      if (permission !== 'granted') {
        setNotice(permission === 'denied' ? 'Las notificaciones están bloqueadas. Habilítalas en los ajustes del navegador o del teléfono.' : 'Activa el permiso cuando quieras recibir avisos de reservas.');
        return;
      }
      subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationKey(publicKey) });
      await adminRequest('/api/push/subscriptions', { method: 'POST', body: JSON.stringify({ subscription: subscription.toJSON() }) });
      setSubscribed(true);
      setNotice('Avisos activados en este dispositivo, incluso con la app cerrada.');
    } catch (error) {
      if (subscription) await subscription.unsubscribe().catch(() => {});
      setNotice(error.message || 'No se pudieron activar los avisos.');
    } finally { setBusy(false); }
  }

  async function disableNotifications() {
    const serviceWorker = registration || ('serviceWorker' in navigator && await navigator.serviceWorker.getRegistration('/admin/'));
    const subscription = serviceWorker && 'pushManager' in serviceWorker && await serviceWorker.pushManager.getSubscription();
    if (subscription) {
      await adminRequest('/api/push/subscriptions', { method: 'DELETE', body: JSON.stringify({ endpoint: subscription.endpoint }) });
      await subscription.unsubscribe();
    }
    setSubscribed(false);
  }

  async function toggleNotifications() {
    if (!subscribed) return enableNotifications();
    setBusy(true);
    try { await disableNotifications(); setNotice('Avisos desactivados en este dispositivo.'); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }

  async function testNotification() {
    setBusy(true);
    try {
      const result = await adminRequest('/api/push/test', { method: 'POST' });
      setNotice(result.sent ? 'Aviso de prueba enviado. Revisa las notificaciones del dispositivo.' : 'No se pudo entregar el aviso. Desactiva y vuelve a activar los avisos para renovar la conexión.');
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    try {
      await disableNotifications();
      window.location.assign('/signout-with-chatgpt?return_to=%2Fadmin%2F');
    } catch (error) { setNotice('No se pudo desactivar este dispositivo antes de salir. Revisa la conexión e intenta de nuevo.'); setBusy(false); }
  }

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return <section className="admin-device-panel" aria-label="Dispositivo y cuenta">
    <div className="admin-account"><ShieldCheck size={17} /><span>{user.email}</span><button type="button" className="admin-small-button" onClick={logout} disabled={busy}><LogOut size={16} /> Salir</button></div>
    <div className="admin-device-actions">
      {installPrompt && !installed && <button type="button" className="admin-small-button" onClick={install}><Download size={16} /> Instalar Admin</button>}
      {supported && <button type="button" className={`admin-small-button ${subscribed ? 'is-enabled' : ''}`} onClick={toggleNotifications} disabled={busy || !registration || !publicKey}>{subscribed ? <BellOff size={16} /> : <Bell size={16} />}{busy ? 'Un momento…' : subscribed ? 'Desactivar avisos' : 'Activar avisos'}</button>}
      {subscribed && <button type="button" className="admin-small-button" disabled={busy} onClick={testNotification}>Probar aviso</button>}
    </div>
    {!supported && <p className="admin-device-hint">Este navegador no admite avisos push. Prueba un navegador actualizado.</p>}
    {ios && !installed && <p className="admin-device-hint">Para instalar Admin en iPhone o iPad: Compartir → Agregar a pantalla de inicio. Después abre su icono y activa los avisos.</p>}
    {!ios && !installed && !installPrompt && <p className="admin-device-hint">Puedes instalar Admin desde el menú de tu navegador: Instalar app o Agregar a pantalla de inicio.</p>}
    {notice && <p className="admin-device-hint" role="status">{notice}</p>}
  </section>;
}

export default function AdminApp() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [forbidden, setForbidden] = React.useState(false);
  const [online, setOnline] = React.useState(navigator.onLine);
  const unauthorized = React.useCallback(() => { setUser(null); setForbidden(false); }, []);
  const checkSession = React.useCallback(async signal => {
    setLoading(true);
    setError('');
    try {
      const data = await adminRequest('/api/admin/session', { signal });
      setUser(data.user);
      setForbidden(false);
    } catch (failure) {
      if (failure.name === 'AbortError') return;
      setUser(null);
      setForbidden(failure.status === 403);
      if (failure.status !== 401 && failure.status !== 403) setError('No se pudo conectar con el servidor. Revisa tu conexión y vuelve a intentar.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    checkSession(controller.signal);
    const updateConnection = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) checkSession(controller.signal);
    };
    const restoreSession = event => { if (event.persisted) checkSession(controller.signal); };
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    window.addEventListener('pageshow', restoreSession);
    return () => {
      controller.abort();
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      window.removeEventListener('pageshow', restoreSession);
    };
  }, [checkSession]);

  if (loading) return <main className="admin-login"><div className="admin-login-card"><CarLogo /><p role="status">Verificando sesión…</p></div></main>;
  if (!user) return <main className="admin-login"><div className="admin-login-card"><CarLogo /><span className="admin-eyebrow">TheRideCR · Operaciones</span><h1>Admin</h1><p>Reservas, confirmaciones y avisos en un solo lugar.</p>
    {forbidden ? <><p role="alert" className="admin-error">Esta cuenta no tiene acceso al panel.</p><a className="admin-primary-button" target="_top" href="/signout-with-chatgpt?return_to=%2Fadmin%2F">Cambiar de cuenta</a></> : <a className="admin-primary-button" target="_top" href="/signin-with-chatgpt?return_to=%2Fadmin%2F"><ShieldCheck size={18} /> Iniciar sesión con ChatGPT</a>}
    <p className="admin-device-hint">Acceso exclusivo para la cuenta administradora autorizada.</p>
    {error && <><p className="admin-error" role="alert">{error}</p><button type="button" className="admin-small-button" onClick={() => checkSession()}><RefreshCw size={16} /> Reintentar conexión</button></>}
    <a href="https://theridecr.net/" className="admin-back-link">Volver a TheRideCR</a>
  </div></main>;

  return <>
    {!online && <div className="admin-offline-banner" role="alert">Sin conexión. Las reservas y los cambios requieren conexión al servidor.</div>}
    <AdminDashboard apiRequest={adminRequest} onUnauthorized={unauthorized} tools={<AdminTools user={user} onUnauthorized={unauthorized} />} online={online} />
  </>;
}

export function CarLogo() {
  return <svg className="admin-logo-mark" viewBox="0 0 36 36" fill="none" aria-hidden="true"><circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="1.4" /><path d="M7 22C12 8 24 8 29 22M11 22H25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="11.5" cy="22" r="2.2" fill="currentColor" /><circle cx="24.5" cy="22" r="2.2" fill="currentColor" /></svg>;
}
