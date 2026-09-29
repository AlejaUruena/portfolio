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
      /* No `+ location.hash` here: `new URL(location.href)` already carries
         the fragment, so appending it again doubled it on every click —
         #work, #work#work, #work#work#work#work — and a fragment that
         matches no element id stops the deep link from scrolling anywhere. */
      history.replaceState(null, '', url.toString());
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
   Two things need it: the hero, sized to the screen minus the sticky nav,
   and every anchor target, which must stop below the nav rather than behind
   it. The nav's height
   changes with the breakpoint, the font, and whether the role line shows,
   so it is measured rather than guessed, and re-measured on resize and
   once webfonts land (a fallback font can change the brand's height).
--------------------------------------------------------------------------- */
(function () {
  /* Not gated on .hero: the about and case-study pages have no hero but
     still need the value for their anchors' scroll-margin-top. */
  var nav = document.querySelector('.nav');
  if (!nav) return;

  function sync() {
    /* On the root element, not the hero: the section anchors need it too,
       for their scroll-margin-top. */
    document.documentElement.style.setProperty(
      '--nav-h', Math.round(nav.getBoundingClientRect().height) + 'px');
    var foot = document.querySelector('footer');
    if (foot) document.documentElement.style.setProperty(
      '--footer-h', Math.round(foot.getBoundingClientRect().height) + 'px');
  }
  sync();

  if (window.ResizeObserver) new ResizeObserver(sync).observe(nav);
  else window.addEventListener('resize', sync);

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
})();


/* ---------------------------------------------------------------------------
   Hamburger menu (mobile only)
   The button ships hidden and the panel styles are scoped to .nav-js, so the
   collapsed state only exists once this runs. Without it the three links
   stay on screen — a menu that cannot be opened is worse than no menu.
--------------------------------------------------------------------------- */
(function () {
  var btn = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  var nav = document.querySelector('.nav');
  if (!btn || !menu || !nav) return;

  btn.hidden = false;
  document.documentElement.classList.add('nav-js');

  var mobile = window.matchMedia('(max-width: 760px)');

  function setOpen(open) {
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
  }
  function isOpen() { return btn.getAttribute('aria-expanded') === 'true'; }
  function close(refocus) {
    if (!isOpen()) return;
    setOpen(false);
    if (refocus) btn.focus();
  }

  btn.addEventListener('click', function () {
    var open = !isOpen();
    setOpen(open);
    // Moving focus into the panel is what makes it usable from a keyboard;
    // without it the next Tab would land on whatever follows the button.
    if (open) { var first = menu.querySelector('a'); if (first) first.focus(); }
  });

  // Follow a link and the panel has done its job.
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(false); });

  // Escape closes and hands focus back to the control that opened it.
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });

  // A tap outside is the other way people expect to dismiss it.
  document.addEventListener('click', function (e) {
    if (isOpen() && !nav.contains(e.target)) close(false);
  });

  // Crossing into desktop must not leave the panel in a half state.
  mobile.addEventListener('change', function (m) { if (!m.matches) close(false); });
})();


/* ---------------------------------------------------------------------------
   Contact form (Web3Forms)
   GitHub Pages serves files; it cannot run anything, so the submission goes
   to Web3Forms. There is nothing to configure here — the endpoint lives in
   the form's action and the account is identified by the access_key hidden
   field in index.html. This layer only stops the page from navigating away
   and reports the outcome in place.
--------------------------------------------------------------------------- */
(function () {
  var form = document.querySelector('.contact-form');
  if (!form) return;
  var status = form.querySelector('.form-status');
  var button = form.querySelector('button[type="submit"]');
  var key = form.querySelector('[name="access_key"]');

  function say(msg, kind) {
    status.textContent = msg;
    status.classList.toggle('is-ok', kind === 'ok');
    status.classList.toggle('is-err', kind === 'err');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // No key pasted in yet: say so rather than posting and pretending.
    if (!key || !key.value.trim()) {
      say('The form is not connected yet — please use the email icon below.', 'err');
      return;
    }

    // `novalidate` silences the browser's own bubbles so the message can live
    // in the page, but the constraints themselves still apply.
    if (!form.checkValidity()) {
      say('Please fill in your name, a valid email and a message.', 'err');
      form.reportValidity();
      return;
    }

    button.disabled = true;
    say('Sending\u2026');

    fetch(form.getAttribute('action'), {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form)
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (data) {
        // Web3Forms answers { success: true|false, message }. A 200 alone is
        // not proof it went through, so the flag is what gets checked.
        if (!data.success) throw new Error(data.message || 'failed');
        form.reset();
        say('Thanks \u2014 your message is on its way.', 'ok');
      })
      .catch(function () {
        say('Something went wrong. You can email me directly instead.', 'err');
      })
      .then(function () { button.disabled = false; });
  });
})();


/* ---------------------------------------------------------------------------
   Copy the email address from the footer icon
   The link keeps its mailto: href, so it still works without JS and a
   middle-click or "open in new tab" behaves as expected. JS only takes over
   the plain click.
--------------------------------------------------------------------------- */
(function () {
  var link = document.querySelector('.js-copy-mail');
  if (!link) return;
  var toast = link.querySelector('.copy-toast');
  var addr = link.dataset.copy;
  if (!toast || !addr) return;
  var timer;

  function flash(msg) {
    toast.textContent = msg;
    link.classList.add('is-copied');
    clearTimeout(timer);
    timer = setTimeout(function () { link.classList.remove('is-copied'); }, 1600);
  }

  link.addEventListener('click', function (e) {
    // Leave modified clicks alone — they mean "open this somewhere else".
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (!navigator.clipboard) return;   // no API: fall through to mailto:
    e.preventDefault();
    navigator.clipboard.writeText(addr)
      .then(function () { flash('Copied!'); })
      // Clipboard writes are refused outside a secure context (file:// or
      // plain http), so say what happened instead of failing silently.
      .catch(function () { flash('Press Ctrl+C'); });
  });
})();


/* ---------------------------------------------------------------------------
   Swipe between case studies (mobile only)
   Swipe left for the next project, right for the previous one, plus a sticky
   arrow on the right edge so the gesture is discoverable — an invisible
   gesture is one most people never find. Both are enhancements: the
   "Next project" buttons at the end of each page stay the reliable path,
   which is what keyboards and screen readers use.
--------------------------------------------------------------------------- */
(function () {
  var main = document.querySelector('main[data-next]');
  if (!main) return;
  if (!window.matchMedia('(max-width: 760px)').matches) return;

  var next = { href: main.dataset.next, title: main.dataset.nextTitle };
  var prev = { href: main.dataset.prev, title: main.dataset.prevTitle };

  /* ---- the hints ---- */
  function chevron(d) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
           'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
           '<path d="' + d + '"/></svg>';
  }

  var hints = [];
  function addHint(side, target, label, path) {
    if (!target || !target.href) return;
    var a = document.createElement('a');
    a.className = 'swipe-hint swipe-hint--' + side;
    a.href = target.href;
    a.setAttribute('aria-label', label + ': ' + target.title);
    a.title = label + ': ' + target.title;
    a.innerHTML = chevron(path);
    // Tapping a hint is a navigation in the same direction as the swipe it
    // stands for, so it gets the same transition.
    a.addEventListener('click', function () {
      try { sessionStorage.setItem('vt-dir', side === 'next' ? 'fwd' : 'back'); } catch (err) {}
    });
    document.body.appendChild(a);
    hints.push(a);
  }

  addHint('prev', prev, 'Previous project', 'M15 18l-6-6 6-6');
  addHint('next', next, 'Next project',     'M9 18l6-6-6-6');
  if (!hints.length) return;

  var caseNav = document.querySelector('.case-nav');
  if (caseNav && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      hints.forEach(function (h) { h.classList.toggle('is-away', e[0].isIntersecting); });
    }, { threshold: 0.2 }).observe(caseNav);
  }

  /* ---- the gesture ---- */
  var x0 = 0, y0 = 0, t0 = 0, tracking = false;
  var MIN = 70;        // px of travel before it counts as a swipe
  var RATIO = 1.6;     // horizontal must clearly beat vertical, or it is a scroll
  var MAX_MS = 700;    // a slow drag is not a flick
  var EDGE = 32;       // iOS reads an edge swipe as "go back" — stay out of that lane

  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { tracking = false; return; }   // pinch-zoom
    var t = e.touches[0];
    if (t.clientX < EDGE || t.clientX > window.innerWidth - EDGE) { tracking = false; return; }
    // Don't hijack a touch that started on something interactive.
    if (e.target.closest('a, button, input, textarea, select, summary, video')) { tracking = false; return; }
    x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); tracking = true;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (!tracking) return;
    tracking = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - x0, dy = t.clientY - y0;
    if (Date.now() - t0 > MAX_MS) return;
    if (Math.abs(dx) < MIN) return;
    if (Math.abs(dx) < Math.abs(dy) * RATIO) return;            // that was a scroll

    var target = dx < 0 ? next : prev;                          // left = forward
    if (!target || !target.href) return;

    /* The direction has to survive the navigation: the page that animates is
       the NEW document, and it has no idea which way the finger went. A
       sessionStorage note is the handoff. */
    try { sessionStorage.setItem('vt-dir', dx < 0 ? 'fwd' : 'back'); } catch (err) {}
    location.href = target.href;
  }, { passive: true });
})();



/* ---------------------------------------------------------------------------
   Direction of the page transition
   Reads the note the swipe left in sessionStorage and tags <html> with it, so
   the CSS can pick the matching pair of animations. `pagereveal` fires on the
   incoming document before its first frame, which is the only moment early
   enough to set this. Browsers without cross-document view transitions never
   fire it and simply navigate as before.
--------------------------------------------------------------------------- */
window.addEventListener('pagereveal', function (e) {
  var dir;
  try { dir = sessionStorage.getItem('vt-dir'); sessionStorage.removeItem('vt-dir'); } catch (err) {}
  if (!e.viewTransition || !dir) return;

  document.documentElement.dataset.nav = dir;
  // Tidy up, or a later tapped link would inherit a direction it never asked for.
  e.viewTransition.finished.then(clear, clear);
  function clear() { delete document.documentElement.dataset.nav; }
});


/* ---------------------------------------------------------------------------
   Smooth scrolling (Lenis)
   Desktop only, and only with a precise pointer. Touch keeps the system's own
   momentum: syncTouch is the setting people complain about, because it
   replaces a scroll the phone renders on its own compositor thread with one
   driven from JavaScript.

   Lenis honours prefers-reduced-motion by itself (respectReducedMotion is on
   by default), but the instance is not even created in that case — no library,
   no rAF loop, no cost at all for someone who asked for less motion.
--------------------------------------------------------------------------- */
(function () {
  if (typeof Lenis !== 'function') return;                 // script failed: native scroll
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var lenis = new Lenis({
    /* Short and light. A long duration is what makes a site feel like it is
       arguing with the wheel; 0.8s reads as weight rather than lag. */
    duration: 0.8,
    easing: function (t) { return 1 - Math.pow(1 - t, 3); },  // ease-out cubic
    smoothWheel: true,
    syncTouch: false,          // the phone keeps its native scrolling
    autoRaf: true,             // Lenis runs its own loop
    anchors: false             // handled below, so the nav offset is respected
  });
  window.lenis = lenis;

  /* No offset here on purpose. This version of Lenis already honours the
     section's scroll-margin-top, so passing the nav height again landed the
     heading exactly one nav-height too low. Measured, not assumed. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;

    var url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || url.host !== location.host) return;
    if (!url.hash || url.hash === '#') return;

    var target = document.querySelector(url.hash);
    if (!target) return;

    e.preventDefault();
    lenis.scrollTo(target);
    // Keep the address bar honest without adding a history entry per click.
    history.replaceState(null, '', url.hash);
  });
})();


/* ---------------------------------------------------------------------------
   Section stepping
   One section per gesture. The earlier version let Lenis' inertia run free
   and snapped to whatever point was nearest once it stopped — which meant a
   firm flick from the hero landed on Contact and skipped Projects entirely,
   at every screen size I measured. No threshold fixes that: "coast, then
   snap to nearest" cannot promise you will not fly past a section.

   So the wheel moves to the ADJACENT point and no further. There is nothing
   to free-scroll inside a section anyway — each one is exactly a screen —
   and this is the only model that can guarantee no section is skipped.

   Only where that promise holds: every section must measurably fit the
   window. Anywhere else (short screens, touch, reduced motion) the page
   scrolls normally, which is what those contexts need.
--------------------------------------------------------------------------- */
(function () {
  var lenis = window.lenis;
  if (!lenis) return;

  var sections = ['.hero', '#work', '#contact']
    .map(function (s) { return document.querySelector(s); })
    .filter(Boolean);
  if (sections.length < 2) return;

  var points = [];
  var index = 0;
  var busy = false;
  var acc = 0;
  var accTimer;

  var STEP = 30;        // px of wheel before a gesture counts, so a nudge is not a jump
  var COOLDOWN = 260;   // a trackpad fires a stream of events; one gesture is one step

  function navOffset() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--nav-h');
    return (parseInt(v, 10) || 72) + 12;
  }

  function fits() {
    var room = window.innerHeight - navOffset() + 16;
    var foot = document.querySelector('footer');
    var footH = foot ? foot.getBoundingClientRect().height : 0;
    return sections.every(function (el, i) {
      /* The last section has to leave room for the footer it shares the
         screen with; the others get the whole measure. */
      var allowed = (i === sections.length - 1) ? room - footH : room;
      return el.getBoundingClientRect().height <= allowed + 24;
    });
  }

  function measure() {
    var off = navOffset();
    points = sections.map(function (el, i) {
      // The hero rests at 0: the sticky nav occupies real space above it.
      if (i === 0) return 0;
      return Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - off));
    });
    var bottom = Math.round(document.documentElement.scrollHeight - window.innerHeight);
    if (bottom - points[points.length - 1] > 40) points.push(bottom);
  }

  function nearestIndex() {
    var y = window.scrollY, best = 0, d = Infinity;
    points.forEach(function (v, i) {
      var dist = Math.abs(v - y);
      if (dist < d) { d = dist; best = i; }
    });
    return best;
  }

  function goTo(i) {
    i = Math.max(0, Math.min(points.length - 1, i));
    if (i === index && Math.abs(window.scrollY - points[i]) < 4) return;
    index = i;
    busy = true;
    lenis.scrollTo(points[i], {
      duration: 0.9,
      easing: function (t) { return 1 - Math.pow(1 - t, 3); },
      onComplete: function () { setTimeout(function () { busy = false; }, COOLDOWN); }
    });
    // Safety net: if onComplete never fires, do not lock the page forever.
    setTimeout(function () { busy = false; }, 1600);
  }

  var active = false;

  function onWheel(e) {
    if (!active) return;
    e.preventDefault();               // Lenis must not also coast
    if (busy) return;

    acc += e.deltaY;
    clearTimeout(accTimer);
    accTimer = setTimeout(function () { acc = 0; }, 180);
    if (Math.abs(acc) < STEP) return;

    var dir = acc > 0 ? 1 : -1;
    acc = 0;
    index = nearestIndex();
    goTo(index + dir);
  }

  function onKey(e) {
    if (!active || busy) return;
    var map = { PageDown: 1, PageUp: -1, ArrowDown: 1, ArrowUp: -1, ' ': 1 };
    if (e.key === 'Home') { e.preventDefault(); goTo(0); return; }
    if (e.key === 'End')  { e.preventDefault(); goTo(points.length - 1); return; }
    if (!(e.key in map)) return;
    // Leave form fields alone.
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    e.preventDefault();
    index = nearestIndex();
    goTo(index + map[e.key]);
  }

  function sync() {
    measure();
    var should = fits();
    if (should === active) { index = nearestIndex(); return; }
    active = should;
    if (active) {
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('keydown', onKey);
    } else {
      window.removeEventListener('wheel', onWheel, { passive: false });
      window.removeEventListener('keydown', onKey);
    }
    index = nearestIndex();
  }

  sync();

  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(sync, 200); });
  // A nav link or the vertical tabs can change the page height; re-measure.
  document.addEventListener('click', function () { setTimeout(sync, 900); });
})();
