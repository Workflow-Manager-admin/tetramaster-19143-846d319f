import React, { useState, useEffect } from 'react';
import './App.css';
import TetraMaster from './TetraMaster';

// Simple preferred theme detection
function getPreferredTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Toggle Handler
  const handleToggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  // Theme label/icon
  const otherTheme = theme === 'light' ? 'Dark' : 'Light';

  return (
    <div className={`app theme-${theme}`}>
      <nav className="navbar" style={{ zIndex: 200 }}>
        <div className="logo">
          <span className="logo-symbol">▣</span>
          TetraMaster
        </div>
        <button 
          className="btn btn-theme-toggle"
          aria-label="Toggle color theme"
          onClick={handleToggleTheme}
          style={{
            minWidth: 70,
            fontSize: 15,
            background: 'var(--kavia-orange)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            marginLeft: 10,
            cursor: 'pointer'
          }}>
          {otherTheme} Theme
        </button>
      </nav>
      <div style={{ marginTop: "70px" }}> {/* offset for navbar */}
        <TetraMaster theme={theme} />
      </div>
    </div>
  );
}

export default App;