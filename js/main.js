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


/* ---------------------------------------------------------------------------
   Custom cursor
   A native CSS cursor cannot scale or rotate — the browser paints it outside
   the DOM. To animate it we draw our own element and hide the native one.
   That costs a frame of lag, so the native star in style.css stays as the
   base layer and this only runs where it is safe:
     - precise pointer (no touch)
     - motion not reduced
   Text fields keep the system I-beam and the star hides over them.
--------------------------------------------------------------------------- */
(function () {
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!fine.matches || calm.matches) return;

  var HOT = 'a, button, summary, [role="button"], [tabindex]:not([tabindex="-1"]), label, select';
  var TEXT = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';

  var star = document.createElement('div');
  star.className = 'cursor-star';
  star.setAttribute('aria-hidden', 'true');
  star.appendChild(document.createElement('i'));
  document.body.appendChild(star);

  /* Never hide the native cursor on faith.
     Hiding it is what makes a broken star invisible instead of merely
     wrong, so the page only goes `cursor: none` after the star's image
     has actually decoded. If it 404s, is blocked, or the path is wrong,
     the native star from style.css simply stays on.
     The URL is read back from the computed style rather than hard-coded, so
     the probe tests exactly the file CSS will paint and the relative path
     stays correct from projects/ as well as from the root. */
  var painted = getComputedStyle(star.firstChild).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
  if (!painted) return;
  var probe = new Image();
  probe.onload = function () { document.documentElement.classList.add('cursor-custom'); };
  probe.src = painted[1];

  var x = 0, y = 0, queued = false;

  function paint() {
    queued = false;
    star.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
  }

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!queued) { queued = true; requestAnimationFrame(paint); }

    var t = e.target;
    // Over a text field the system I-beam is doing the work; get out of the way.
    star.classList.toggle('is-on', !(t.closest && t.closest(TEXT)));
    star.classList.toggle('is-hot', !!(t.closest && t.closest(HOT)));
  }, { passive: true });

  document.addEventListener('pointerdown', function () { star.classList.add('is-down'); }, { passive: true });
  document.addEventListener('pointerup', function () { star.classList.remove('is-down'); }, { passive: true });
  document.addEventListener('mouseleave', function () { star.classList.remove('is-on'); });
  window.addEventListener('blur', function () { star.classList.remove('is-on'); });

  // If the user switches to touch or turns on reduced motion mid-session,
  // stand down and let the native cursor take over again.
  function standDown() {
    if (fine.matches && !calm.matches) return;
    star.remove();
    document.documentElement.classList.remove('cursor-custom');
  }
  fine.addEventListener('change', standDown);
  calm.addEventListener('change', standDown);
})();


/* ---------------------------------------------------------------------------
   Nav height -> --nav-h
   The hero is sized to the screen minus the sticky nav. The nav's height
   changes with the breakpoint, the font, and whether the role line shows,
   so it is measured rather than guessed, and re-measured on resize and
   once webfonts land (a fallback font can change the brand's height).
--------------------------------------------------------------------------- */
(function () {
  var nav = document.querySelector('.nav');
  var hero = document.querySelector('.hero');
  if (!nav || !hero) return;

  function sync() {
    hero.style.setProperty('--nav-h', Math.round(nav.getBoundingClientRect().height) + 'px');
  }
  sync();

  if (window.ResizeObserver) new ResizeObserver(sync).observe(nav);
  else window.addEventListener('resize', sync);

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
})();
