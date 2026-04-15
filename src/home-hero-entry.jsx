import React from 'react';
import { createRoot } from 'react-dom/client';
import TiltedCard from './components/TiltedCard.jsx';

function getHeroCardSize() {
  const width = window.innerWidth;

  if (width <= 520) {
    return '220px';
  }

  if (width <= 768) {
    return '270px';
  }

  if (width <= 980) {
    return '340px';
  }

  return '460px';
}

function mountHeroTilt() {
  const host = document.getElementById('heroTiltRoot');
  if (!host) return;

  const imageSize = getHeroCardSize();
  const root = createRoot(host);
  root.render(
    <TiltedCard
      imageSrc="Images/Scroll Parallax/Image 2.jpeg"
      altText="Workspace illustration"
      captionText="Sensor Overview"
      containerHeight="100%"
      containerWidth="100%"
      imageHeight={imageSize}
      imageWidth={imageSize}
      rotateAmplitude={10}
      scaleOnHover={1.05}
      showMobileWarning={false}
      showTooltip
      displayOverlayContent={false}
    />
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountHeroTilt);
} else {
  mountHeroTilt();
}
