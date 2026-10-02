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

  /* ---------------------------------------------------------------
     Touch: the same previews, driven by the viewport instead.

     A phone has no hover, so without this the clips never play there at
     all. The trigger is the thumbnail entering the screen — the thumbnail,
     not the whole row: a row on a narrow screen can be taller than the
     viewport, so a ratio threshold measured on the row would never be
     reached and nothing would ever play.

     Only ONE clip plays at a time: the most visible one. Several decoding
     at once is what makes a mid-range phone stutter, and two moving
     thumbnails on one screen compete for attention anyway.

     Four ways out, all of them honoured live rather than cached at load:
       · prefers-reduced-motion
       · Save-Data (the visitor asked their browser to spend less)
       · the tab going to the background
       · play() being refused — the poster is already a complete answer
     preload="none" still holds, so a clip is only fetched the first time
     it actually has to play. A visitor who never scrolls to Work pays
     nothing.
     --------------------------------------------------------------- */
  } else if ('IntersectionObserver' in window) {
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    var clips = [];
    document.querySelectorAll('.p-row').forEach(function (card) {
      var clip = card.querySelector('.thumb-motion');
      if (clip && clip.parentNode) {
        clips.push({ card: card, clip: clip, box: clip.parentNode, ratio: 0 });
      }
    });

    if (clips.length && !saveData) {
      var VISIBLE = 0.6;         /* 60% of the thumbnail, not of the row */
      var playing = null;

      var stop = function (entry) {
        if (!entry) return;
        entry.card.classList.remove('is-playing');
        entry.clip.pause();
        entry.clip.currentTime = 0;
      };

      var pick = function () {
        if (stillMotion.matches || document.hidden) { stop(playing); playing = null; return; }
        var best = null;
        clips.forEach(function (e) {
          if (e.ratio >= VISIBLE && (!best || e.ratio > best.ratio)) best = e;
        });
        if (best === playing) return;
        stop(playing);
        playing = best;
        if (!playing) return;
        playing.card.classList.add('is-playing');
        var started = playing.clip.play();
        if (started && started.catch) started.catch(function () {
          if (playing) playing.card.classList.remove('is-playing');
        });
      };

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          for (var i = 0; i < clips.length; i++) {
            if (clips[i].box === en.target) { clips[i].ratio = en.intersectionRatio; break; }
          }
        });
        pick();
      }, { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] });

      clips.forEach(function (e) { io.observe(e.box); });
      document.addEventListener('visibilitychange', pick);
      if (stillMotion.addEventListener) stillMotion.addEventListener('change', pick);
      else if (stillMotion.addListener) stillMotion.addListener(pick);
    }
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


/* ---------------------------------------------------------------------------
   Hero entrance and cursor pull
   The headline is split into words and each one rises into place; the rest of
   the hero follows a beat behind. Then, on a precise pointer, the words and
   the note lean toward the cursor — a few pixels, with a hard cap, so it
   reads as attention rather than as a toy.

   No animation library: this is a stagger and a lerp, both of which CSS and
   30 lines of rAF already do. GSAP earns its 32KB when there is a timeline
   to choreograph or shapes to morph; here it would be weight without work.
--------------------------------------------------------------------------- */
(function () {
  var line = document.querySelector('.hero-line');
  if (!line) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ---- split into words ---- */
  var words = line.textContent.trim().split(/\s+/);
  var boxes = [];
  line.textContent = '';
  words.forEach(function (word, i) {
    var box = document.createElement('span');
    box.className = 'w';
    box.style.setProperty('--i', i);
    var inner = document.createElement('span');
    inner.className = 'wi';
    inner.textContent = word;
    box.appendChild(inner);
    line.appendChild(box);
    // A real space between the boxes, so the accessible name still reads as
    // a sentence and the line can still wrap.
    if (i < words.length - 1) line.appendChild(document.createTextNode(' '));
    boxes.push(box);
  });

  var root = document.documentElement;
  root.classList.add('hero-anim');

  /* ---- constellation ----
     Art-directed, not random: the positions are fixed so the hero looks the
     same on every visit, and they sit clear of the headline block on the
     left and the note on the lower right. `d` is depth — how far a star
     travels with the cursor — and it tracks size, because the parallax only
     reads as depth if the big ones move more than the small ones.
     x/y in %, w in px, o = resting opacity, d = depth 0..1. */
  var FIELD = [
    { x:  6, y: 14, w: 26, o: .85, d: 1.0, t: 'solid'   },
    { x: 17, y:  8, w: 11, o: .55, d: .45, t: 'outline' },
    { x: 28, y: 20, w:  6, o: .5,  d: .3,  t: 'dot'     },
    { x: 43, y:  9, w: 18, o: .7,  d: .75, t: 'solid'   },
    { x: 56, y: 17, w:  9, o: .45, d: .35, t: 'outline' },
    { x: 66, y:  7, w: 22, o: .8,  d: .9,  t: 'solid'   },
    { x: 78, y: 19, w:  6, o: .45, d: .25, t: 'dot'     },
    { x: 88, y: 11, w: 13, o: .6,  d: .55, t: 'outline' },
    { x: 61, y: 33, w: 28, o: .9,  d: 1.0, t: 'solid'   },
    { x: 72, y: 42, w:  7, o: .4,  d: .3,  t: 'dot'     },
    { x: 93, y: 34, w: 10, o: .5,  d: .4,  t: 'outline' },
    { x: 52, y: 52, w: 12, o: .5,  d: .5,  t: 'outline' },
    { x:  4, y: 62, w:  6, o: .4,  d: .25, t: 'dot'     },
    { x: 12, y: 84, w: 20, o: .75, d: .85, t: 'solid'   },
    { x: 27, y: 92, w: 10, o: .5,  d: .4,  t: 'outline' },
    { x: 41, y: 78, w:  6, o: .4,  d: .3,  t: 'dot'     },
    { x: 58, y: 88, w: 24, o: .8,  d: .95, t: 'solid'   },
    { x: 76, y: 80, w: 11, o: .55, d: .45, t: 'outline' },
    { x: 90, y: 93, w:  7, o: .45, d: .3,  t: 'dot'     },
    { x: 96, y: 64, w: 16, o: .65, d: .7,  t: 'solid'   }
  ];

  var field = document.createElement('div');
  field.className = 'hero-stars';
  field.setAttribute('aria-hidden', 'true');   // decorative: no name, no role
  var stars = [];
  FIELD.forEach(function (c, i) {
    var el = document.createElement('span');
    el.className = 'star s-' + c.t;
    el.style.cssText =
      'left:' + c.x + '%;top:' + c.y + '%;' +
      '--w:' + c.w + 'px;--o:' + c.o + ';' +
      /* Two palette colours, alternating, so the field belongs to the site
         rather than floating on top of it. */
      '--c:' + (i % 3 === 0 ? 'var(--text)' : 'var(--accent)') + ';' +
      /* Entrance lands after the headline; twinkle periods are deliberately
         uneven so they never pulse in unison. */
      '--d:' + (0.55 + i * 0.045).toFixed(2) + 's;' +
      '--tw:' + (3.4 + (i % 5) * 0.9).toFixed(1) + 's';
    field.appendChild(el);
    stars.push({ el: el, depth: c.d });
  });
  var heroEl = document.querySelector('.hero');
  if (heroEl) heroEl.insertBefore(field, heroEl.firstChild);

  /* ---- play it ---- */
  function play() { requestAnimationFrame(function () { root.classList.add('is-in'); }); }
  var started = false;
  function start() { if (!started) { started = true; play(); } }
  // Wait for the webfonts so the words do not reflow mid-rise, but never
  // wait long: a hidden headline is the worst failure mode here.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  setTimeout(start, 700);

  /* ---- cursor pull ---- */
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var note = document.querySelector('.hero-note');
  var targets = boxes.map(function (el) { return { el: el, max: 9, radius: 320, x: 0, y: 0, tx: 0, ty: 0 }; });
  if (note) targets.push({ el: note, max: 14, radius: 520, x: 0, y: 0, tx: 0, ty: 0 });

  var hero = document.querySelector('.hero');
  var pointer = { x: -9999, y: -9999 };
  var running = false;

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    pointer.x = e.clientX; pointer.y = e.clientY;
    if (!running) { running = true; requestAnimationFrame(tick); }
  }, { passive: true });

  var STAR_MAX = 26;   // px of travel for the deepest star

  function tick() {
    var rest = true;

    /* The field reads the cursor's position in the hero rather than its
       distance to each star: a constellation should drift as one plane,
       with the near stars outrunning the far ones. */
    if (heroEl && stars.length) {
      var hr = heroEl.getBoundingClientRect();
      var nx = (pointer.x - (hr.left + hr.width / 2)) / (hr.width / 2);
      var ny = (pointer.y - (hr.top + hr.height / 2)) / (hr.height / 2);
      if (pointer.x < -9000) { nx = 0; ny = 0; }
      nx = Math.max(-1, Math.min(1, nx));
      ny = Math.max(-1, Math.min(1, ny));
      stars.forEach(function (st) {
        st.x = (st.x || 0) + ((-nx * st.depth * STAR_MAX) - (st.x || 0)) * 0.08;
        st.y = (st.y || 0) + ((-ny * st.depth * STAR_MAX) - (st.y || 0)) * 0.08;
        st.el.style.setProperty('--px', st.x.toFixed(2) + 'px');
        st.el.style.setProperty('--py', st.y.toFixed(2) + 'px');
        // The field has to count toward "settled" as well, or the loop stops
        // while the stars are still drifting toward their mark.
        var tx = -nx * st.depth * STAR_MAX, ty = -ny * st.depth * STAR_MAX;
        if (Math.abs(tx - st.x) > 0.05 || Math.abs(ty - st.y) > 0.05) rest = false;
      });
    }

    targets.forEach(function (t) {
      var r = t.el.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = pointer.x - cx, dy = pointer.y - cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      // Influence falls off to nothing at the radius, so a word only reacts
      // to a cursor that is actually near it.
      var pull = dist > t.radius ? 0 : (1 - dist / t.radius);
      t.tx = dist ? (dx / dist) * pull * t.max : 0;
      t.ty = dist ? (dy / dist) * pull * t.max : 0;
      t.x += (t.tx - t.x) * 0.12;
      t.y += (t.ty - t.y) * 0.12;
      if (Math.abs(t.tx - t.x) > 0.05 || Math.abs(t.ty - t.y) > 0.05) rest = false;
      t.el.style.setProperty('--dx', t.x.toFixed(2) + 'px');
      t.el.style.setProperty('--dy', t.y.toFixed(2) + 'px');
    });
    // Stop the loop once everything has settled; restart on the next move.
    if (rest) { running = false; return; }
    requestAnimationFrame(tick);
  }

  // Leaving the hero releases everything rather than freezing it mid-lean.
  if (hero) hero.addEventListener('pointerleave', function () {
    pointer.x = -9999; pointer.y = -9999;
    if (!running) { running = true; requestAnimationFrame(tick); }
  });
})();
