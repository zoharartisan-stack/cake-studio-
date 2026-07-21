/* ==========================================================================
   Cake Craft — theme.js
   Header, mobile drawer, nav dropdowns, scroll reveal, 3D cake interaction
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Sticky header shadow ---------- */
  var header = $('[data-header]');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile drawer ---------- */
  var drawer = $('[data-drawer]');
  var overlay = $('[data-drawer-overlay]');
  var openBtn = $('[data-drawer-open]');
  var closeBtn = $('[data-drawer-close]');

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    if (overlay) overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  if (openBtn) openBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  $$('.drawer__link[href]').forEach(function (l) { l.addEventListener('click', closeDrawer); });

  /* ---------- Drawer accordion (Help) ---------- */
  var accToggle = $('[data-drawer-accordion-toggle]');
  if (accToggle) {
    accToggle.addEventListener('click', function () {
      var item = accToggle.closest('[data-drawer-accordion]');
      var open = item.classList.toggle('is-open');
      accToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- Desktop Help dropdown ---------- */
  var helpItem = $('[data-help-desktop]');
  var helpToggle = $('[data-help-toggle]');
  if (helpItem && helpToggle) {
    helpToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = helpItem.classList.toggle('is-open');
      helpToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!helpItem.contains(e.target)) {
        helpItem.classList.remove('is-open');
        helpToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Hero 3D cake — frosting color change ---------- */
  var cake3d = $('[data-cake3d]');
  if (cake3d) {
    var palettes = [
      { f: '#f7d9e3', d: '#eab8c9', l: '#ffffff' },
      { f: '#cde7ff', d: '#a9d1f7', l: '#ffffff' },
      { f: '#d9f7df', d: '#b6ecc2', l: '#ffffff' },
      { f: '#fff0c2', d: '#ffe08a', l: '#ffffff' },
      { f: '#e7d9ff', d: '#cbb3f7', l: '#ffffff' },
      { f: '#ffd9d9', d: '#ffb3b3', l: '#ffffff' }
    ];
    var pi = 0;
    function applyPalette(p) {
      cake3d.style.setProperty('--frosting', p.f);
      cake3d.style.setProperty('--frosting-dark', p.d);
      cake3d.style.setProperty('--frosting-light', p.l);
    }
    var cycle = function () { pi = (pi + 1) % palettes.length; applyPalette(palettes[pi]); };
    cake3d.addEventListener('mouseenter', cycle);
    cake3d.addEventListener('click', cycle);
    cake3d.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycle(); }
    });
  }

  /* ---------- Toast helper (global) ---------- */
  window.CakeCraft = window.CakeCraft || {};
  window.CakeCraft.toast = function (msg) {
    var t = $('[data-toast]');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      t.setAttribute('data-toast', '');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(function () { t.classList.add('is-visible'); });
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('is-visible'); }, 2600);
  };
})();
