import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import DecryptedText from './components/DecryptedText.jsx';

function DashboardGreeting() {
  const [name, setName] = useState('User');

  useEffect(() => {
    const source = document.getElementById('userName');
    if (!source) return undefined;

    const readName = () => {
      const next = (source.textContent || 'User').trim() || 'User';
      setName(next);
    };

    readName();

    const observer = new MutationObserver(readName);
    observer.observe(source, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  const key = useMemo(() => `greet-${name}`, [name]);

  return (
    <DecryptedText
      key={key}
      text={name}
      speed={30}
      maxIterations={14}
      sequential={false}
      revealDirection="start"
      animateOn="view"
      className="greeting-name"
      encryptedClassName="greeting-name-encrypted"
      parentClassName="greeting-name-wrap"
    />
  );
}

function mountDashboardGreeting() {
  const host = document.getElementById('dashboardGreetingRoot');
  if (!host) return;

  const root = createRoot(host);
  root.render(<DashboardGreeting />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountDashboardGreeting);
} else {
  mountDashboardGreeting();
}
