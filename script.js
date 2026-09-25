(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header shadow on scroll */
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  function isOpen() { return menu.classList.contains('is-open'); }
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    document.documentElement.classList.toggle('menu-open', open);
  }
  toggle.addEventListener('click', function () { setMenu(!isOpen()); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) { setMenu(false); toggle.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 860 && isOpen()) setMenu(false); });

  /* Reveal on scroll, staggered per batch */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      var i = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = (i++ * 80) + 'ms';
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Active nav link */
  var navLinks = document.querySelectorAll('.main-nav a');
  if ('IntersectionObserver' in window) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['about', 'projects', 'services', 'contact'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) navIo.observe(el);
    });
  }

  /* Count-up stats */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var countIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target, target = +el.dataset.count, start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1600, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = '0';
        requestAnimationFrame(step);
        countIo.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIo.observe(el); });
  }

  /* Parallax on the full-bleed section */
  var exBg = document.querySelector('.excellence-bg');
  var exSection = document.querySelector('.excellence');
  if (exBg && !reduceMotion) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var r = exSection.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          var progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
          exBg.style.transform = 'translate3d(0,' + (progress * -60).toFixed(1) + 'px,0)';
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* Project row hover preview (desktop pointers only) */
  var preview = document.querySelector('.row-preview');
  var previewImg = preview && preview.querySelector('img');
  if (preview && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var px = 0, py = 0, tx = 0, ty = 0, raf = null;
    function follow() {
      px += (tx - px) * 0.18;
      py += (ty - py) * 0.18;
      preview.style.transform = 'translate(' + (px + 24) + 'px,' + (py - 100) + 'px) scale(' + (preview.classList.contains('is-visible') ? 1 : .85) + ')';
      raf = requestAnimationFrame(follow);
    }
    document.querySelectorAll('.p-row').forEach(function (row) {
      row.addEventListener('mouseenter', function (e) {
        previewImg.src = row.dataset.img;
        if (!raf) { px = tx = e.clientX; py = ty = e.clientY; raf = requestAnimationFrame(follow); }
        preview.classList.add('is-visible');
      });
      row.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; });
      row.addEventListener('mouseleave', function () {
        preview.classList.remove('is-visible');
        setTimeout(function () {
          if (!preview.classList.contains('is-visible') && raf) { cancelAnimationFrame(raf); raf = null; }
        }, 300);
      });
    });
  }

  /* Services accordion + image swap */
  var services = document.querySelectorAll('.service');
  var serviceImgs = document.querySelectorAll('.services-media img');
  var serviceLabel = document.querySelector('.services-media-label');
  function openService(li) {
    services.forEach(function (s) {
      var open = s === li;
      s.classList.toggle('is-open', open);
      s.querySelector('.service-head').setAttribute('aria-expanded', String(open));
    });
    serviceImgs.forEach(function (img) {
      img.classList.toggle('is-active', img.dataset.service === li.dataset.service);
    });
    serviceLabel.textContent = li.querySelector('.service-name').textContent;
  }
  services.forEach(function (li) {
    li.querySelector('.service-head').addEventListener('click', function () { openService(li); });
  });

  /* Testimonials */
  var slides = document.querySelectorAll('.testimonial');
  var current = 0;
  var currentEl = document.querySelector('.t-current');
  var autoplay;
  function show(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach(function (s, idx) { s.classList.toggle('is-active', idx === current); });
    currentEl.textContent = String(current + 1).padStart(2, '0');
  }
  function startAutoplay() {
    if (reduceMotion) return;
    clearInterval(autoplay);
    autoplay = setInterval(function () { show(current + 1); }, 7000);
  }
  document.querySelectorAll('.t-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { show(current + +btn.dataset.dir); startAutoplay(); });
  });
  startAutoplay();

  /* Quote form (front-end only; connect to a form service or backend to deliver enquiries) */
  var form = document.querySelector('.quote-form');
  var status = form.querySelector('.form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    ['name', 'email'].forEach(function (n) {
      var input = form.elements[n];
      var valid = input.value.trim() !== '' && (n !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
      input.closest('.field').classList.toggle('has-error', !valid);
      if (!valid) ok = false;
    });
    status.className = 'form-status';
    if (!ok) {
      status.textContent = 'Please add your name and a valid email address.';
      status.classList.add('is-error');
      return;
    }
    status.textContent = 'Thank you, ' + form.elements.name.value.trim().split(' ')[0] + '. We will be in touch within one working day.';
    status.classList.add('is-success');
    form.reset();
  });

  /* Footer year */
  var year = document.querySelector('.year');
  if (year) year.textContent = new Date().getFullYear();
})();
