import React from "react";
import { Home, CalendarCheck, Car, Map, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../LanguageContext";

export default function BottomNav({ activeTab, setActiveTab }) {
  const { lang } = useLanguage();
  const content = {
    en: [
      { id: 'home', icon: Home, label: 'Home' },
      { id: 'book', icon: CalendarCheck, label: 'Book' },
      { id: 'fleet', icon: Car, label: 'Fleet' },
      { id: 'dest', icon: Navigation, label: 'Places' },
      { id: 'map', icon: Map, label: 'Map' }
    ],
    es: [
      { id: 'home', icon: Home, label: 'Inicio' },
      { id: 'book', icon: CalendarCheck, label: 'Reservar' },
      { id: 'fleet', icon: Car, label: 'Flota' },
      { id: 'dest', icon: Navigation, label: 'Lugares' },
      { id: 'map', icon: Map, label: 'Mapa' }
    ]
  };
  const tabs = content[lang];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button 
            key={tab.id} 
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ position: 'relative' }}
          >
            {isActive && (
              <motion.div
                layoutId="active-nav-pill"
                className="nav-pill"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  borderRadius: '12px',
                  background: 'var(--sunset)',
                  zIndex: -1,
                  opacity: 0.2
                }}
              />
            )}
            <IconComponent size={24} strokeWidth={2} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
