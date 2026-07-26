/* =========================================================
   株式会社日光溶材 公式サイト 共通スクリプト v6（依存ライブラリなし）
   - モバイルメニュー開閉
   - M3 注意の誘導：スクロール到達で現れる（動きの値は CSS 側 .rv）
   - M4 量の可視化：数字帯のカウントアップ（初回1回だけ）
   - L7 柱：スクロール位置に応じたセクション名の切替
   正本: design_lab/1_principles/モーション_v1.md
   ========================================================= */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* 各機能を独立させる。1つ落ちても他が巻き添えにならない */
  function safe(fn) { try { fn(); } catch (e) { /* 表示を止めない */ } }

  /* --- 最優先：reduced-motion / IO非対応なら、まず本文を解放する --- */
  if (reduce || !('IntersectionObserver' in window)) {
    safe(function () {
      var all = document.querySelectorAll('.rv, .reveal, .dw');
      Array.prototype.forEach.call(all, function (el) { el.classList.add('in'); });
    });
  }

  /* --- モバイルメニュー --- */
  var header = document.getElementById('header');
  var toggle = document.getElementById('navToggle');
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
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

  /* --- M1/M2 出現と「引く」動き（.rv / .dw → .in）。旧 .reveal も拾う --- */
  safe(function () {
    if (reduce || !('IntersectionObserver' in window)) return; /* 上で解放済み */
    var items = document.querySelectorAll('.rv, .reveal, .dw');
    if (!items.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  });

  /* --- M5 ヘッダーの状態伝達。scroll リスナは使わず番兵要素をIOで観測する --- */
  safe(function () {
    var sen = document.getElementById('top-sentinel');
    if (!sen || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { root.classList.toggle('at-top', e.isIntersecting); });
    }, { threshold: 0 }).observe(sen);
  });

  /* --- M4 数字のカウントアップ（初回1回・創業55年を体感させる） --- */
  var nums = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    /* タブが隠れている間は requestAnimationFrame が止まる。
       途中の値（例: 55年が「9年」）で固まらないよう、隠れていたら即座に最終値を出す */
    if (document.hidden) { el.textContent = String(target); return; }
    el.textContent = '0'; /* 0にするのは「実際に動かす」と決まった瞬間だけ */
    var dur = 900, t0 = null;
    function step(ts) {
      if (document.hidden) { el.textContent = String(target); return; }
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); /* ease-out：着地で減速 */
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step); else el.textContent = String(target);
    }
    requestAnimationFrame(step);
  }
  /* 復帰時の取りこぼし対策：まだ最終値になっていない数字を確定させる */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-count]'), function (el) {
        if (el.textContent !== el.getAttribute('data-count') && el.textContent !== '0') {
          el.textContent = el.getAttribute('data-count');
        }
      });
    }
  });
  /* HTML には実数を書いてある。JSは「動かす」だけで、値の責任は持たない
     ——IOが発火しなくても、JSが落ちても、数字は正しく表示される（モーション_v1 §4・§5） */
  if (nums.length && !reduce && 'IntersectionObserver' in window) {
    /* 閾値は出現(.rv = 0.08)より必ず先に発火させる。
       後にすると「実数55が見えてから0に戻る」巻き戻りになり、誤植の訂正に見える */
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); io2.unobserve(en.target); }
      });
    }, { threshold: 0 });
    Array.prototype.forEach.call(nums, function (el) { io2.observe(el); });
  }

  /* --- L7 柱（縦組みのセクション名）。暗色の全幅面の上では色を反転する --- */
  safe(function () {
    var rail = document.getElementById('rail');
    var secs = document.querySelectorAll('[data-rail]');
    if (!rail || !secs.length || !('IntersectionObserver' in window)) return;
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        rail.textContent = en.target.getAttribute('data-rail');
        rail.classList.toggle('on-dark', en.target.hasAttribute('data-rail-dark'));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    Array.prototype.forEach.call(secs, function (s) { io3.observe(s); });
  });

  /* --- M7 details の開閉アニメ。初回描画で画面外の open が走らないようガードする --- */
  safe(function () {
    var mark = function () { root.classList.add('ready'); };
    /* rAF はタブ非表示だと走らないので setTimeout でも保険をかける */
    requestAnimationFrame(function () { requestAnimationFrame(mark); });
    setTimeout(mark, 300);
  });
})();
