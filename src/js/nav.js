/**
 * nav.js — Mobile navigation toggle
 * Minimal vanilla JS: only aria-expanded + hidden attribute.
 * No styling logic — layout handled by CSS media queries.
 */
(function () {
  'use strict';

  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute(
      'aria-label',
      open ? 'Open navigation menu' : 'Close navigation menu'
    );
    menu.toggleAttribute('hidden', open);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
      menu.setAttribute('hidden', '');
      toggle.focus();
    }
  });
})();
