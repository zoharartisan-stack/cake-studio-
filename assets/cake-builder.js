/* ==========================================================================
   Cake Craft — cake-builder.js
   Step wizard, live SVG preview, instant pricing, validation, checkout
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var STORAGE_KEY = 'cakecraft_order';
  var CUR = 'Rs ';

  function money(n) { return CUR + Math.round(n).toLocaleString('en-US'); }

  /* Template themes match snippets/cake-template.liquid */
  var THEMES = {
    1: { frost: '#f7d3e0', accent: '#a22a4e' },
    2: { frost: '#e9d5ff', accent: '#7c3aed' },
    3: { frost: '#bae6fd', accent: '#0284c7' },
    4: { frost: '#fde68a', accent: '#d97706' },
    5: { frost: '#f7d3e0', accent: '#a22a4e' },
    6: { frost: '#bbf7d0', accent: '#16a34a' },
    7: { frost: '#e7e5e4', accent: '#57534e' },
    8: { frost: '#fecdd3', accent: '#e11d48' }
  };

  /* ----------------------------------------------------------------------
     LIVE PREVIEW — build an SVG cake from state
  ---------------------------------------------------------------------- */
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  function frostingCap(topY, cx, rx) {
    // wavy frosting drips band
    var left = cx - rx, right = cx + rx;
    var d = 'M' + left + ' ' + topY + ' q0 26 12 30 q6 -16 13 -3 q7 -17 15 -2 q8 -16 16 0 q8 -16 16 0 q8 -16 16 -2 q7 -15 13 0 q6 -14 12 -24';
    return d;
  }

  function renderCake(state) {
    var theme = state.template ? (THEMES[state.template] || THEMES[1]) : { frost: '#f7d3e0', accent: '#a22a4e' };
    var frost = state.frosting || theme.frost;
    var accent = theme.accent;
    var sponge = state.sponge || '#c98a54';
    var msg = state.cakeMessage || '';
    var msgColor = state.messageColor || '#a22a4e';
    var msgFont = state.messageFont || "'Dancing Script', cursive";
    var extras = state.extras || [];
    var has = function (n) { return extras.some(function (e) { return e.name === n; }); };
    var shape = (state.shapeKey || 'round');

    // If user uploaded a design, show it framed on a plate
    if (state.designMode === 'upload' && state.uploadImage) {
      return '' +
        '<svg viewBox="0 0 220 240" xmlns="http://www.w3.org/2000/svg" aria-label="Your uploaded design">' +
        '<ellipse cx="110" cy="214" rx="88" ry="15" fill="#fff"/>' +
        '<ellipse cx="110" cy="222" rx="70" ry="8" fill="rgba(60,20,30,.12)"/>' +
        '<clipPath id="lc-clip"><rect x="34" y="34" width="152" height="160" rx="18"/></clipPath>' +
        '<image href="' + esc(state.uploadImage) + '" x="34" y="34" width="152" height="160" preserveAspectRatio="xMidYMid slice" clip-path="url(#lc-clip)"/>' +
        '<rect x="34" y="34" width="152" height="160" rx="18" fill="none" stroke="' + accent + '" stroke-width="3"/>' +
        (msg ? '<text x="110" y="214" text-anchor="middle" font-size="16" fill="' + msgColor + '" style="font-family:' + msgFont + '">' + esc(msg) + '</text>' : '') +
        '</svg>';
    }

    var body = '', cap = '', topEllipse = '', cx = 110, msgY = 168, decoBaseY = 118;

    if (shape === 'heart') {
      body = '<path d="M110 206 C50 165 40 108 78 90 C100 79 110 100 110 110 C110 100 120 79 142 90 C180 108 170 165 110 206 Z" fill="' + sponge + '"/>' +
             '<path d="M110 150 C74 124 66 100 84 92 C97 86 110 100 110 108 C110 100 123 86 136 92 C154 100 146 124 110 150 Z" fill="' + frost + '"/>';
      msgY = 150; decoBaseY = 96;
    } else if (shape === 'square') {
      body = '<rect x="52" y="120" width="116" height="78" rx="14" fill="' + sponge + '"/>';
      cap = '<path d="' + frostingCap(120, cx, 58) + ' L168 120 Z" fill="' + frost + '"/>';
      topEllipse = '<rect x="52" y="108" width="116" height="26" rx="12" fill="' + frost + '"/>';
      msgY = 170; decoBaseY = 112;
    } else if (shape === 'rectangle') {
      body = '<rect x="34" y="126" width="152" height="64" rx="12" fill="' + sponge + '"/>';
      cap = '<path d="' + frostingCap(126, cx, 76) + ' L186 126 Z" fill="' + frost + '"/>';
      topEllipse = '<rect x="34" y="116" width="152" height="22" rx="10" fill="' + frost + '"/>';
      msgY = 170; decoBaseY = 118;
    } else { // round
      body = '<path d="M42 122 h136 v56 a68 22 0 0 1 -136 0 z" fill="' + sponge + '"/>';
      cap = '<path d="' + frostingCap(122, cx, 68) + ' L178 122 Z" fill="' + frost + '"/>';
      topEllipse = '<ellipse cx="110" cy="122" rx="68" ry="20" fill="' + frost + '"/>';
      msgY = 172; decoBaseY = 116;
    }

    // sprinkles
    var sprinkles = '';
    if (has('Sprinkles')) {
      var pts = [[80, 150, 20], [140, 156, -30], [110, 162, 60], [95, 148, -10], [125, 150, 40]];
      sprinkles = '<g>' + pts.map(function (p) {
        return '<rect x="' + p[0] + '" y="' + p[1] + '" width="9" height="3.4" rx="1.7" fill="' + accent + '" transform="rotate(' + p[2] + ' ' + p[0] + ' ' + p[1] + ')"/>';
      }).join('') + '</g>';
    }

    // ribbon band
    var ribbon = '';
    if (has('Ribbon Decoration') && shape !== 'heart') {
      ribbon = '<rect x="42" y="' + (decoBaseY + 40) + '" width="136" height="10" fill="' + accent + '" opacity=".85"/>';
    }

    // top decorations stack
    var deco = '';
    var topY = decoBaseY;
    if (has('Candles')) {
      deco += '<g>' +
        [90, 110, 130].map(function (x, i) {
          return '<rect x="' + (x - 2) + '" y="' + (topY - 34) + '" width="4" height="26" rx="2" fill="' + ['#f472b6', '#60a5fa', '#fbbf24'][i] + '"/>' +
                 '<ellipse cx="' + x + '" cy="' + (topY - 38) + '" rx="3" ry="5" fill="#ffb703"/>';
        }).join('') + '</g>';
    } else if (has('Fresh Flowers')) {
      deco += '<g transform="translate(110,' + (topY - 16) + ')">' +
        [0, 72, 144, 216, 288].map(function (a) {
          return '<circle cx="' + (10 * Math.cos(a * Math.PI / 180)) + '" cy="' + (10 * Math.sin(a * Math.PI / 180)) + '" r="6" fill="#f9a8d4"/>';
        }).join('') + '<circle cx="0" cy="0" r="6" fill="#fbbf24"/></g>';
    } else if (has('Cake Topper')) {
      deco += '<g transform="translate(110,' + (topY - 30) + ')"><rect x="-2" y="0" width="4" height="24" fill="' + accent + '"/>' +
        '<path d="M0 -12 L3.5 -3 L13 -3 L5 3 L8 12 L0 6 L-8 12 L-5 3 L-13 -3 L-3.5 -3 Z" fill="#fbbf24"/></g>';
    } else {
      // default cherries
      deco += '<g><path d="M110 ' + (topY - 4) + ' q-5 -16 -13 -22" stroke="#7c8b3a" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M110 ' + (topY - 4) + ' q5 -16 15 -20" stroke="#7c8b3a" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<circle cx="97" cy="' + (topY - 28) + '" r="9" fill="' + accent + '"/>' +
        '<circle cx="125" cy="' + (topY - 26) + '" r="9" fill="' + accent + '"/></g>';
    }

    var msgText = msg ? '<text x="110" y="' + msgY + '" text-anchor="middle" font-size="15" fill="' + msgColor + '" style="font-family:' + msgFont + '">' + esc(msg) + '</text>' : '';

    return '' +
      '<svg viewBox="0 0 220 240" xmlns="http://www.w3.org/2000/svg" aria-label="Live cake preview">' +
      '<ellipse cx="110" cy="216" rx="90" ry="16" fill="#ffffff"/>' +
      '<ellipse cx="110" cy="224" rx="72" ry="8" fill="rgba(60,20,30,.12)"/>' +
      body + cap + topEllipse + ribbon + sprinkles + msgText + deco +
      '</svg>';
  }

  /* ----------------------------------------------------------------------
     BUILDER
  ---------------------------------------------------------------------- */
  function initBuilder(root) {
    var form = $('[data-builder-form]', root);
    var steps = $$('.step', root);
    var totalSteps = steps.length;
    var current = 1;

    var els = {
      fill: $('[data-progress-fill]', root),
      progressSteps: $$('[data-goto-step]', root),
      prev: $('[data-prev]', root),
      next: $('[data-next]', root),
      cont: $('[data-continue-checkout]', root),
      livecake: $('[data-livecake]', root),
      priceTotal: $('[data-price-total]', root),
      loader: $('[data-loader]', root)
    };

    var state = {
      occasion: '', occasionCustom: '',
      size: '', sizeCustom: '', sizeScale: 1, sizePrice: 0,
      shape: '', shapeKey: 'round', shapeCustom: '', shapePrice: 0,
      flavor: '', flavorCustom: '', sponge: '', flavorPrice: 0,
      designMode: 'template', template: null, templateName: '', frosting: '', uploadImage: '',
      designNotes: '', specialInstructions: '',
      cakeMessage: '', messageFont: "'Dancing Script', cursive", messageFontLabel: 'Dancing Script', messageColor: '#a22a4e',
      extras: [],
      deliveryDate: '', deliveryTime: '', deliveryNotes: ''
    };

    /* ---------- Pricing ---------- */
    function computePrice() {
      var items = [];
      var base = state.sizePrice || 0;
      if (base) items.push({ label: 'Base (' + (state.size || 'size') + ')', amount: base });
      if (state.shapePrice) items.push({ label: 'Shape (' + state.shape + ')', amount: state.shapePrice });
      if (state.flavorPrice) items.push({ label: 'Flavor (' + state.flavor + ')', amount: state.flavorPrice });
      if (state.designMode === 'upload' && state.uploadImage) items.push({ label: 'Custom design work', amount: 800 });
      if (state.cakeMessage && state.cakeMessage.trim()) items.push({ label: 'Custom message', amount: 200 });
      (state.extras || []).forEach(function (ex) { items.push({ label: ex.name, amount: ex.price }); });
      var total = items.reduce(function (s, i) { return s + i.amount; }, 0);
      return { items: items, total: total };
    }

    function flash(el) {
      if (!el) return;
      el.classList.remove('price-flash');
      void el.offsetWidth;
      el.classList.add('price-flash');
    }

    var lastTotal = -1;
    function updatePrice() {
      var p = computePrice();
      if (els.priceTotal) {
        els.priceTotal.textContent = money(p.total);
        if (p.total !== lastTotal) flash(els.priceTotal);
      }
      lastTotal = p.total;
      return p;
    }

    /* ---------- Preview ---------- */
    function renderPreview() {
      if (els.livecake) {
        els.livecake.innerHTML = renderCake(state);
        els.livecake.style.setProperty('--lc-scale', state.sizeScale || 1);
      }
      // side summary
      setPv('occasion', state.occasion === 'Other' ? (state.occasionCustom || 'Other') : state.occasion);
      setPv('size', state.size === 'Custom' ? (state.sizeCustom || 'Custom') : state.size);
      setPv('shape', state.shape === 'Custom' ? (state.shapeCustom || 'Custom') : state.shape);
      setPv('flavor', state.flavor === 'Custom' ? (state.flavorCustom || 'Custom') : state.flavor);
      var exNames = (state.extras || []).map(function (e) { return e.name; });
      setPv('extras', exNames.length ? exNames.join(', ') : 'None');
    }
    function setPv(key, val) {
      var el = $('[data-pv="' + key + '"]', root);
      if (el) el.textContent = val || '—';
    }

    /* ---------- Validation ---------- */
    function stepValid(n) {
      switch (n) {
        case 1: return !!state.occasion && (state.occasion !== 'Other' || !!state.occasionCustom.trim());
        case 2: return !!state.size && (state.size !== 'Custom' || !!state.sizeCustom.trim());
        case 3: return !!state.shape && (state.shape !== 'Custom' || !!state.shapeCustom.trim());
        case 4: return !!state.flavor && (state.flavor !== 'Custom' || !!state.flavorCustom.trim());
        case 5: return (state.designMode === 'template' && !!state.template) || (state.designMode === 'upload' && !!state.uploadImage);
        case 6: return true;
        case 7: return !!state.deliveryDate;
        case 8: return true;
        default: return true;
      }
    }

    function refreshNav() {
      if (els.prev) els.prev.disabled = current === 1;
      var isLast = current === totalSteps;
      if (els.next) els.next.classList.toggle('hidden', isLast);
      if (els.cont) els.cont.classList.toggle('hidden', !isLast);
      if (els.next) els.next.disabled = !stepValid(current);
    }

    /* ---------- Step navigation ---------- */
    function goTo(n, opts) {
      n = Math.max(1, Math.min(totalSteps, n));
      // guard: can't skip forward past an invalid step
      if (!opts || !opts.force) {
        if (n > current) {
          for (var i = current; i < n; i++) { if (!stepValid(i)) { n = i; break; } }
        }
      }
      current = n;
      steps.forEach(function (s) { s.classList.toggle('is-active', +s.getAttribute('data-step') === current); });
      els.progressSteps.forEach(function (b) {
        var idx = +b.getAttribute('data-goto-step');
        b.classList.toggle('is-active', idx === current);
        b.classList.toggle('is-done', idx < current);
      });
      if (els.fill) els.fill.style.width = (current / totalSteps * 100) + '%';
      if (current === totalSteps) buildReview();
      refreshNav();
      save();
      // scroll builder into view on step change
      if (opts && opts.scroll) {
        var top = root.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }

    /* ---------- Review ---------- */
    function buildReview() {
      var sum = $('[data-review-summary]', root);
      var brk = $('[data-review-breakdown]', root);
      var tot = $('[data-review-total]', root);
      var p = computePrice();
      var rows = [
        ['Occasion', state.occasion === 'Other' ? state.occasionCustom : state.occasion],
        ['Cake Size', state.size === 'Custom' ? state.sizeCustom : state.size],
        ['Cake Shape', state.shape === 'Custom' ? state.shapeCustom : state.shape],
        ['Flavor', state.flavor === 'Custom' ? state.flavorCustom : state.flavor],
        ['Design', state.designMode === 'upload' ? 'Uploaded image' : (state.templateName || '—')],
        ['Cake Message', state.cakeMessage || '—'],
        ['Extras', (state.extras || []).map(function (e) { return e.name; }).join(', ') || 'None'],
        ['Delivery Date', state.deliveryDate || '—'],
        ['Delivery Time', state.deliveryTime || 'Any time']
      ];
      if (sum) sum.innerHTML = rows.map(function (r) {
        return '<div class="summary-row"><dt>' + r[0] + '</dt><dd>' + esc(r[1] || '—') + '</dd></div>';
      }).join('');
      if (brk) brk.innerHTML = p.items.map(function (i) {
        return '<div class="summary-row"><dt>' + esc(i.label) + '</dt><dd>' + money(i.amount) + '</dd></div>';
      }).join('') || '<div class="summary-row"><dt>Make selections to see pricing</dt><dd></dd></div>';
      if (tot) tot.textContent = money(p.total);
    }

    /* ---------- Persistence ---------- */
    function orderPayload() {
      var p = computePrice();
      return {
        step: current,
        occasion: state.occasion === 'Other' ? state.occasionCustom : state.occasion,
        occasionRaw: state.occasion, occasionCustom: state.occasionCustom,
        size: state.size === 'Custom' ? state.sizeCustom : state.size,
        sizeRaw: state.size, sizeCustom: state.sizeCustom, sizeScale: state.sizeScale, sizePrice: state.sizePrice,
        shape: state.shape === 'Custom' ? state.shapeCustom : state.shape,
        shapeRaw: state.shape, shapeKey: state.shapeKey, shapeCustom: state.shapeCustom, shapePrice: state.shapePrice,
        flavor: state.flavor === 'Custom' ? state.flavorCustom : state.flavor,
        flavorRaw: state.flavor, flavorCustom: state.flavorCustom, sponge: state.sponge, flavorPrice: state.flavorPrice,
        designMode: state.designMode, template: state.template, templateName: state.templateName,
        frosting: state.frosting, uploadImage: state.uploadImage,
        designNotes: state.designNotes, specialInstructions: state.specialInstructions,
        cakeMessage: state.cakeMessage, messageFont: state.messageFont, messageFontLabel: state.messageFontLabel, messageColor: state.messageColor,
        extras: state.extras,
        deliveryDate: state.deliveryDate, deliveryTime: state.deliveryTime, deliveryNotes: state.deliveryNotes,
        breakdown: p.items, total: p.total, totalFormatted: money(p.total)
      };
    }
    function save() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orderPayload())); } catch (e) { /* quota */ }
    }
    function restore() {
      var raw;
      try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return; }
      if (!raw) return;
      var o;
      try { o = JSON.parse(raw); } catch (e) { return; }
      applySaved(o);
    }

    function selectOption(group, value) {
      var wrap = $('[data-single-select="' + group + '"]', root);
      if (!wrap) return null;
      var opts = $$('[data-value]', wrap);
      var chosen = null;
      opts.forEach(function (o) {
        var match = o.getAttribute('data-value') === value;
        o.classList.toggle('is-selected', match);
        if (match) chosen = o;
      });
      return chosen;
    }

    function applySaved(o) {
      if (o.occasionRaw) { var c = selectOption('occasion', o.occasionRaw); if (c) applyOccasion(c); }
      state.occasionCustom = o.occasionCustom || '';
      var oc = $('[data-custom-input="occasion"]', root); if (oc) oc.value = state.occasionCustom;
      toggleCustom('occasion', state.occasion === 'Other');

      if (o.sizeRaw) { var s = selectOption('size', o.sizeRaw); if (s) applySize(s); }
      state.sizeCustom = o.sizeCustom || '';
      var sc = $('[data-custom-input="size"]', root); if (sc) sc.value = state.sizeCustom;
      toggleCustom('size', state.size === 'Custom');

      if (o.shapeRaw) { var sh = selectOption('shape', o.shapeRaw); if (sh) applyShape(sh); }
      state.shapeCustom = o.shapeCustom || '';
      var shc = $('[data-custom-input="shape"]', root); if (shc) shc.value = state.shapeCustom;
      toggleCustom('shape', state.shape === 'Custom');

      if (o.flavorRaw) { var fl = selectOption('flavor', o.flavorRaw); if (fl) applyFlavor(fl); }
      state.flavorCustom = o.flavorCustom || '';
      var flc = $('[data-custom-input="flavor"]', root); if (flc) flc.value = state.flavorCustom;
      toggleCustom('flavor', state.flavor === 'Custom');

      // design
      if (o.designMode) setDesignMode(o.designMode);
      if (o.template) { var t = $('[data-template="' + o.template + '"]', root); if (t) selectTemplate(t); }
      if (o.uploadImage) { state.uploadImage = o.uploadImage; showUploadPreview(o.uploadImage); }
      setField('designNotes', o.designNotes); setField('specialInstructions', o.specialInstructions);

      setField('cakeMessage', o.cakeMessage);
      if (o.messageFontLabel) { var mf = selectOption('messageFont', o.messageFontLabel); if (mf) applyFont(mf); }
      if (o.messageColor) { var mc = selectOption('messageColor', o.messageColor); if (mc) { state.messageColor = o.messageColor; } }

      (o.extras || []).forEach(function (ex) {
        var btn = $$('[data-multi-select="extras"] [data-value]', root).filter(function (b) { return b.getAttribute('data-value') === ex.name; })[0];
        if (btn) { btn.classList.add('is-selected'); }
      });
      state.extras = o.extras || [];

      setField('deliveryDate', o.deliveryDate); setField('deliveryTime', o.deliveryTime); setField('deliveryNotes', o.deliveryNotes);

      renderPreview(); updatePrice();
    }

    function setField(name, val) {
      if (val == null) return;
      var el = $('[data-field="' + name + '"]', root);
      if (el) { el.value = val; state[name] = val; }
    }

    /* ---------- Appliers ---------- */
    function applyOccasion(btn) {
      state.occasion = btn.getAttribute('data-value');
      toggleCustom('occasion', state.occasion === 'Other');
    }
    function applySize(btn) {
      state.size = btn.getAttribute('data-value');
      state.sizePrice = +btn.getAttribute('data-price') || 0;
      state.sizeScale = parseFloat(btn.getAttribute('data-scale')) || 1;
      toggleCustom('size', !!btn.getAttribute('data-custom-trigger'));
    }
    function applyShape(btn) {
      state.shape = btn.getAttribute('data-value');
      state.shapeKey = btn.getAttribute('data-shape') || 'round';
      state.shapePrice = +btn.getAttribute('data-price') || 0;
      toggleCustom('shape', !!btn.getAttribute('data-custom-trigger'));
    }
    function applyFlavor(btn) {
      state.flavor = btn.getAttribute('data-value');
      state.sponge = btn.getAttribute('data-sponge') || '#c98a54';
      state.flavorPrice = +btn.getAttribute('data-price') || 0;
      toggleCustom('flavor', !!btn.getAttribute('data-custom-trigger'));
    }
    function applyFont(btn) {
      state.messageFont = btn.getAttribute('data-font');
      state.messageFontLabel = btn.getAttribute('data-value');
    }

    function toggleCustom(group, show) {
      var f = $('[data-custom-field="' + group + '"]', root);
      if (f) f.hidden = !show;
    }

    /* ---------- Design mode / templates / upload ---------- */
    function setDesignMode(mode) {
      state.designMode = mode;
      $$('[data-design-mode]', root).forEach(function (t) { t.classList.toggle('is-active', t.getAttribute('data-design-mode') === mode); });
      $$('[data-design-pane]', root).forEach(function (p) { p.hidden = p.getAttribute('data-design-pane') !== mode; });
    }
    function selectTemplate(btn) {
      $$('[data-template]', root).forEach(function (t) { t.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
      state.template = +btn.getAttribute('data-template');
      state.templateName = btn.getAttribute('data-name') || '';
      state.frosting = (THEMES[state.template] || {}).frost || '';
    }
    function showUploadPreview(src) {
      var pv = $('[data-upload-preview]', root);
      if (pv) { pv.hidden = false; pv.innerHTML = '<img src="' + src + '" alt="Your uploaded design">'; }
    }

    /* ---------- Wire up events ---------- */
    // single selects
    $$('[data-single-select]', root).forEach(function (wrap) {
      var group = wrap.getAttribute('data-single-select');
      $$('[data-value]', wrap).forEach(function (opt) {
        opt.addEventListener('click', function () {
          $$('[data-value]', wrap).forEach(function (o) { o.classList.remove('is-selected'); });
          opt.classList.add('is-selected');
          if (group === 'occasion') applyOccasion(opt);
          else if (group === 'size') applySize(opt);
          else if (group === 'shape') applyShape(opt);
          else if (group === 'flavor') applyFlavor(opt);
          else if (group === 'messageFont') applyFont(opt);
          else if (group === 'messageColor') state.messageColor = opt.getAttribute('data-value');
          renderPreview(); updatePrice(); refreshNav(); save();
        });
      });
    });

    // custom inputs
    $$('[data-custom-input]', root).forEach(function (inp) {
      var group = inp.getAttribute('data-custom-input');
      inp.addEventListener('input', function () {
        state[group + 'Custom'] = inp.value;
        renderPreview(); refreshNav(); save();
      });
    });

    // multi-select extras
    var extrasWrap = $('[data-multi-select="extras"]', root);
    if (extrasWrap) {
      $$('[data-value]', extrasWrap).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var name = btn.getAttribute('data-value');
          var price = +btn.getAttribute('data-price') || 0;
          var on = btn.classList.toggle('is-selected');
          if (on) state.extras.push({ name: name, price: price });
          else state.extras = state.extras.filter(function (e) { return e.name !== name; });
          renderPreview(); updatePrice(); save();
        });
      });
    }

    // plain text fields
    $$('[data-field]', root).forEach(function (el) {
      el.addEventListener('input', function () {
        state[el.getAttribute('data-field')] = el.value;
        renderPreview(); updatePrice(); refreshNav(); save();
      });
    });

    // design tabs
    $$('[data-design-mode]', root).forEach(function (t) {
      t.addEventListener('click', function () { setDesignMode(t.getAttribute('data-design-mode')); renderPreview(); updatePrice(); refreshNav(); save(); });
    });
    // templates
    $$('[data-template]', root).forEach(function (t) {
      t.addEventListener('click', function () { selectTemplate(t); renderPreview(); updatePrice(); refreshNav(); save(); });
    });

    // upload
    var uploadInput = $('[data-upload-input]', root);
    var uploadZone = $('[data-upload-zone]', root);
    function handleFile(file) {
      if (!file || !/^image\//.test(file.type)) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        // downscale to keep localStorage happy
        var img = new Image();
        img.onload = function () {
          var max = 640, w = img.width, h = img.height;
          if (w > max || h > max) { var r = Math.min(max / w, max / h); w = w * r; h = h * r; }
          var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(img, 0, 0, w, h);
          var data;
          try { data = cv.toDataURL('image/jpeg', 0.85); } catch (err) { data = e.target.result; }
          state.uploadImage = data;
          showUploadPreview(data);
          renderPreview(); updatePrice(); refreshNav(); save();
        };
        img.onerror = function () { state.uploadImage = e.target.result; showUploadPreview(e.target.result); renderPreview(); updatePrice(); refreshNav(); save(); };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
    if (uploadInput) uploadInput.addEventListener('change', function () { handleFile(uploadInput.files[0]); });
    if (uploadZone) {
      ['dragover', 'dragenter'].forEach(function (ev) { uploadZone.addEventListener(ev, function (e) { e.preventDefault(); uploadZone.classList.add('is-dragover'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { uploadZone.addEventListener(ev, function (e) { e.preventDefault(); uploadZone.classList.remove('is-dragover'); }); });
      uploadZone.addEventListener('drop', function (e) { if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
    }

    // nav buttons
    if (els.prev) els.prev.addEventListener('click', function () { goTo(current - 1, { scroll: true }); });
    if (els.next) els.next.addEventListener('click', function () { if (stepValid(current)) goTo(current + 1, { scroll: true }); });
    els.progressSteps.forEach(function (b) {
      b.addEventListener('click', function () { goTo(+b.getAttribute('data-goto-step'), { scroll: true }); });
    });

    // continue to checkout
    if (els.cont) {
      els.cont.addEventListener('click', function () {
        save();
        if (els.loader) els.loader.classList.add('is-active');
        var url = els.cont.getAttribute('data-checkout-url');
        setTimeout(function () {
          var inPage = $('[data-checkout]');
          if (inPage) {
            if (els.loader) els.loader.classList.remove('is-active');
            root.style.display = 'none';
            inPage.hidden = false;
            inPage.removeAttribute('data-checkout-hidden');
            if (window.CakeCraft && window.CakeCraft.populateCheckout) window.CakeCraft.populateCheckout();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (url) {
            window.location.href = url;
          } else {
            if (els.loader) els.loader.classList.remove('is-active');
          }
        }, 700);
      });
    }

    // expose renderCake for checkout preview
    window.CakeCraft = window.CakeCraft || {};
    window.CakeCraft.renderCake = renderCake;
    window.CakeCraft.builderRoot = root;
    window.CakeCraft.showBuilder = function () {
      root.style.display = '';
      window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    };

    /* ---------- Init ---------- */
    // initialise message defaults from preselected pills
    var preFont = $('[data-single-select="messageFont"] .is-selected', root);
    if (preFont) applyFont(preFont);
    var preColor = $('[data-single-select="messageColor"] .is-selected', root);
    if (preColor) state.messageColor = preColor.getAttribute('data-value');

    restore();

    // deep-link ?template=N → jump into builder with that template
    var params = new URLSearchParams(window.location.search);
    var tParam = params.get('template');
    if (tParam) {
      var tBtn = $('[data-template="' + tParam + '"]', root);
      if (tBtn) { setDesignMode('template'); selectTemplate(tBtn); }
    }

    renderPreview();
    updatePrice();
    goTo(current, { force: true });
  }

  /* ----------------------------------------------------------------------
     CHECKOUT (in-page or dedicated page)
  ---------------------------------------------------------------------- */
  function initCheckout(root) {
    function loadOrder() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
    }
    function populate() {
      var o = loadOrder();
      var sumEl = $('[data-checkout-summary]', root);
      var totEl = $('[data-checkout-total]', root);
      var live = $('[data-livecake]', root);
      var details = $('[data-order-details]', root);
      var totalInput = $('[data-order-total-input]', root);
      if (!o) {
        if (details && !details.value) details.value = 'Custom cake inquiry — customer will share details.';
        return;
      }

      if (live && window.CakeCraft && window.CakeCraft.renderCake) {
        live.innerHTML = window.CakeCraft.renderCake({
          shapeKey: o.shapeKey, sponge: o.sponge, frosting: o.frosting, template: o.template,
          designMode: o.designMode, uploadImage: o.uploadImage,
          cakeMessage: o.cakeMessage, messageColor: o.messageColor, messageFont: o.messageFont, extras: o.extras
        });
        live.style.setProperty('--lc-scale', o.sizeScale || 1);
      }
      if (sumEl) {
        var rows = [
          ['Occasion', o.occasion], ['Size', o.size], ['Shape', o.shape], ['Flavor', o.flavor],
          ['Design', o.designMode === 'upload' ? 'Uploaded image' : (o.templateName || '—')],
          ['Message', o.cakeMessage || '—'],
          ['Extras', (o.extras || []).map(function (e) { return e.name; }).join(', ') || 'None'],
          ['Delivery', (o.deliveryDate || '—') + (o.deliveryTime ? ' at ' + o.deliveryTime : '')]
        ];
        sumEl.innerHTML = rows.map(function (r) {
          return '<div class="preview-line"><dt>' + r[0] + '</dt><dd>' + (String(r[1] || '—').replace(/</g, '&lt;')) + '</dd></div>';
        }).join('');
      }
      if (totEl) totEl.textContent = o.totalFormatted || (CUR + (o.total || 0));
      if (totalInput) totalInput.value = o.totalFormatted || String(o.total || 0);
      if (details) {
        var lines = [];
        lines.push('CUSTOM CAKE ORDER');
        lines.push('Occasion: ' + (o.occasion || '-'));
        lines.push('Size: ' + (o.size || '-'));
        lines.push('Shape: ' + (o.shape || '-'));
        lines.push('Flavor: ' + (o.flavor || '-'));
        lines.push('Design: ' + (o.designMode === 'upload' ? 'Customer uploaded image' : (o.templateName || '-')));
        if (o.designNotes) lines.push('Design notes: ' + o.designNotes);
        if (o.specialInstructions) lines.push('Special instructions: ' + o.specialInstructions);
        lines.push('Message: ' + (o.cakeMessage || '-') + (o.cakeMessage ? ' (font: ' + o.messageFontLabel + ', color: ' + o.messageColor + ')' : ''));
        lines.push('Extras: ' + ((o.extras || []).map(function (e) { return e.name + ' (' + CUR + e.price + ')'; }).join(', ') || 'None'));
        lines.push('Delivery date: ' + (o.deliveryDate || '-'));
        lines.push('Delivery time: ' + (o.deliveryTime || 'Any'));
        if (o.deliveryNotes) lines.push('Delivery notes: ' + o.deliveryNotes);
        lines.push('');
        lines.push('PRICE BREAKDOWN:');
        (o.breakdown || []).forEach(function (i) { lines.push('  ' + i.label + ': ' + CUR + i.amount); });
        lines.push('GRAND TOTAL: ' + (o.totalFormatted || (CUR + o.total)));
        details.value = lines.join('\n');
      }
    }

    // payment method selection
    var payWrap = $('[data-pay-methods]', root);
    if (payWrap) {
      $$('.pay-method', payWrap).forEach(function (pm) {
        pm.addEventListener('click', function () {
          $$('.pay-method', payWrap).forEach(function (x) { x.classList.remove('is-selected'); });
          pm.classList.add('is-selected');
          var radio = $('input[type=radio]', pm); if (radio) radio.checked = true;
        });
      });
    }

    // back to builder
    var back = $('[data-checkout-back]', root);
    if (back) {
      back.addEventListener('click', function () {
        if (window.CakeCraft && window.CakeCraft.showBuilder && window.CakeCraft.builderRoot) {
          root.hidden = true;
          window.CakeCraft.showBuilder();
        } else {
          window.location.href = (window.CakeCraft.routes && window.CakeCraft.routes.makeCake) || '/';
        }
      });
    }

    // ensure hidden fields filled right before submit too
    var f = $('form', root);
    if (f) f.addEventListener('submit', populate);

    window.CakeCraft = window.CakeCraft || {};
    window.CakeCraft.populateCheckout = populate;

    // if this checkout is visible on load (dedicated page), populate now
    if (!root.hasAttribute('hidden')) populate();
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var builder = $('[data-builder]');
    if (builder) initBuilder(builder);
    var checkout = $('[data-checkout]');
    if (checkout) initCheckout(checkout);
  });
})();
