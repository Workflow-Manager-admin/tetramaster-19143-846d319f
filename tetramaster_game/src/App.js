import React from 'react';
import './App.css';
import TetraMaster from './TetraMaster';

// PUBLIC_INTERFACE
function App() {
  // No theme state or toggling, just static palette/colors everywhere.
  return (
    <div className="app">
      <nav className="navbar" style={{ zIndex: 200 }}>
        <div className="logo">
          <span className="logo-symbol">▣</span>
          TetraMaster
        </div>
      </nav>
      <div style={{ marginTop: "70px" }}> {/* offset for navbar */}
        <TetraMaster />
      </div>
    </div>
  );
}

export default App;