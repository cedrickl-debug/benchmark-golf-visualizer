/* ────────────────────────────────────────────────────────────────
   Benchmark Golf — hero preview

   Each frame is the hero rendered at its real breakpoint size and
   then scaled down, so proportions match the comp exactly. Every
   frame's clip runs off one master clock, so variations dropped at
   different moments still sit on the same frame.
   ──────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var board   = document.querySelector('[data-board]');
  var fileIn  = document.querySelector('[data-file]');
  var scrub   = document.querySelector('[data-scrub]');
  var curEl   = document.querySelector('[data-cur]');
  var durEl   = document.querySelector('[data-dur]');
  var playBtn = document.querySelector('[data-play]');
  var loopBtn = document.querySelector('[data-loop]');
  var transport = document.querySelector('[data-transport]');

  var STARS = '★★★★★';

  /* ── the two frame templates, at their native breakpoint sizes ── */
  var MOCK = {
    desktop: {
      label: 'Desktop', nw: 1920, nh: 985,
      html:
        '<div class="mock m-d">' +
          '<div class="m-d__hdr">' +
            '<img src="assets/img/logo-header.png" alt="">' +
            '<nav class="m-d__nav"><span>Shop</span><span>How it works</span><span>Our Mission</span><span>Contact</span></nav>' +
            '<div class="m-d__act"><span>Login</span><span>Cart<b class="m-d__cart">2</b></span></div>' +
          '</div>' +
          '<div class="m-d__bar">' +
            '<img src="assets/img/sun.jpg" alt=""><span>SALE NAME</span><b>60% OFF</b>' +
            '<span>ENDS IN<em data-clock>10:56:59</em></span><img src="assets/img/sun.jpg" alt="">' +
          '</div>' +
          '<div class="m-d__hero">' +
            '<img class="mock__still" src="assets/img/hero-still.jpg" alt="">' +
            '<video class="mock__vid" playsinline muted preload="auto" hidden></video>' +
            '<div class="mock__scrim"></div>' +
            '<div class="m-d__copy">' +
              '<div><h1 class="m-d__h1">Train smart.<br>Improve fast.</h1>' +
              '<span class="m-d__btn">Explore Golf at Home</span></div>' +
              '<ul class="m-d__awards">' +
                '<li><b>#1</b><span>Bestseller</span></li>' +
                '<li><b>Golf SIM 2026</b><span>TOP Consumer</span></li>' +
                '<li><b>AI Startup</b><span>Winning</span></li>' +
              '</ul>' +
            '</div>' +
            '<ul class="m-d__chips">' +
              '<li><b>4.8</b><i>' + STARS + '</i></li>' +
              '<li><b>4.6</b><i>' + STARS + '</i></li>' +
              '<li><b>600+</b> Unique Courses</li>' +
              '<li><b>70,000+</b> Lessons Taught</li>' +
            '</ul>' +
          '</div>' +
        '</div>'
    },
    mobile: {
      label: 'Mobile', nw: 430, nh: 676,
      html:
        '<div class="mock m-m">' +
          '<div class="m-m__hdr">' +
            '<span class="m-m__burger"><span></span><span></span><span></span></span>' +
            '<img src="assets/img/logo-header.png" alt="">' +
            '<span class="m-m__act"><b class="m-m__cart">2</b></span>' +
          '</div>' +
          '<div class="m-m__bar">' +
            '<img src="assets/img/sun.jpg" alt=""><span>SALE NAME</span><i></i><b>60% OFF</b><i></i>' +
            '<span>ENDS IN<em data-clock>10:56:59</em></span><img src="assets/img/sun.jpg" alt="">' +
          '</div>' +
          '<div class="m-m__hero">' +
            '<img class="mock__still" src="assets/img/hero-still.jpg" alt="">' +
            '<video class="mock__vid" playsinline muted preload="auto" hidden></video>' +
            '<div class="mock__scrim"></div>' +
            '<div class="m-m__copy">' +
              '<h1 class="m-m__h1">Train smart.<br>Improve fast.</h1>' +
              '<span class="m-m__btn">Explore Golf at Home</span>' +
              '<ul class="m-m__awards">' +
                '<li><b>#1</b><span>Bestseller</span></li>' +
                '<li><b>Golf SIM 2026</b><span>TOP Consumer</span></li>' +
                '<li><b>AI Startup</b><span>Winning</span></li>' +
              '</ul>' +
            '</div>' +
            '<ul class="m-m__chips">' +
              '<li><b>4.8</b><i>' + STARS + '</i></li>' +
              '<li><b>4.6</b><i>' + STARS + '</i></li>' +
              '<li><b>600+</b> Courses</li>' +
            '</ul>' +
          '</div>' +
        '</div>'
    }
  };

  /* ── state ── */
  var views = [];
  var playing = false, rate = 1, looping = true, soloId = null, scrubbing = false;
  var anchorT = 0, anchorW = 0, seq = 0;

  var HARD = 0.22, SOFT = 0.035, FRAME = 1 / 30;
  var clock = function () { return performance.now() / 1000; };
  var clamp = function (n, a, b) { return n < a ? a : n > b ? b : n; };

  function masterTime() { return playing ? anchorT + (clock() - anchorW) * rate : anchorT; }
  function setMaster(t) { anchorT = Math.max(0, t); anchorW = clock(); }

  function loaded() { return views.filter(function (v) { return v.ready; }); }
  function duration() {
    var d = 0;
    loaded().forEach(function (v) {
      if (v.video.duration && isFinite(v.video.duration)) d = Math.max(d, v.video.duration - v.offset);
    });
    return d;
  }
  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    return Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') +
           '.' + String(Math.floor((t * 100) % 100)).padStart(2, '0');
  }

  /* ── frames ── */
  function addView(kind) {
    var spec = MOCK[kind];
    var v = { id: ++seq, kind: kind, nw: spec.nw, nh: spec.nh, offset: 0, ready: false, file: null, url: null };

    var el = document.createElement('section');
    el.className = 'viewer viewer--' + kind;
    el.innerHTML =
      '<div class="viewer__bar">' +
        '<span class="viewer__kind">' + spec.label + '</span>' +
        '<span class="viewer__file is-empty">drop a video</span>' +
        '<span class="viewer__t"></span>' +
        '<button class="viewer__btn" type="button" data-solo aria-label="Play this frame’s audio">' +
          '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9.4h3.6L12 5.6v12.8L7.6 14.6H4z"/><path d="M15.4 9.6a3.4 3.4 0 0 1 0 4.8M18 7a7 7 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<button class="viewer__btn" type="button" data-eject aria-label="Remove this frame">' +
          '<svg viewBox="0 0 24 24"><path d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="viewer__stage">' + spec.html + '<div class="viewer__drop">drop here</div></div>';

    v.el = el;
    v.stage = el.querySelector('.viewer__stage');
    v.mock = el.querySelector('.mock');
    v.video = el.querySelector('.mock__vid');
    v.still = el.querySelector('.mock__still');
    v.name = el.querySelector('.viewer__file');
    v.tEl = el.querySelector('.viewer__t');
    v.soloBtn = el.querySelector('[data-solo]');

    el.querySelector('[data-eject]').addEventListener('click', function () { removeView(v); });
    v.soloBtn.addEventListener('click', function () {
      soloId = soloId === v.id ? null : v.id;
      applyAudio();
    });

    v.video.addEventListener('loadedmetadata', function () {
      v.ready = true;
      v.video.hidden = false;
      // land on the master frame right away — this is what lets a clip
      // dropped a minute late line up with the ones already running
      syncOne(v, masterTime(), true);
      if (playing) v.video.play().catch(function () {});
      paint();
    });
    v.video.addEventListener('error', function () {
      v.name.textContent = (v.file ? v.file.name : '') + ' — unsupported';
      v.name.classList.remove('is-empty');
    });

    board.appendChild(el);
    views.push(v);
    rescale(v);
    if (ro) ro.observe(v.stage);
    transport.hidden = !loaded().length;
    return v;
  }

  function removeView(v) {
    var i = views.indexOf(v);
    if (i > -1) views.splice(i, 1);
    if (v.url) { v.video.pause(); v.video.removeAttribute('src'); v.video.load(); URL.revokeObjectURL(v.url); }
    if (ro) ro.unobserve(v.stage);
    v.el.remove();
    if (soloId === v.id) soloId = null;
    if (!loaded().length) { playing = false; document.body.removeAttribute('data-playing'); transport.hidden = true; }
    applyAudio();
    paint();
  }

  function rescale(v) {
    var s = v.stage.clientWidth / v.nw;
    v.mock.style.transform = 'scale(' + s + ')';
    v.stage.style.height = (v.nh * s) + 'px';
  }
  var ro = window.ResizeObserver ? new ResizeObserver(function (entries) {
    entries.forEach(function (e) {
      var v = views.find(function (x) { return x.stage === e.target; });
      if (v) rescale(v);
    });
  }) : null;
  addEventListener('resize', function () { views.forEach(rescale); });

  /* ── loading clips ── */
  var VIDEO_RE = /\.(mp4|m4v|mov|webm|ogv|ogg|mkv|avi)$/i;
  function onlyVideos(list) {
    return Array.prototype.filter.call(list || [], function (f) {
      return (f.type && f.type.indexOf('video/') === 0) || VIDEO_RE.test(f.name);
    });
  }

  function loadInto(v, file) {
    if (v.url) { URL.revokeObjectURL(v.url); v.ready = false; }
    v.file = file;
    v.url = URL.createObjectURL(file);
    v.offset = 0;
    v.video.src = v.url;
    v.name.textContent = file.name;
    v.name.classList.remove('is-empty');
    v.still.style.opacity = '0';
    transport.hidden = false;
    applyAudio();
  }

  /** Spread dropped files across frames; make new desktop frames if we run out. */
  function distribute(files, target) {
    if (!files.length) return;
    var first = loaded().length === 0;

    if (target) {
      loadInto(target, files[0]);
      files = files.slice(1);
    }
    files.forEach(function (f) {
      var free = views.find(function (v) { return !v.file; });
      loadInto(free || addView('desktop'), f);
    });

    if (first) { setMaster(0); play(); }
  }

  /* ── transport ── */
  function play() {
    if (!loaded().length) return;
    var d = duration();
    if (d > 0 && masterTime() >= d - 0.02) setMaster(0);
    setMaster(masterTime());
    playing = true;
    document.body.setAttribute('data-playing', '');
    loaded().forEach(function (v) { v.video.play().catch(function () {}); });
  }
  function pause() {
    setMaster(masterTime());
    playing = false;
    document.body.removeAttribute('data-playing');
    views.forEach(function (v) { if (v.video) v.video.pause(); });
  }
  function toggle() { playing ? pause() : play(); }

  function seek(t) {
    setMaster(clamp(t, 0, duration() || 0));
    loaded().forEach(function (v) { syncOne(v, masterTime(), true); });
    paint();
  }
  function setRate(r) {
    setMaster(masterTime());
    rate = r;
    document.querySelectorAll('[data-rate]').forEach(function (b) {
      b.classList.toggle('is-on', parseFloat(b.getAttribute('data-rate')) === r);
    });
  }
  function applyAudio() {
    views.forEach(function (v) {
      var on = v.id === soloId && !!v.file;
      if (v.video) v.video.muted = !on;
      if (v.soloBtn) v.soloBtn.classList.toggle('is-on', on);
    });
  }

  /* ── the sync itself ── */
  function syncOne(v, t, force) {
    var el = v.video;
    if (!v.ready || !el.duration || !isFinite(el.duration)) return;
    var target = t + v.offset;

    if (target < 0 || target > el.duration) {           // past this clip's own end
      if (!el.paused) el.pause();
      var edge = target < 0 ? 0 : el.duration;
      if (Math.abs(el.currentTime - edge) > 0.05) { try { el.currentTime = edge; } catch (e) {} }
      v.el.classList.add('is-out');
      return;
    }
    v.el.classList.remove('is-out');

    if (!playing) {
      if (!el.paused) el.pause();
      if (force || Math.abs(el.currentTime - target) > 0.02) { try { el.currentTime = target; } catch (e) {} }
      el.playbackRate = rate;
      return;
    }
    if (el.paused && !el.seeking) el.play().catch(function () {});

    var diff = target - el.currentTime, mag = Math.abs(diff);
    if (force || mag > HARD) {
      try { el.currentTime = target; } catch (e) {}
      el.playbackRate = rate;
    } else if (mag > SOFT) {
      // ease back rather than seek — seeking is what makes this look janky
      el.playbackRate = clamp(rate * (1 + diff * 1.8), rate * 0.75, rate * 1.3);
    } else {
      el.playbackRate = rate;
    }
  }

  function paint() {
    var t = masterTime(), d = duration();
    curEl.textContent = fmt(t);
    durEl.textContent = fmt(d);
    if (!scrubbing) {
      var p = d > 0 ? clamp(t / d, 0, 1) : 0;
      scrub.value = String(Math.round(p * 1000));
      scrub.style.setProperty('--p', (p * 100).toFixed(2) + '%');
    }
    views.forEach(function (v) {
      v.tEl.textContent = v.ready ? fmt(clamp(v.video.currentTime, 0, v.video.duration || 0)) : '';
    });
  }

  function tick() {
    requestAnimationFrame(tick);
    var live = loaded();
    if (!live.length) return;
    var d = duration();
    if (playing && d > 0 && masterTime() >= d) {
      if (looping) { setMaster(0); live.forEach(function (v) { syncOne(v, 0, true); }); }
      else { setMaster(d); pause(); }
    }
    var t = masterTime();
    live.forEach(function (v) { syncOne(v, t, false); });
    paint();
  }
  requestAnimationFrame(tick);

  /* ── drag & drop ── */
  var depth = 0, hovered = null;
  function hasFiles(e) {
    var dt = e.dataTransfer;
    if (!dt || !dt.types) return false;
    for (var i = 0; i < dt.types.length; i++) if (dt.types[i] === 'Files') return true;
    return false;
  }
  function markTarget(el) {
    if (hovered && hovered !== el) hovered.classList.remove('is-target');
    hovered = el;
    if (el) el.classList.add('is-target');
    document.querySelector('[data-veil]').classList.toggle('is-hushed', !!el);
  }

  addEventListener('dragenter', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault(); depth++;
    document.body.setAttribute('data-drag', '');
  });
  addEventListener('dragover', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    markTarget(e.target.closest ? e.target.closest('.viewer') : null);
  });
  addEventListener('dragleave', function (e) {
    if (!hasFiles(e)) return;
    depth = Math.max(0, depth - 1);
    if (!depth) { document.body.removeAttribute('data-drag'); markTarget(null); }
  });
  addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    document.body.removeAttribute('data-drag');
    var onto = e.target.closest ? e.target.closest('.viewer') : null;
    markTarget(null);
    var v = onto ? views.find(function (x) { return x.el === onto; }) : null;
    distribute(onlyVideos(e.dataTransfer.files), v);
  });

  /* ── controls ── */
  document.querySelectorAll('[data-browse]').forEach(function (b) {
    b.addEventListener('click', function () { fileIn.click(); });
  });
  fileIn.addEventListener('change', function () {
    distribute(onlyVideos(fileIn.files), null);
    fileIn.value = '';
  });
  document.querySelectorAll('[data-add]').forEach(function (b) {
    b.addEventListener('click', function () { addView(b.getAttribute('data-add')); });
  });
  playBtn.addEventListener('click', toggle);
  document.querySelector('[data-restart]').addEventListener('click', function () { seek(0); play(); });
  document.querySelector('[data-clear]').addEventListener('click', function () {
    views.slice().forEach(removeView);
    addView('desktop'); addView('mobile');
    setMaster(0); paint();
  });
  loopBtn.addEventListener('click', function () {
    looping = !looping;
    loopBtn.classList.toggle('is-on', looping);
    loopBtn.setAttribute('aria-pressed', String(looping));
  });
  document.querySelectorAll('[data-rate]').forEach(function (b) {
    b.addEventListener('click', function () { setRate(parseFloat(b.getAttribute('data-rate'))); });
  });
  scrub.addEventListener('pointerdown', function () { scrubbing = true; });
  addEventListener('pointerup', function () { scrubbing = false; });
  scrub.addEventListener('input', function () {
    var d = duration();
    scrub.style.setProperty('--p', (scrub.value / 10).toFixed(2) + '%');
    if (d > 0) seek(d * scrub.value / 1000);
  });

  addEventListener('keydown', function (e) {
    if (!loaded().length) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    switch (e.key) {
      case ' ': if (t && t.tagName === 'BUTTON') return; e.preventDefault(); toggle(); break;
      case 'ArrowLeft':  e.preventDefault(); seek(masterTime() - (e.shiftKey ? FRAME : 1)); break;
      case 'ArrowRight': e.preventDefault(); seek(masterTime() + (e.shiftKey ? FRAME : 1)); break;
      case 'r': case 'R': seek(0); play(); break;
      case 'm': case 'M': soloId = null; applyAudio(); break;
      case 'l': case 'L': loopBtn.click(); break;
    }
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden && playing) pause(); });

  /* ── promo countdown, mirrored into every frame ── */
  var left = 10 * 3600 + 56 * 60 + 59;
  setInterval(function () {
    left = left > 0 ? left - 1 : 0;
    var s = String(Math.floor(left / 3600)).padStart(2, '0') + ':' +
            String(Math.floor(left / 60) % 60).padStart(2, '0') + ':' +
            String(left % 60).padStart(2, '0');
    document.querySelectorAll('[data-clock]').forEach(function (el) { el.textContent = s; });
  }, 1000);

  /* ── boot: one horizontal frame, one vertical ── */
  addView('desktop');
  addView('mobile');
  transport.hidden = true;
  paint();
})();
