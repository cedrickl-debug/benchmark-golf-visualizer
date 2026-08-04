/* Benchmark Golf — page chrome: countdown, stars, marquee, mobile menu, FAQ */
(function () {
  'use strict';

  /* ── promo countdown ─────────────────────────────────────────── */
  var el = document.querySelector('[data-countdown]');
  if (el) {
    var parts = el.getAttribute('data-countdown').split(':').map(Number);
    var left = parts[0] * 3600 + parts[1] * 60 + parts[2];
    var pad = function (n) { return String(n).padStart(2, '0'); };
    setInterval(function () {
      left = left > 0 ? left - 1 : 0;
      el.textContent = pad(Math.floor(left / 3600)) + ':' +
                       pad(Math.floor(left / 60) % 60) + ':' + pad(left % 60);
    }, 1000);
  }

  /* ── star ratings ────────────────────────────────────────────── */
  document.querySelectorAll('.stars').forEach(function (s) {
    var v = parseFloat(s.getAttribute('data-stars') || '5');
    s.innerHTML =
      '<span class="stars__bg">★★★★★</span>' +
      '<span class="stars__fg" style="width:' + (Math.max(0, Math.min(5, v)) / 5 * 100) + '%">★★★★★</span>';
  });

  /* ── marquee: clone the track so the loop is seamless ────────── */
  var track = document.querySelector('.marquee__track');
  if (track) {
    var html = track.innerHTML;
    track.innerHTML = html + html;
    track.querySelectorAll('img').forEach(function (img, i) {
      if (i >= track.children.length / 2) img.setAttribute('aria-hidden', 'true');
    });
  }

  /* ── UGC cards: the comp draws each one as a TikTok frame ────── */
  var RAIL = [
    ['M12 20.9 4.6 13.5a4.4 4.4 0 0 1 0-6.3 4.4 4.4 0 0 1 6.2 0l1.2 1.2 1.2-1.2a4.4 4.4 0 0 1 6.2 0 4.4 4.4 0 0 1 0 6.3L12 20.9Z', '17,5K'],
    ['M12 3.5c-4.8 0-8.7 3.2-8.7 7.1 0 2.3 1.3 4.3 3.4 5.6l-.8 4.3 4.3-2.3c.6.1 1.2.2 1.8.2 4.8 0 8.7-3.2 8.7-7.1S16.8 3.5 12 3.5Z', '93'],
    ['M6.6 3.4h10.8v17.2L12 16.3l-5.4 4.3V3.4Z', '2459'],
    ['M13.4 5.1v3.4C7.8 8.9 4.7 12.4 3.9 18.9c1.9-3.5 4.9-5.1 9.5-5.1v3.4L20.7 11l-7.3-5.9Z', '30.9K']
  ];

  document.querySelectorAll('.ugc__card').forEach(function (card) {
    var rail = RAIL.map(function (r) {
      return '<span class="tt__act"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="' +
             r[0] + '"/></svg><i>' + r[1] + '</i></span>';
    }).join('');

    card.insertAdjacentHTML('beforeend',
      '<div class="tt" aria-hidden="true">' +
        '<div class="tt__status"><span>12:22 <b>➤</b></span>' +
          '<span class="tt__sys">' +
            '<svg viewBox="0 0 24 16"><path fill="currentColor" d="M2 11h2.4v4H2zM6.4 8.4h2.4V15H6.4zM10.8 5.6h2.4V15h-2.4zM15.2 2.6h2.4V15h-2.4z"/></svg>' +
            '<svg viewBox="0 0 24 18"><path fill="currentColor" d="M12 15.4 9.1 12.2a4.3 4.3 0 0 1 5.8 0L12 15.4Zm0-6.6a7.6 7.6 0 0 0-5.4 2.2L4.5 8.8a10.6 10.6 0 0 1 15 0l-2.1 2.2A7.6 7.6 0 0 0 12 8.8Z"/></svg>' +
            '<svg viewBox="0 0 26 14"><rect x="1" y="2" width="20" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="3" y="4" width="13" height="6" rx="1.6" fill="currentColor"/><path fill="currentColor" d="M22.6 5.2h.8a1.8 1.8 0 0 1 0 3.6h-.8z"/></svg>' +
          '</span>' +
        '</div>' +
        '<div class="tt__tabs"><span>Following</span><i></i><b>For You</b></div>' +
        '<div class="tt__rail">' +
          '<span class="tt__avatar"><em>+</em></span>' + rail +
          '<span class="tt__disc"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 18.2a2.6 2.6 0 1 1-1.4-2.3V7.4l9-2v8.1a2.6 2.6 0 1 1-1.4-2.3V7.2L9 8.6v9.6Z"/></svg></span>' +
        '</div>' +
        '<div class="tt__foot">' +
          '<b>@Golf At Home</b>' +
          '<p>The first Affordable Golf Simulator. Set it up where ever you want, a… <span>see more</span></p>' +
          '<span class="tt__sound"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 18.2a2.6 2.6 0 1 1-1.4-2.3V7.4l9-2v8.1a2.6 2.6 0 1 1-1.4-2.3V7.2L9 8.6v9.6Z"/></svg>Original sound</span>' +
        '</div>' +
      '</div>');
  });

  /* ── mobile menu ─────────────────────────────────────────────── */
  var burger = document.querySelector('[data-menu-toggle]');
  if (burger) {
    var panel = document.createElement('div');
    panel.className = 'menu';
    panel.hidden = true;
    document.querySelectorAll('.nav .nav__link').forEach(function (a) {
      var c = a.cloneNode(true);
      c.className = 'menu__link';
      panel.appendChild(c);
    });
    document.querySelector('.hdr').insertBefore(panel, document.querySelector('.promo'));

    var setOpen = function (open) {
      panel.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
      burger.classList.toggle('is-open', open);
    };
    burger.addEventListener('click', function () { setOpen(panel.hidden); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  /* ── FAQ: one panel open at a time ───────────────────────────── */
  var items = document.querySelectorAll('.faq details');
  items.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      items.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
})();
