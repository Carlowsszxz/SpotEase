/* Shared loading UI utilities for consistent UX across pages */

export function showLoading(overlayEl, gridEl, message = 'Loading...') {
  if (overlayEl) overlayEl.setAttribute('aria-hidden', 'false');
  if (gridEl) gridEl.innerHTML = `<p class="small-muted" style="padding:20px">${message}</p>`;
}

export function hideLoading(overlayEl) {
  if (overlayEl) overlayEl.setAttribute('aria-hidden', 'true');
}

export function setStatus(msg, isError, statusBarEl, retryBtnEl) {
  if (statusBarEl) {
    statusBarEl.textContent = msg || '';
    if (isError) statusBarEl.classList.add('error');
    else statusBarEl.classList.remove('error');
  }
  if (retryBtnEl) retryBtnEl.style.display = isError ? 'inline-block' : 'none';
}

export function setButtonsDisabled(buttons, disabled) {
  buttons.forEach(function(b) {
    if (!b) return;
    b.disabled = !!disabled;
    b.setAttribute('aria-busy', !!disabled);
  });
}
