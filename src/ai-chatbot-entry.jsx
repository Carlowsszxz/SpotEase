import React from 'react';
import { createRoot } from 'react-dom/client';
import AiChatbot from './components/AiChatbot.jsx';
import '../CSS/ai-chatbot.css';

function mountAiChatbot() {
  const host = document.getElementById('aiChatbotRoot') || (() => {
    const el = document.createElement('div');
    el.id = 'aiChatbotRoot';
    document.body.appendChild(el);
    return el;
  })();

  createRoot(host).render(<AiChatbot />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAiChatbot);
} else {
  mountAiChatbot();
}
