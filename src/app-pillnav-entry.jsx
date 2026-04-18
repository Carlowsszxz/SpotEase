import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import StaggeredMenu from './components/StaggeredMenu.jsx';

function isLocalhostHost(hostname) {
  const host = (hostname || '').toLowerCase();
  return host === '' || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
}

function AppPillNav() {
  const isLocal = isLocalhostHost(window.location.hostname);
  const path = (window.location.pathname || '').toLowerCase();
  const title = (document.title || '').toLowerCase();
  const isHomePage = path.endsWith('framehome.html') || path === '/' || title.includes('spotease');

  const items = useMemo(() => {
    if (isHomePage) {
      if (isLocal) {
        return [
          { label: 'Home', link: '#home' },
          { label: 'About', link: '#about' },
          { label: 'Sign in', link: 'FrameLogin.html' },
        ];
      }

      return [
        { label: 'Home', link: '#home' },
        { label: 'About', link: '#about' },
        { label: 'Sign in', link: '/login' },
      ];
    }

    if (isLocal) {
      return [
        { label: 'Dashboard', link: 'FrameDashboard.html' },
        { label: 'Map', link: 'FrameMap.html' },
        { label: 'Profile', link: 'FrameProfile.html' },
      ];
    }

    return [
      { label: 'Dashboard', link: '/dashboard' },
      { label: 'Map', link: '/map' },
      { label: 'Profile', link: '/profile' },
    ];
  }, [isHomePage, isLocal]);

  return (
    <StaggeredMenu
      position="right"
      colors={['var(--bt-card)', 'var(--bt-muted)', 'var(--bt-background)']}
      items={items}
      displaySocials={false}
      displayItemNumbering
      className="app-staggered-nav"
      logoUrl="Images/SpotEase.png"
      menuButtonColor="var(--bt-foreground)"
      openMenuButtonColor="var(--bt-foreground)"
      accentColor="var(--bt-accent)"
      changeMenuColorOnOpen
      closeOnClickAway
    />
  );
}

function mountAppPillNav() {
  const host = document.getElementById('appPillNavRoot');
  if (!host) return;

  const root = createRoot(host);
  root.render(<AppPillNav />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAppPillNav);
} else {
  mountAppPillNav();
}
