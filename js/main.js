/* Portfolio — minimal JS.
   Structure lives in HTML/CSS. This only handles what can't be static. */

(function () {
  'use strict';

  /* Footer year. */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------
     Vertical filter.

     Swaps the project list in place — no reload, no scroll jump, so the
     reader never loses their position. The choice is mirrored in the URL
     (?v=product) so a single link can open the site on either vertical:
     send the product link when applying to a product role, without
     maintaining two portfolios.
     --------------------------------------------------------------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.vertical-btn'));
  var panels = {
    games: document.getElementById('panel-games'),
    product: document.getElementById('panel-product')
  };

  function select(vertical, pushState) {
    if (!panels[vertical]) vertical = 'product';

    tabs.forEach(function (tab) {
      var on = tab.dataset.vertical === vertical;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
    });

    Object.keys(panels).forEach(function (key) {
      if (panels[key]) panels[key].hidden = key !== vertical;
    });

    if (pushState && window.history && history.replaceState) {
      var url = new URL(window.location.href);
      if (vertical === 'product') url.searchParams.delete('v');
      else url.searchParams.set('v', vertical);
      history.replaceState(null, '', url.toString() + window.location.hash);
    }
  }

  if (tabs.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        select(tab.dataset.vertical, true);
      });

      /* Arrow-key navigation: expected behaviour for a tab list. */
      tab.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var i = tabs.indexOf(tab);
        var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        select(next.dataset.vertical, true);
      });
    });

    /* Open on the vertical named in the URL; Digital Product otherwise.
       ?v=games is the link to send when applying to games roles. */
    var requested = new URLSearchParams(window.location.search).get('v');
    select(requested === 'games' ? 'games' : 'product', false);
  }

  /* ---------------------------------------------------------------
     Motion previews on hover.

     Three conditions, all checked before a single byte is fetched:
       · the device actually has a hovering pointer (a phone does not)
       · the visitor has not asked for reduced motion
       · the card has a clip to play

     preload="none" means the file is only requested on first hover, so a
     visitor who never hovers pays nothing for seven video files.
     --------------------------------------------------------------- */
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var stillMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (canHover) {
    document.querySelectorAll('.p-row').forEach(function (card) {
      var clip = card.querySelector('.thumb-motion');
      if (!clip) return;

      card.addEventListener('mouseenter', function () {
        if (stillMotion.matches) return;   /* re-checked live, not cached at load */
        card.classList.add('is-playing');
        var playing = clip.play();
        /* Autoplay can still be refused; failing silently is correct here —
           the still image is already a complete answer. */
        if (playing && playing.catch) playing.catch(function () {
          card.classList.remove('is-playing');
        });
      });

      card.addEventListener('mouseleave', function () {
        card.classList.remove('is-playing');
        clip.pause();
        clip.currentTime = 0;
      });

      /* A keyboard user tabbing onto the row gets the same thing a pointer
         gets: CSS opens it via :focus-within, this starts the clip. */
      card.addEventListener('focus', function () {
        if (stillMotion.matches) return;
        card.classList.add('is-playing');
        var playing = clip.play();
        if (playing && playing.catch) playing.catch(function () {
          card.classList.remove('is-playing');
        });
      });
      card.addEventListener('blur', function () {
        card.classList.remove('is-playing');
        clip.pause();
        clip.currentTime = 0;
      });
    });
  }

  /* ---------------------------------------------------------------
     Hero entry buttons: jump to Work with a vertical already chosen.
     They are an entry point, not a second copy of the filter — the tabs
     inside Work stay, for switching once you are there.
     --------------------------------------------------------------- */
  document.querySelectorAll('[data-enter]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.getElementById('work');
      if (!target) return;              /* let the href do its job */
      e.preventDefault();
      select(link.dataset.enter, true);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* Highlight the section currently in view. */
  var sections = document.querySelectorAll('main section[id]');
  var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navLinks.length || !('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      navLinks.forEach(function (link) {
        link.style.color = link.getAttribute('href') === '#' + entry.target.id
          ? 'var(--accent)' : '';
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach(function (s) { observer.observe(s); });
})();
