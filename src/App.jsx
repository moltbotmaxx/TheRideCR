import { useState, useEffect } from 'react';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Booking from './components/Booking';
import Vehicle from './components/Vehicle';
import RouteMap from './components/RouteMap';
import Destinations from './components/Destinations';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import Tweaks from './components/Tweaks';
import Icon from './components/Icon';
import BottomNav from './components/BottomNav';
import DriverProfile from './components/DriverProfile';
import MobileHeader from './components/MobileHeader';
import ScrollVideoSection from './components/ScrollVideoSection';
import AdminDashboard from './components/AdminDashboard';
import Podcast from './components/Podcast';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from './LanguageContext';
import { WA_NUMBER } from './config';

function AdminLogin({ onAuth }) {
  const [user, setUser] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const adminUser = 'admin';
  const pass = '166012';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user.trim().toLowerCase() === adminUser && code === pass) {
      sessionStorage.setItem('trcr_admin_auth_v1', 'true');
      onAuth();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="login-gate">
      <motion.div 
        className="login-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <svg className="login-logo" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#7ec4f5" fill="none" strokeWidth="1.2" strokeLinecap="round">
            <circle cx="18" cy="18" r="16" strokeWidth="1.2" />
            <path d="M8 22 C 12 10, 24 10, 28 22" />
            <circle cx="12" cy="22" r="2" fill="#7ec4f5" stroke="none"/>
            <circle cx="24" cy="22" r="2" fill="#7ec4f5" stroke="none"/>
            <path d="M12 22 L24 22" />
          </g>
        </svg>
        <p>Admin Access</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="admin"
            className={error ? 'error' : ''}
            autoFocus
          />
          <input 
            type="password" 
            value={code} 
            onChange={(e) => setCode(e.target.value)} 
            placeholder="······"
            className={error ? 'error' : ''}
            autoFocus
          />
          <button type="submit">Unlock</button>
        </form>
      </motion.div>
    </div>
  );
}

function App() {
  const [showWA, setShowWA] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isMobile, setIsMobile] = useState(false);
  const { lang } = useLanguage();
  const isAdmin = new URLSearchParams(window.location.search).get('admin') === '1';
  const [isAdminAuthed, setIsAdminAuthed] = useState(() => sessionStorage.getItem('trcr_admin_auth_v1') === 'true');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 820);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__edit_mode_set_keys' && 'showWhatsapp' in (e.data.edits || {})) {
        setShowWA(!!e.data.edits.showWhatsapp);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setActiveTab(e.detail.tab);
    window.addEventListener('therideapp:navigate', handler);
    return () => window.removeEventListener('therideapp:navigate', handler);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };
  const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.4 };

  if (isAdmin) {
    return isAdminAuthed
      ? <AdminDashboard />
      : <AdminLogin onAuth={() => setIsAdminAuthed(true)} />;
  }

  return (
    <div className={isMobile ? "mobile-app-layout" : ""}>
      {!isMobile && <Nav />}
      {isMobile && <MobileHeader />}

      {/* DESKTOP VIEW: Renders everything sequentially */}
      {!isMobile && (
        <>
          <Hero />
          <Marquee />
          <Booking />
          <Vehicle />
          <DriverProfile />
          <RouteMap />
          <Destinations />
          <ScrollVideoSection />
          <Testimonials />
          <Podcast />
          <Footer />
        </>
      )}

      {/* MOBILE VIEW: Renders ONLY the active screen */}
      {isMobile && (
        <div className="mobile-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              style={{ width: '100%', height: '100%' }}
            >
              {activeTab === 'home' && <Hero />}
              {activeTab === 'book' && <Booking />}
              {activeTab === 'fleet' && (
                <>
                  <Vehicle />
                  <DriverProfile />
                </>
              )}
              {activeTab === 'dest' && (
                <>
                  <Destinations />
                  <ScrollVideoSection />
                  <Podcast />
                </>
              )}
              {activeTab === 'map' && <RouteMap />}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {isMobile && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}

      {showWA && (
        <a 
          href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lang === 'en' ? 'I want to book an adventure in Costa Rica' : 'Quiero reservar una aventura en Costa Rica')}`}
          className={`whatsapp-float ${isMobile ? 'mobile-wa' : ''}`} 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="WhatsApp"
        >
          <Icon.Chat size={24}/>
        </a>
      )}
      {!isMobile && <Tweaks />}
    </div>
  );
}

export default App;
