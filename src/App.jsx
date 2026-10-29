import { useState, useEffect, useRef } from 'react';
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
import MobileHome from './components/MobileHome';
import ScrollVideoSection from './components/ScrollVideoSection';
import SeoContent from './components/SeoContent';
import Podcast from './components/Podcast';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from './LanguageContext';
import { WA_NUMBER, ADMIN_URL } from './config';


function App() {
  const [showWA, setShowWA] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isMobile, setIsMobile] = useState(false);
  const mobileScreenRef = useRef(null);
  const { lang } = useLanguage();
  const isAdmin = new URLSearchParams(window.location.search).get('admin') === '1';


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

  useEffect(() => {
    if (!isMobile) return;
    window.requestAnimationFrame(() => {
      if (mobileScreenRef.current) {
        mobileScreenRef.current.scrollTop = 0;
        mobileScreenRef.current.scrollLeft = 0;
      }
    });
  }, [activeTab, isMobile]);

  const handleMobileTabChange = (tab) => {
    if (tab === activeTab && mobileScreenRef.current) {
      mobileScreenRef.current.scrollTo({ top: 0, left: 0 });
      return;
    }
    setActiveTab(tab);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };
  const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.4 };

  if (isAdmin) {
    window.location.replace(ADMIN_URL);
    return <p style={{ padding: 32 }}>Abriendo Admin… <a href={ADMIN_URL}>Continuar</a></p>;
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
          <SeoContent />
          <Footer />
        </>
      )}

      {/* MOBILE VIEW: Renders ONLY the active screen */}
      {isMobile && (
        <div className="mobile-screen" ref={mobileScreenRef}>
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
              {activeTab === 'home' && <><MobileHome /><SeoContent /></>}
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

      {isMobile && <BottomNav activeTab={activeTab} setActiveTab={handleMobileTabChange} />}

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
