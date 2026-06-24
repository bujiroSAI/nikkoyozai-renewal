/* 株式会社日光溶材 サイト 共通スクリプト（依存ライブラリなし）
   - モバイルメニュー開閉
   - スクロールで要素をふわっと表示（reveal） */
(function () {
  /* --- モバイルメニュー --- */
  var header = document.getElementById('header');
  var toggle = document.getElementById('navToggle');
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? '✕' : '☰';
    });
    var nav = document.getElementById('nav');
    if (nav) {
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) {
          header.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.textContent = '☰';
        }
      });
    }
  }

  /* --- スクロール出現アニメ --- */
  var items = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en, i) {
      if (en.isIntersecting) {
        var el = en.target;
        // 同時に入った要素を少しずつ遅らせて、奥行きを出す
        var delay = Math.min(i * 70, 280);
        el.style.transitionDelay = delay + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  items.forEach(function (el) { io.observe(el); });
})();
