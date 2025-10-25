import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { auth } from './firebase/config';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
import { ThemeProvider } from './context/ThemeContext';

// On initialise la persistance puis on monte l'app
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <ThemeProvider>
        <App />
        </ThemeProvider>
      </React.StrictMode>
    );
  })
  .catch((err) => {
    console.error("Erreur de persistance :", err);
  });
