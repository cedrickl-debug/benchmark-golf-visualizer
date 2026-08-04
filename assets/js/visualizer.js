/* ────────────────────────────────────────────────────────────────
   Benchmark Golf — synced multi-clip visualiser

   Every clip is slaved to one master clock, so clips dropped at
   different moments land on the same frame. Nothing is uploaded:
   files stay in the tab as object URLs.
   ──────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var hero = document.getElementById('hero');
  if (!hero) return;

  var stage   = hero.querySelector('[data-stage]');
  var grid    = hero.querySelector('[data-grid]');
  var fileIn  = hero.querySelector('[data-file]');
  var scrub   = hero.querySelector('[data-scrub]');
  var curEl   = hero.querySelector('[data-cur]');
  var durEl   = hero.querySelector('[data-dur]');
  var playBtn = hero.querySelector('[data-play]');
  var loopBtn = hero.querySelector('[data-loop]');

  /* ── state ─────────────────────────────────────────────────── */
  var clips    = [];      // { id, file, url, v, box, offset, ready }
  var playing  = false;
  var rate     = 1;
  var looping  = true;
  var soloId   = null;
  var scrubbing = false;
  var anchorT  = 0;       // master time captured at anchorWall
  var anchorW  = 0;       // performance.now()/1000 at capture
  var seq      = 0;

  var HARD = 0.22;        // s of drift → hard seek
  var SOFT = 0.035;       // s of drift → correct with playbackRate
  var FRAME = 1 / 30;

  var clock = function () { return performance.now() / 1000; };
  var clamp = function (n, a, b) { return n < a ? a : n > b ? b : n; };

  function masterTime() {
    return playing ? anchorT + (clock() - anchorW) * rate : anchorT;
  }
  function setMaster(t) { anchorT = Math.max(0, t); anchorW = clock(); }

  /** Master duration = the longest clip once its offset is applied. */
  function duration() {
    var d = 0;
    for (var i = 0; i < clips.length; i++) {
      var c = clips[i];
      if (c.v.duration && isFinite(c.v.duration)) d = Math.max(d, c.v.duration - c.offset);
    }
    return d;
  }

  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    var cs = Math.floor((t * 100) % 100);
    return m + ':' + String(s).padStart(2, '0') + '.' + String(cs).padStart(2, '0');
  }

  /* ── transport ─────────────────────────────────────────────── */
  function play() {
    if (!clips.length) return;
    if (duration() > 0 && masterTime() >= duration() - 0.02) setMaster(0);
    setMaster(masterTime());
    playing = true;
    hero.setAttribute('data-playing', '');
    clips.forEach(function (c) { if (c.ready) c.v.play().catch(function () {}); });
  }
  function pause() {
    setMaster(masterTime());
    playing = false;
    hero.removeAttribute('data-playing');
    clips.forEach(function (c) { c.v.pause(); });
  }
  function toggle() { playing ? pause() : play(); }

  function seek(t) {
    var d = duration();
    setMaster(clamp(t, 0, d || 0));
    clips.forEach(function (c) { syncClip(c, masterTime(), true); });
    paint();
  }

  function setRate(r) {
    setMaster(masterTime());          // re-anchor before the rate changes
    rate = r;
    hero.querySelectorAll('[data-rate]').forEach(function (b) {
      b.classList.toggle('is-on', parseFloat(b.getAttribute('data-rate')) === r);
    });
  }

  /* ── per-clip sync ─────────────────────────────────────────── */
  function syncClip(c, t, force) {
    var v = c.v;
    if (!c.ready || !v.duration || !isFinite(v.duration)) return;

    var target = t + c.offset;

    // Outside this clip's own range: park on the nearest edge and hold.
    if (target < 0 || target > v.duration) {
      if (!v.paused) v.pause();
      var edge = target < 0 ? 0 : v.duration;
      if (Math.abs(v.currentTime - edge) > 0.05) { try { v.currentTime = edge; } catch (e) {} }
      c.box.classList.add('is-out');
      return;
    }
    c.box.classList.remove('is-out');

    if (!playing) {
      if (!v.paused) v.pause();
      if (force || Math.abs(v.currentTime - target) > 0.02) {
        try { v.currentTime = target; } catch (e) {}
      }
      v.playbackRate = rate;
      return;
    }

    if (v.paused && !v.seeking) v.play().catch(function () {});

    var diff = target - v.currentTime;
    var mag  = Math.abs(diff);

    if (force || mag > HARD) {
      try { v.currentTime = target; } catch (e) {}
      v.playbackRate = rate;
    } else if (mag > SOFT) {
      // Ease back into line instead of seeking — seeking is what makes
      // multi-video playback look janky.
      v.playbackRate = clamp(rate * (1 + diff * 1.8), rate * 0.75, rate * 1.3);
    } else {
      v.playbackRate = rate;
    }
  }

  /* ── render loop ───────────────────────────────────────────── */
  function paint() {
    var t = masterTime();
    var d = duration();
    if (curEl) curEl.textContent = fmt(t);
    if (durEl) durEl.textContent = fmt(d);
    if (scrub && !scrubbing) {
      var p = d > 0 ? clamp(t / d, 0, 1) : 0;
      scrub.value = String(Math.round(p * 1000));
      scrub.style.setProperty('--p', (p * 100).toFixed(2) + '%');
    }
    for (var i = 0; i < clips.length; i++) {
      var c = clips[i];
      if (c.meta) c.meta.textContent = c.ready ? fmt(clamp(c.v.currentTime, 0, c.v.duration || 0)) : '…';
    }
  }

  function tick() {
    requestAnimationFrame(tick);
    if (!clips.length) return;

    var d = duration();
    if (playing && d > 0 && masterTime() >= d) {
      if (looping) {
        setMaster(0);
        clips.forEach(function (c) { syncClip(c, 0, true); });
      } else {
        setMaster(d);
        pause();
      }
    }

    var t = masterTime();
    for (var i = 0; i < clips.length; i++) syncClip(clips[i], t, false);
    paint();
  }
  requestAnimationFrame(tick);

  /* ── layout ────────────────────────────────────────────────── */
  function layout() {
    var n = clips.length;
    var cols = n <= 1 ? 1 : n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : n <= 8 ? 4 : Math.ceil(Math.sqrt(n));
    if (innerWidth < 700) cols = Math.min(cols, n <= 1 ? 1 : 2);
    grid.style.setProperty('--cols', cols);
  }
  addEventListener('resize', layout);

  /* ── audio solo ────────────────────────────────────────────── */
  function applyAudio() {
    clips.forEach(function (c) {
      var on = c.id === soloId;
      c.v.muted = !on;
      if (c.soloBtn) {
        c.soloBtn.classList.toggle('is-on', on);
        c.soloBtn.setAttribute('aria-label', on ? 'Mute ' + c.file.name : 'Play audio from ' + c.file.name);
      }
    });
  }

  /* ── add / remove ──────────────────────────────────────────── */
  var VIDEO_RE = /\.(mp4|m4v|mov|webm|ogv|ogg|mkv|avi)$/i;

  function addFiles(list) {
    var files = Array.prototype.filter.call(list || [], function (f) {
      return (f.type && f.type.indexOf('video/') === 0) || VIDEO_RE.test(f.name);
    });
    if (!files.length) return;

    var wasEmpty = clips.length === 0;
    files.forEach(addClip);

    hero.setAttribute('data-state', 'live');
    stage.hidden = false;
    layout();

    if (wasEmpty) { setMaster(0); play(); }
    else if (playing) { /* new clips catch up on their loadedmetadata */ }
  }

  function addClip(file) {
    var c = {
      id: ++seq,
      file: file,
      url: URL.createObjectURL(file),
      offset: 0,
      ready: false
    };

    var box = document.createElement('div');
    box.className = 'clip';
    box.innerHTML =
      '<video playsinline muted preload="auto"></video>' +
      '<div class="clip__top">' +
        '<span class="clip__name"></span>' +
        '<span class="clip__meta">…</span>' +
        '<button class="clip__btn" type="button" data-solo aria-label="Play audio from this clip">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9.4h3.6L12 5.6v12.8L7.6 14.6H4z"/><path d="M15.4 9.6a3.4 3.4 0 0 1 0 4.8M18 7a7 7 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<button class="clip__btn" type="button" data-remove aria-label="Remove this clip">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="clip__nudge">' +
        '<button class="clip__btn" type="button" data-nudge="-1" aria-label="Shift this clip 100ms earlier">−</button>' +
        '<b>+0.00s</b>' +
        '<button class="clip__btn" type="button" data-nudge="1" aria-label="Shift this clip 100ms later">+</button>' +
      '</div>' +
      '<div class="clip__spin"></div>';

    var v = box.querySelector('video');
    v.src = c.url;
    c.v = v;
    c.box = box;
    c.meta = box.querySelector('.clip__meta');
    c.offEl = box.querySelector('.clip__nudge b');
    c.soloBtn = box.querySelector('[data-solo]');
    box.querySelector('.clip__name').textContent = file.name;
    box.querySelector('.clip__name').title = file.name;

    v.addEventListener('loadedmetadata', function () {
      c.ready = true;
      var spin = box.querySelector('.clip__spin');
      if (spin) spin.remove();
      // Land on the master frame immediately — this is what makes a clip
      // added ten seconds late line up with the ones already running.
      syncClip(c, masterTime(), true);
      if (playing) v.play().catch(function () {});
      paint();
    });
    v.addEventListener('error', function () {
      box.classList.add('is-bad');
      var spin = box.querySelector('.clip__spin');
      if (spin) spin.remove();
      c.meta.textContent = 'unsupported';
    });

    box.querySelector('[data-remove]').addEventListener('click', function () { removeClip(c); });
    box.querySelector('[data-solo]').addEventListener('click', function () {
      soloId = soloId === c.id ? null : c.id;
      applyAudio();
    });
    box.querySelectorAll('[data-nudge]').forEach(function (b) {
      b.addEventListener('click', function () {
        c.offset = Math.round((c.offset + parseInt(b.getAttribute('data-nudge'), 10) * 0.1) * 100) / 100;
        c.offEl.textContent = (c.offset >= 0 ? '+' : '') + c.offset.toFixed(2) + 's';
        syncClip(c, masterTime(), true);
      });
    });

    grid.appendChild(box);
    clips.push(c);
    applyAudio();
  }

  function removeClip(c) {
    var i = clips.indexOf(c);
    if (i > -1) clips.splice(i, 1);
    c.v.pause();
    c.v.removeAttribute('src');
    c.v.load();
    URL.revokeObjectURL(c.url);
    c.box.remove();
    if (soloId === c.id) soloId = null;
    if (!clips.length) reset();
    else { layout(); applyAudio(); }
  }

  function reset() {
    clips.slice().forEach(function (c) {
      c.v.pause(); c.v.removeAttribute('src'); c.v.load();
      URL.revokeObjectURL(c.url); c.box.remove();
    });
    clips.length = 0;
    playing = false; soloId = null;
    setMaster(0);
    hero.removeAttribute('data-playing');
    hero.setAttribute('data-state', 'empty');
    stage.hidden = true;
    grid.innerHTML = '';
    paint();
  }

  /* ── drag & drop ───────────────────────────────────────────── */
  var dragDepth = 0;
  function hasFiles(e) {
    var dt = e.dataTransfer;
    if (!dt) return false;
    if (dt.types) for (var i = 0; i < dt.types.length; i++) if (dt.types[i] === 'Files') return true;
    return false;
  }

  addEventListener('dragenter', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth++;
    hero.setAttribute('data-drag', '');
  });
  addEventListener('dragover', function (e) { if (hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
  addEventListener('dragleave', function (e) {
    if (!hasFiles(e)) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) hero.removeAttribute('data-drag');
  });
  addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    hero.removeAttribute('data-drag');
    addFiles(e.dataTransfer.files);
  });

  /* ── controls ──────────────────────────────────────────────── */
  hero.querySelectorAll('[data-browse]').forEach(function (b) {
    b.addEventListener('click', function () { fileIn.click(); });
  });
  fileIn.addEventListener('change', function () { addFiles(fileIn.files); fileIn.value = ''; });

  hero.querySelector('[data-dropcard]').addEventListener('click', function (e) {
    if (!e.target.closest('button')) fileIn.click();
  });

  playBtn.addEventListener('click', toggle);
  hero.querySelector('[data-restart]').addEventListener('click', function () { seek(0); play(); });
  hero.querySelector('[data-clear]').addEventListener('click', reset);

  loopBtn.addEventListener('click', function () {
    looping = !looping;
    loopBtn.classList.toggle('is-on', looping);
    loopBtn.setAttribute('aria-pressed', String(looping));
  });

  hero.querySelectorAll('[data-rate]').forEach(function (b) {
    b.addEventListener('click', function () { setRate(parseFloat(b.getAttribute('data-rate'))); });
  });

  hero.querySelector('[data-fullscreen]').addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (hero.requestFullscreen) hero.requestFullscreen();
  });

  scrub.addEventListener('pointerdown', function () { scrubbing = true; });
  addEventListener('pointerup', function () { scrubbing = false; });
  scrub.addEventListener('input', function () {
    var d = duration();
    scrub.style.setProperty('--p', (scrub.value / 10).toFixed(2) + '%');
    if (d > 0) seek(d * scrub.value / 1000);
  });

  /* ── keyboard ──────────────────────────────────────────────── */
  addEventListener('keydown', function (e) {
    if (!clips.length) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    switch (e.key) {
      case ' ':
        // let Space activate whatever control has focus instead
        if (t && t.tagName === 'BUTTON') return;
        e.preventDefault(); toggle(); break;
      case 'ArrowLeft':
        e.preventDefault(); seek(masterTime() - (e.shiftKey ? FRAME : 1)); break;
      case 'ArrowRight':
        e.preventDefault(); seek(masterTime() + (e.shiftKey ? FRAME : 1)); break;
      case 'r': case 'R':
        seek(0); play(); break;
      case 'f': case 'F':
        hero.querySelector('[data-fullscreen]').click(); break;
      case 'm': case 'M':
        soloId = null; applyAudio(); break;
      case 'l': case 'L':
        loopBtn.click(); break;
    }
  });

  /* pause when the tab is hidden so clips don't drift apart */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && playing) pause();
  });

  paint();
})();
