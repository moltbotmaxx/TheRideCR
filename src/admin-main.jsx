import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp';
import './admin.css';

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><AdminApp /></React.StrictMode>);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/admin/sw.js', { scope: '/admin/' }).catch(() => {});
  });
}
