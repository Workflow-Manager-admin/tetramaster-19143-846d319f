import React from 'react';
import './App.css';
import TetraMaster from './TetraMaster';

// PUBLIC_INTERFACE
function App() {
  return (
    <div className="app" style={{ background: '#f2e9e4', minHeight: "100vh" }}>
      <TetraMaster />
    </div>
  );
}

export default App;