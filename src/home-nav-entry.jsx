import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import PillNav from './components/PillNav.jsx';

function HomeNavApp() {
  const [activeHref, setActiveHref] = useState(window.location.hash || '#home');

  const items = useMemo(() => [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Sign in', href: 'FrameLogin.html' },
  ], []);

  useEffect(() => {
    const onHashChange = () => {
      setActiveHref(window.location.hash || '#home');
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <PillNav
      logo="Images/SpotEase.png"
      logoAlt="SpotEase"
      items={items}
      activeHref={activeHref}
      className="home-pill-nav"
      baseColor="#111111"
      pillColor="#f5f5f5"
      hoveredPillTextColor="#f5f5f5"
      pillTextColor="#111111"
      showTooltip={false}
      initialLoadAnimation
    />
  );
}

function mountHomeNav() {
  const host = document.getElementById('homePillNavRoot');
  if (!host) return;

  const root = createRoot(host);
  root.render(<HomeNavApp />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountHomeNav);
} else {
  mountHomeNav();
}
