/* Reusable modal utility functions */

/**
 * Open a modal with optional overlay
 * @param {HTMLElement} modalPanel - the modal panel element
 * @param {HTMLElement} modalOverlay - the overlay element (optional)
 */
export function openModal(modalPanel, modalOverlay) {
  if (modalPanel) {
    modalPanel.setAttribute('aria-hidden', 'false');
    modalPanel.style.display = 'block';
  }
  if (modalOverlay) {
    modalOverlay.classList.add('show');
  }
}

/**
 * Close a modal with optional overlay
 * @param {HTMLElement} modalPanel - the modal panel element
 * @param {HTMLElement} modalOverlay - the overlay element (optional)
 */
export function closeModal(modalPanel, modalOverlay) {
  if (modalPanel) {
    modalPanel.setAttribute('aria-hidden', 'true');
    modalPanel.style.display = 'none';
  }
  if (modalOverlay) {
    modalOverlay.classList.remove('show');
  }
}

/**
 * Attach close handlers to modal
 * @param {HTMLElement} modalPanel - the modal panel element
 * @param {HTMLElement} modalOverlay - the overlay element
 * @param {HTMLElement} closeBtn - the close button (optional)
 */
export function attachModalHandlers(modalPanel, modalOverlay, closeBtn) {
  // Close button handler
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      closeModal(modalPanel, modalOverlay);
    });
  }

  // Overlay click handler (close when clicking outside)
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function() {
      closeModal(modalPanel, modalOverlay);
    });
  }

  // Escape key handler
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal(modalPanel, modalOverlay);
    }
  });
}

/**
 * Toggle modal visibility
 * @param {HTMLElement} modalPanel - the modal panel element
 * @param {HTMLElement} modalOverlay - the overlay element (optional)
 */
export function toggleModal(modalPanel, modalOverlay) {
  if (modalPanel && modalPanel.getAttribute('aria-hidden') === 'false') {
    closeModal(modalPanel, modalOverlay);
  } else {
    openModal(modalPanel, modalOverlay);
  }
}
