import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const mountNode = document.getElementById('root');
if (mountNode) {
  createRoot(mountNode).render(<App />);
}
