/* ===================================================================
   下層ページ共通の骨格（nikko-products.html / nikko-company.html）
   トップ(nikko.html)の three.js ボンベ・横スクロールは持ち込まない。
   CDN が落ちても本文が読めるよう、全機能を失敗許容で組む。
   =================================================================== */
(function () {
  'use strict';

  var loader  = document.getElementById('loader');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- 保険: ライブラリ不達でもローダーを退かせ本文を見せる --- */
  function bail() {
    if (loader) loader.style.display = 'none';
    document.querySelectorAll('.line em, .rev i').forEach(function (el) {
      el.style.transform = 'none';
    });
    document.querySelectorAll('[data-count]').forEach(function (el) {
      el.textContent = el.dataset.count;
    });
    document.documentElement.classList.add('fallback');
  }
  if (!window.gsap) { bail(); return; }

  /* --- ヘッダー接地状態: 下層は本文の上を通るので、地の色を敷いて可読性を守る --- */
  var bar = document.querySelector('.topbar');
  function stick(y) { if (bar) bar.classList.toggle('stuck', y > 320); }
  addEventListener('scroll', function () { stick(scrollY); }, { passive: true });

  /* --- 撮影モード(?shot=1): 無限アニメを止め、完成状態を静止描画する --- */
  if (/[?&]shot=1/.test(location.search)) {
    document.documentElement.classList.add('shot');
    bail();
    var y = location.search.match(/[?&]y=(\d+)/);
    if (y) {
      /* headless はスクロール後のタイルを描かないので、body を相対位置でずらす */
      document.body.style.position = 'relative';
      document.body.style.top = (-(+y[1])) + 'px';
      var to = function () { scrollTo(0, 0); };
      to();
      addEventListener('load', to);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(to);
      [400, 1200, 2500, 4000].forEach(function (ms) { setTimeout(to, ms); });
      stick(+y[1]);
    }
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  var failsafe = setTimeout(bail, 6000);

  /* ================= smooth scroll ================= */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.75 });
    lenis.stop();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ================= cursor ================= */
  var cursor = document.getElementById('cursor');
  var dot = document.getElementById('cursor-dot');
  if (cursor && dot) {
    var mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
    });
    gsap.ticker.add(function () {
      cx += (mx - cx) * 0.14; cy += (my - cy) * 0.14;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
    });
    document.querySelectorAll('[data-hover]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursor.classList.add('big');
        cursor.querySelector('.label').textContent = el.dataset.hover || '';
      });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('big'); });
    });
  }

  /* ================= loader ================= */
  var titleLines = gsap.utils.toArray('#pagehero h1 .line em');
  gsap.set(titleLines, { yPercent: 110 });
  gsap.set('.topbar', { opacity: 0, y: -12 });
  gsap.set('#pagehero .lede, #pagehero .crumb', { opacity: 0, y: 14 });

  function intro() {
    var mark = loader.querySelector('.mark');
    var count = loader.querySelector('.count');
    var n = { v: 0 };
    var tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
    tl.to(n, {
      v: 100, duration: reduced ? 0.2 : 1.1, ease: 'power2.inOut',
      onUpdate: function () { count.textContent = String(Math.round(n.v)).padStart(2, '0'); }
    })
      .to(mark, { scale: 1.18, duration: 1.1, ease: 'none' }, 0)
      .to(mark, { scale: 22, opacity: 0, duration: 0.8, ease: 'power4.in' })
      .to('#loader .count, #loader .tag', { opacity: 0, duration: 0.3 }, '<')
      .to(loader, { yPercent: -100, duration: 0.85, ease: 'power4.inOut' }, '-=0.25')
      .set(loader, { display: 'none' })
      .to(titleLines, { yPercent: 0, duration: 1.0, stagger: 0.09, ease: 'power4.out' }, '-=0.45')
      .to('.topbar', { opacity: 1, y: 0, duration: 0.8 }, '<')
      .to('#pagehero .lede, #pagehero .crumb', {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.08,
        onComplete: function () { clearTimeout(failsafe); if (lenis) lenis.start(); }
      }, '<+0.15');
    if (reduced) tl.timeScale(3);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { setTimeout(intro, 80); });
  } else { intro(); }

  /* ================= 行リビール ================= */
  gsap.utils.toArray('.rev i').forEach(function (el, i) {
    gsap.from(el, {
      yPercent: 110, duration: 1, ease: 'power4.out', delay: (i % 3) * 0.08,
      scrollTrigger: { trigger: el.closest('section') || el, start: 'top 72%' }
    });
  });
  gsap.utils.toArray('[data-rise]').forEach(function (el) {
    gsap.from(el, {
      opacity: 0, y: 30, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  /* ================= カウントアップ ================= */
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    var target = parseFloat(el.dataset.count);
    var obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: target, duration: reduced ? 0 : 1.4, ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.round(obj.v); }
        });
      }
    });
  });

  /* ================= 理念: 行リビール＋パララックス ================= */
  gsap.utils.toArray('#rinen .line em').forEach(function (el, i) {
    gsap.from(el, {
      yPercent: 110, duration: 1.1, ease: 'power4.out', delay: i * 0.12,
      scrollTrigger: { trigger: '#rinen', start: 'top 65%' }
    });
  });
  if (!reduced && document.getElementById('rinen')) {
    gsap.fromTo('#rinen .rinen-inner', { yPercent: 8 }, {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: '#rinen', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ================= マグネティックCTA ================= */
  if (!reduced) {
    document.querySelectorAll('.magnet').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        gsap.to(b, {
          x: (e.clientX - r.left - r.width / 2) * 0.3,
          y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.3
        });
      });
      b.addEventListener('mouseleave', function () {
        gsap.to(b, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
      });
    });
  }

  /* ================= ページ内アンカー ================= */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (href === '#') return e.preventDefault();
      if (!lenis) return;
      e.preventDefault();
      lenis.scrollTo(href, { duration: 1.6 });
    });
  });
})();
