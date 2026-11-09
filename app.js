/* Egor Myshenin — portfolio.
   Page text lives in content.json (RU + EN); this file holds UI labels,
   language resolution, hash routing and rendering. */
(function () {
  'use strict';

  var LANGS = ['ru', 'en'];
  var DEFAULT_LANG = 'ru';

  var UI = {
    ru: {
      resume: 'Резюме',
      portfolio: 'Портфолио',
      about: 'О себе',
      experience: 'Опыт работы',
      education: 'Образование и курсы',
      programs: 'Программы',
      skills: 'Навыки',
      languages: 'Языки',
      viewPortfolio: 'Смотреть портфолио →',
      downloadPdf: 'Скачать PDF',
      portfolioTitle: 'Портфолио',
      filterAll: 'Все',
      filterRealtime: 'Real-time',
      filterRender: 'Рендер',
      filterPrint: '3D-печать',
      filterLabel: 'Фильтр работ',
      close: 'Закрыть ✕',
      prev: '← Предыдущая',
      next: 'Следующая →',
      videoTitle: 'Видео',
      loadError: 'Не удалось загрузить content.json',
      langSwitch: 'Язык сайта',
      tags: { 'real-time': 'Real-time', render: 'Рендер · Cycles', print: 'Для 3D-печати' }
    },
    en: {
      resume: 'Resume',
      portfolio: 'Portfolio',
      about: 'About',
      experience: 'Experience',
      education: 'Education & Courses',
      programs: 'Software',
      skills: 'Skills',
      languages: 'Languages',
      viewPortfolio: 'View portfolio →',
      downloadPdf: 'Download PDF (RU)',
      portfolioTitle: 'Portfolio',
      filterAll: 'All',
      filterRealtime: 'Real-time',
      filterRender: 'Render',
      filterPrint: '3D Printing',
      filterLabel: 'Filter projects',
      close: 'Close ✕',
      prev: '← Previous',
      next: 'Next →',
      videoTitle: 'Video',
      loadError: 'Could not load content.json',
      langSwitch: 'Site language',
      tags: { 'real-time': 'Real-time', render: 'Render · Cycles', print: 'For 3D printing' }
    }
  };

  var $ = function (sel) { return document.querySelector(sel); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var img = function (id, w) { return 'https://lh3.googleusercontent.com/d/' + id + '=w' + w; };
  var alt = function (id, w) { return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w' + w; };

  var DATA = null;
  var C = null;
  var LANG = DEFAULT_LANG;
  var ROOT = '/';
  var P = [];
  var filter = 'all';
  var cur = -1;

  var grid = $('#grid');
  var viewer = $('#viewer');
  var media = $('#media');

  function ui(key) { return (UI[LANG] && UI[LANG][key]) || ''; }

  /* ---------- URL -> root + language ---------- */

  function readUrl() {
    var segs = location.pathname.split('/').filter(Boolean);
    if (/^index\.html?$/i.test(segs[segs.length - 1] || '')) segs.pop();

    var lang = null;
    var last = segs[segs.length - 1];
    if (LANGS.indexOf(last) !== -1) { lang = last; segs.pop(); }

    ROOT = '/' + (segs.length ? segs.join('/') + '/' : '');

    var q = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) { q = null; }
    if (q) {
      q = q.toLowerCase();
      if (LANGS.indexOf(q) !== -1) lang = q;
    }
    return lang;
  }

  function pickLang(urlLang) {
    // The URL is the single source of truth: bare site / ?lang omitted -> Russian,
    // /en/ and /ru/ (or ?lang=en|ru) choose explicitly.
    return urlLang || DEFAULT_LANG;
  }

  /* ---------- UI chrome ---------- */

  function applyChrome() {
    document.documentElement.lang = LANG;

    document.querySelectorAll('[data-ui]').forEach(function (el) {
      el.textContent = ui(el.dataset.ui);
    });
    document.querySelectorAll('[data-ui-aria]').forEach(function (el) {
      el.setAttribute('aria-label', ui(el.dataset.uiAria));
    });
    document.querySelectorAll('.lang').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === LANG));
    });
  }

  /* ---------- content ---------- */

  function buildProjects() {
    P = (DATA.projects || []).map(function (p) {
      var title = (p.title && (p.title[LANG] || p.title.ru || p.title.en)) || '';
      var desc = (p.description && (p.description[LANG] || p.description.ru || p.description.en)) || '';
      return {
        slug: p.slug || title,
        tag: p.tag,
        cover: p.cover,
        media: p.media || [],
        title: title,
        description: desc
      };
    });
  }

  function fill() {
    applyChrome();

    document.querySelectorAll('[data-k]').forEach(function (el) {
      el.textContent = C[el.dataset.k] || '';
    });

    ['c-email', 'f-email'].forEach(function (id) {
      var a = document.getElementById(id);
      if (!a) return;
      a.href = 'mailto:' + C.email;
      a.textContent = C.email;
    });
    ['c-art', 'f-art'].forEach(function (id) {
      var a = document.getElementById(id);
      if (!a) return;
      a.href = C.artstation;
      a.textContent = C.artstation.replace(/^https?:\/\/(www\.)?/, '');
    });

    var pdf = document.getElementById('pdf');
    if (pdf) pdf.href = ROOT + 'resume.pdf';

    document.title = C.name + ' — ' + C.role;
    var md = document.querySelector('meta[name="description"]');
    if (md && C.metaDescription) md.setAttribute('content', C.metaDescription);

    var jobs = C.jobs || [];
    document.getElementById('jobs').innerHTML = jobs.map(function (j) {
      var bullets = (j.bullets || []).map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('');
      return '<div class="job"><div class="row"><h3>' + esc(j.title) + '</h3>' +
        '<span class="date">' + esc(j.date) + '</span></div>' +
        (j.sub ? '<div class="sub">' + esc(j.sub) + '</div>' : '') +
        (bullets ? '<ul>' + bullets + '</ul>' : '') + '</div>';
    }).join('');

    document.getElementById('edu').innerHTML = (C.education || []).map(function (e) {
      return '<li><span>' + esc(e.text) + '</span><span class="date">' + esc(e.date) + '</span></li>';
    }).join('');
    document.getElementById('programs').innerHTML = (C.programs || []).map(function (x) {
      return '<li>' + esc(x) + '</li>';
    }).join('');
    document.getElementById('skills').innerHTML = (C.skills || []).map(function (x) {
      return '<li>' + esc(x) + '</li>';
    }).join('');
    document.getElementById('langs').innerHTML = (C.languages || []).map(function (l) {
      return '<li>' + esc(l.name) + ' <span>' + esc(l.level) + '</span></li>';
    }).join('');

    buildProjects();
    syncChips();
    render();
  }

  /* ---------- portfolio grid ---------- */

  function syncChips() {
    document.querySelectorAll('.chip').forEach(function (c) {
      c.setAttribute('aria-pressed', String(c.dataset.f === filter));
    });
  }

  function render() {
    grid.innerHTML = '';
    P.forEach(function (p) {
      if (filter !== 'all' && p.tag !== filter) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'card';
      b.innerHTML = '<span class="thumb" style="background-image:url(\'' + img(p.cover, 1200) +
        '\'),url(\'' + alt(p.cover, 1200) + '\')"></span>' +
        '<span class="meta"><h3>' + esc(p.title) + '</h3><p>' +
        esc((UI[LANG].tags || {})[p.tag] || p.tag) + '</p></span>';
      b.onclick = function () { location.hash = 'portfolio/' + encodeURIComponent(p.slug); };
      grid.appendChild(b);
    });
  }

  /* ---------- viewer ---------- */

  function openP(i) {
    if (!P.length) return;
    cur = ((i % P.length) + P.length) % P.length;
    var p = P[cur];
    var tag = (UI[LANG].tags || {})[p.tag] || p.tag;

    document.getElementById('vtitle').innerHTML = esc(p.title) + '<span>' + esc(tag) + '</span>';
    document.getElementById('vdesc').textContent = p.description;

    media.innerHTML = p.media.map(function (x) {
      var cut = x.indexOf(':');
      var k = cut < 0 ? 'i' : x.slice(0, cut);
      var id = cut < 0 ? x : x.slice(cut + 1);
      if (k === 'v') {
        return '<div class="video"><iframe src="https://drive.google.com/file/d/' + id +
          '/preview" allow="autoplay; fullscreen" allowfullscreen loading="lazy" title="' +
          esc(ui('videoTitle')) + '"></iframe></div>';
      }
      return '<img loading="lazy" src="' + img(id, 2000) + '" onerror="this.onerror=null;this.src=\'' +
        esc(alt(id, 2000)) + '\'" alt="' + esc(p.title) + '">';
    }).join('');

    viewer.classList.add('open');
    viewer.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  }

  function closeViewer() {
    viewer.classList.remove('open');
    document.body.style.overflow = '';
    media.innerHTML = '';
    cur = -1;
  }

  function go(i) {
    if (!P.length) return;
    var p = P[((i % P.length) + P.length) % P.length];
    location.hash = 'portfolio/' + encodeURIComponent(p.slug);
  }

  function findProject(key) {
    for (var i = 0; i < P.length; i++) {
      if (P[i].slug === key || P[i].title === key) return i;
    }
    // Old links used project titles; accept either language's title.
    var all = DATA.projects || [];
    for (var j = 0; j < all.length; j++) {
      var t = all[j].title || {};
      if (t.ru === key || t.en === key) return j;
    }
    return -1;
  }

  /* ---------- routing ---------- */

  function route() {
    var h = '';
    try { h = decodeURIComponent(location.hash.slice(1)); }
    catch (e) { h = location.hash.slice(1); }

    var isPortfolio = h.indexOf('portfolio') === 0;
    document.getElementById('resume').hidden = isPortfolio;
    document.getElementById('portfolio').hidden = !isPortfolio;

    document.querySelectorAll('.tab').forEach(function (t) { t.removeAttribute('aria-current'); });
    var tab = document.querySelector('.tab[data-tab="' + (isPortfolio ? 'portfolio' : 'resume') + '"]');
    if (tab) tab.setAttribute('aria-current', 'page');

    var key = h.indexOf('portfolio/') === 0 ? h.slice(10) : '';
    var i = key ? findProject(key) : -1;
    if (i >= 0) {
      if (i !== cur) openP(i);
    } else if (viewer.classList.contains('open')) {
      closeViewer();
    }
    if (!key) window.scrollTo(0, 0);
  }

  /* ---------- language switch ---------- */

  function switchLang(lang) {
    if (lang === LANG || LANGS.indexOf(lang) === -1 || !DATA) return;
    closeViewer();
    LANG = lang;
    C = DATA[LANG] || C;

    var url = ROOT + lang + '/' + location.hash;
    try { history.replaceState(null, '', url); } catch (e) { /* file:// */ }

    fill();
    route();
  }

  document.querySelectorAll('.lang').forEach(function (b) {
    b.addEventListener('click', function () { switchLang(b.dataset.lang); });
  });

  /* ---------- events ---------- */

  document.querySelectorAll('.chip').forEach(function (c) {
    c.addEventListener('click', function () {
      filter = c.dataset.f;
      syncChips();
      render();
    });
  });

  document.getElementById('close').addEventListener('click', function () { location.hash = 'portfolio'; });
  document.getElementById('prev').addEventListener('click', function () { go(cur - 1); });
  document.getElementById('next').addEventListener('click', function () { go(cur + 1); });

  document.addEventListener('keydown', function (e) {
    if (!viewer.classList.contains('open')) return;
    if (e.key === 'Escape') location.hash = 'portfolio';
    if (e.key === 'ArrowRight') go(cur + 1);
    if (e.key === 'ArrowLeft') go(cur - 1);
  });

  addEventListener('hashchange', route);

  /* ---------- boot ---------- */

  function boot() {
    var urlLang = readUrl();
    LANG = pickLang(urlLang);
    applyChrome();

    fetch(ROOT + 'content.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        DATA = d;
        if (!DATA[LANG]) LANG = DEFAULT_LANG;
        C = DATA[LANG];
        fill();
        route();
      })
      .catch(function () {
        var sheet = $('.sheet');
        if (sheet) sheet.innerHTML = '<p>' + esc(ui('loadError')) + '</p>';
      });
  }

  boot();
})();
