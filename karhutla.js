/*! Karhutla.js 1.0 — configurable WebGL smoke overlay for forest-fire (karhutla) awareness. MIT.
 *  const smoke = Karhutla.init({ thickness:.75, speed:1, scale:1.7, opacity:.97, push:.6, reveal:'center'|'random',
 *    lang:'auto'|'en'|'id', badge:{icon,href,title,label,size,opacity,position,offsetX,offsetY,background,color,pulse,follow},
 *    allowScroll:[], color:'#8f8a85'|'auto', disappear:'scroll'|'auto', scrollMode:'lock'|'track', scrollDistance:1.6,
 *    delay:0, duration:6, keepOnTop:[], zIndex:9999, quality:'low'|'medium'|'high', resolution:.5, maxFps:30, adaptive:true,
 *    frequency:{mode:'always'|'once'|'limit',times:2,days:7}, storageKey:'karhutla', onProgress, onComplete });
 *  smoke.setOptions({...}); smoke.clear(1.2); smoke.destroy(); Karhutla.reset();
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Karhutla = root.SmokeReveal = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var DEFAULTS = {
    thickness: .75, speed: 1, scale: 1.7, opacity: .97, push: .6, reveal: 'center', allowScroll: [], color: '#8f8a85',
    disappear: 'scroll', scrollMode: 'lock', scrollDistance: 1.6, delay: 0, duration: 6, keepOnTop: [], zIndex: 9999,
    quality: 'medium', resolution: .5, maxFps: 30, adaptive: true,
    frequency: { mode: 'always', times: 1, days: 1 }, storageKey: 'karhutla', lang: 'auto', badge: null, onProgress: null, onComplete: null
  };
  var OCT = { low: 3, medium: 4, high: 5 };
  var BADGE_LANG = {
    en: { href: 'https://www.google.com/search?q=Indonesia+Forest+Fire', title: 'Search: Indonesia Forest Fire' },
    id: { href: 'https://www.google.com/search?q=Karhutla+Indonesia&hl=id', title: 'Cari: Karhutla Indonesia' }
  };
  function resolveLang(l) {
    if (l === 'id' || l === 'en') return l;
    var q = ''; try { q = new URLSearchParams(location.search).get('lang') || ''; } catch (e) {}
    q = (q || document.documentElement.lang || '').toLowerCase().slice(0, 2);
    return q === 'id' ? 'id' : 'en';
  }
  var BADGE = { target: '_blank', icon: 'flame', label: '', size: 56, opacity: .95, position: 'bottom-left', offsetX: 18, offsetY: 18,
    background: '#d32f2f', color: '#ffffff', radius: '999px', shadow: true, pulse: true, follow: true };
  var ICONS = {
    flame: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" fill-rule="evenodd"><path d="M12 2s1 3.5-1.5 6C8 10.5 6 12.5 6 15.5a6 6 0 0 0 12 0c0-2-1-3.7-2-5 0 1.5-.8 2.5-1.8 2.5C14.8 10 14 4.5 12 2zm0 18a2.5 2.5 0 0 1-2.5-2.5c0-1.2.9-2 2.5-3.5 1.6 1.5 2.5 2.3 2.5 3.5A2.5 2.5 0 0 1 12 20z"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg>'
  };
  function assign(t) { for (var i = 1; i < arguments.length; i++) { var s = arguments[i]; if (s) for (var k in s) t[k] = s[k]; } return t; }
  function clamp(v) { return v > 0 ? (v < 1 ? v : 1) : 0; }
  function toRGB(c) {
    if (Array.isArray(c)) return [c[0] / 255, c[1] / 255, c[2] / 255];
    var m = String(c).replace('#', ''); if (m.length === 3) m = m.replace(/./g, '$&$&');
    var n = parseInt(m, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  function allowed(o) {
    var f = o.frequency || {}; if (!f.mode || f.mode === 'always') return true;
    var now = Date.now(), rec = null;
    try { rec = JSON.parse(localStorage.getItem(o.storageKey)); } catch (e) {}
    var times = f.mode === 'once' ? 1 : (f.times || 1), win = f.mode === 'once' ? Infinity : (f.days || 1) * 864e5;
    if (!rec || now - rec.start > win) rec = { start: now, count: 0 };
    if (rec.count >= times) return false;
    rec.count++; try { localStorage.setItem(o.storageKey, JSON.stringify(rec)); } catch (e) {}
    return true;
  }
  function shader(oct) {
    return ['#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
      '#define OCT ' + oct, 'uniform vec2 r;uniform float t,p,th,sc,op,ps,rv;uniform vec3 col;',
      'float h(vec2 i){return fract(sin(dot(i,vec2(127.1,311.7)))*43758.5453);}',
      'float n(vec2 x){vec2 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
      'float fbm(vec2 x){float v=0.,a=.5;for(int i=0;i<OCT;i++){v+=a*n(x);x=x*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
      'void main(){vec2 uv=gl_FragCoord.xy/r.y;vec2 cn=vec2(.5*r.x/r.y,.5);',
      'float rd=length((gl_FragCoord.xy-.5*r)/(.5*r))*.7071;',
      'vec2 q=(cn+(uv-cn)*(1.-ps*p*.7))*sc;q.y-=t*.07;',
      'vec2 w=vec2(fbm(q+vec2(0.,t*.05)),fbm(q+vec2(5.2,1.3)-t*.04));',
      'float d=fbm(q+2.4*w+vec2(t*.03,-t*.08));',
      'float cell=n(uv*.8+7.3)*.65+n(uv*1.9+3.1)*.35;',
      'float k=clamp(p*mix(1.75,2.4,rv)-mix(cell*.75,rd+cell*.4,rv),0.,1.);',
      'float lo=mix(.55,.08,th)+k*.45;',
      'float a=smoothstep(lo,lo+.44-k*.34,d)*(1.-k*k);a=min(a*1.05,op);',
      'gl_FragColor=vec4(col*(.82+.36*w.x)*a,a);}'].join('\n');
  }
  function init(user) {
    var o = assign({}, DEFAULTS, user); o.frequency = assign({}, DEFAULTS.frequency, user && user.frequency);
    var lang = resolveLang(o.lang);
    if (o.badge) o.badge = assign({}, BADGE, BADGE_LANG[lang], o.badge);
    var noop = function () {};
    if (!allowed(o)) return { skipped: true, destroy: noop, clear: noop, setOptions: noop, progress: 1 };
    var off = [], dead = false, raf = 0, cur = 0, time = 0, ov = null, acc = 0, need = 1;
    var t0 = performance.now(), last = t0, S = o.resolution, slow = 0, cnt = 0;
    var mq = matchMedia('(prefers-color-scheme:dark)');
    var still = matchMedia('(prefers-reduced-motion:reduce)').matches;
    var cc = o.color === 'auto' ? null : toRGB(o.color);
    function on(t, e, f, p) { t.addEventListener(e, f, p); off.push(function () { t.removeEventListener(e, f, p); }); }
    var cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:' + o.zIndex;
    cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
    var keep = [];
    function lower() { for (var i = keep.length - 1; i >= 0; i--) { keep[i].el.style.zIndex = keep[i].z; keep[i].el.style.position = keep[i].p; } keep.length = 0; }
    function raise() {
      lower();
      [].concat(o.keepOnTop || []).forEach(function (sel) {
        var list = []; try { list = document.querySelectorAll(sel); } catch (e) {}
        [].forEach.call(list, function (el) {
          if (keep.some(function (k) { return k.el === el; })) return;
          keep.push({ el: el, z: el.style.zIndex, p: el.style.position });
          if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
          el.style.zIndex = o.zIndex + 1;
        });
      });
    }
    raise();
    var bd = null, sty = null;
    function makeBadge() {
      if (!document.getElementById('sr-style')) { sty = document.createElement('style'); sty.id = 'sr-style'; sty.textContent = '@keyframes sr-pulse{50%{scale:1.1}}'; document.head.appendChild(sty); }
      bd = document.createElement('a'); bd.rel = 'noopener noreferrer'; document.body.appendChild(bd);
    }
    function styleBadge() {
      var b = o.badge; if (!bd || !b) return;
      var s = b.size, pp = String(b.position).split('-'), v = pp[0], h = pp[1];
      bd.style.cssText = 'position:fixed;z-index:' + (o.zIndex + 2) + ';display:inline-flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box;height:' + s + 'px;min-width:' + s + 'px;padding:0 ' + (b.label ? s * .35 : 0) + 'px;border-radius:' + b.radius + ';background:' + b.background + ';color:' + b.color + ';font:600 14px system-ui,sans-serif;text-decoration:none;white-space:nowrap;' + (b.shadow ? 'box-shadow:0 6px 22px rgba(0,0,0,.35);' : '') + (v === 'top' ? 'top:calc(' + b.offsetY + 'px + env(safe-area-inset-top,0px));' : 'bottom:calc(' + b.offsetY + 'px + env(safe-area-inset-bottom,0px));') + (h === 'left' ? 'left:' + b.offsetX + 'px;' : h === 'right' ? 'right:' + b.offsetX + 'px;' : 'left:50%;translate:-50% 0;') + (b.pulse && !still ? 'animation:sr-pulse 2s ease-in-out infinite;' : '');
      bd.href = b.href; bd.target = b.target; bd.title = b.title; bd.setAttribute('aria-label', b.title);
      bd.innerHTML = '<span style="display:flex;width:' + s * .5 + 'px;height:' + s * .5 + 'px">' + (ICONS[b.icon] || b.icon) + '</span>';
      if (b.label) { var t = document.createElement('span'); t.textContent = b.label; bd.appendChild(t); }
    }
    function tickBadge() {
      if (!bd) return; var b = o.badge, a = b.opacity * (b.follow ? 1 - cur : 1);
      bd.style.opacity = a; bd.style.pointerEvents = a < .05 ? 'none' : 'auto'; bd.style.visibility = a < .01 ? 'hidden' : 'visible';
    }
    function removeBadge() { if (bd) { bd.remove(); bd = null; } if (sty) { sty.remove(); sty = null; } }
    if (o.badge) { makeBadge(); styleBadge(); tickBadge(); }
    var gl = null, U = {};
    try {
      gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
      if (gl) {
        var mk = function (t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw 0; return x; };
        var pr = gl.createProgram();
        gl.attachShader(pr, mk(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
        gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, shader(OCT[o.quality] || 4)));
        gl.linkProgram(pr); gl.useProgram(pr);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        var l = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        ['r', 't', 'p', 'th', 'sc', 'op', 'ps', 'rv', 'col'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
        on(cv, 'webglcontextlost', function (e) { e.preventDefault(); gl = null; });
      }
    } catch (e) { gl = null; }
    function measure() { need = Math.max(1, o.scrollDistance * innerHeight); }
    function resize() {
      measure(); if (!gl) return;
      cv.width = Math.max(2, innerWidth * S | 0); cv.height = Math.max(2, innerHeight * S | 0);
      gl.viewport(0, 0, cv.width, cv.height);
    }
    var rz = 0; on(window, 'resize', function () { cancelAnimationFrame(rz); rz = requestAnimationFrame(resize); });
    resize();
    if (o.disappear === 'scroll' && o.scrollMode === 'lock') {
      var de = document.documentElement, bodyEl = document.body, po = de.style.overflow, pb = bodyEl.style.overflow;
      scrollTo(0, 0); de.style.overflow = bodyEl.style.overflow = 'hidden';
      off.push(function () { de.style.overflow = po; bodyEl.style.overflow = pb; });
      var add = function (d) { acc = Math.min(need, Math.max(0, acc + d)); };
      var isField = function (e) { return e.target && e.target.closest && e.target.closest('input,select,textarea,button,a'); };
      var isInput = function (e) { return e.target && e.target.closest && e.target.closest('input,select,textarea'); };
      var free = function (e) { return (o.allowScroll || []).some(function (s) { return e.target.closest && e.target.closest(s); }); };
      var ty = 0;
      on(window, 'wheel', function (e) { if (free(e)) return; e.preventDefault(); add(e.deltaY * (e.deltaMode === 1 ? 16 : 1)); }, { passive: false });
      on(window, 'touchstart', function (e) { ty = e.touches[0].clientY; }, { passive: true });
      on(window, 'touchmove', function (e) { if (isInput(e) || free(e)) return; e.preventDefault(); var y = e.touches[0].clientY; add((ty - y) * 1.4); ty = y; }, { passive: false });
      on(window, 'keydown', function (e) {
        if (isField(e)) return;
        var m = { ArrowDown: 60, ArrowUp: -60, PageDown: innerHeight * .8, PageUp: -innerHeight * .8, ' ': innerHeight * .8, End: need };
        if (m[e.key] !== undefined) { e.preventDefault(); add(m[e.key]); }
      });
    }
    function target(now) {
      if (ov) return ov.f + (1 - ov.f) * clamp((now - ov.t) / ov.d);
      if (o.disappear === 'auto') { var q = clamp((now - t0 - o.delay * 1000) / (Math.max(.1, +o.duration || 6) * 1000)); return q * q * (3 - 2 * q); }
      return clamp((o.scrollMode === 'lock' ? acc : scrollY) / need);
    }
    function rgb() { if (cc) return cc; var th = document.documentElement.dataset.theme; return (th ? th === 'dark' : mq.matches) ? [.26, .25, .24] : [.9, .89, .87]; }
    function cleanup(leaveBadge) {
      if (dead) return; dead = true; cancelAnimationFrame(raf);
      try { cv.remove(); } catch (e) {}
      off.forEach(function (f) { try { f(); } catch (e) {} });
      lower();
      try { if (gl) { var x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } } catch (e) {}
      if (!(leaveBadge && o.badge && o.badge.follow === false)) removeBadge();
    }
    function step(now) {
      var budget = 1000 / o.maxFps;
      if (now - last < budget - 2) return;
      var dt = Math.min(now - last, 100); last = now;
      var tp = target(now);
      cur += (tp - cur) * (1 - Math.exp(-dt / 110)); if (Math.abs(tp - cur) < .0004) cur = tp;
      time += dt / 1000 * o.speed;
      if (o.onProgress) o.onProgress(cur);
      tickBadge();
      if (cur >= .999 && tp >= 1) { cleanup(true); if (o.onComplete) o.onComplete(); return; }
      var c = rgb();
      if (gl) {
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(U.r, cv.width, cv.height); gl.uniform1f(U.t, still ? 3 : time); gl.uniform1f(U.p, cur);
        gl.uniform1f(U.th, o.thickness); gl.uniform1f(U.sc, o.scale); gl.uniform1f(U.op, o.opacity);
        gl.uniform1f(U.ps, o.push); gl.uniform1f(U.rv, o.reveal === 'random' ? 0 : 1);
        gl.uniform3f(U.col, c[0], c[1], c[2]); gl.drawArrays(gl.TRIANGLES, 0, 3);
      } else {
        cv.style.background = 'rgb(' + (c[0] * 255 | 0) + ',' + (c[1] * 255 | 0) + ',' + (c[2] * 255 | 0) + ')';
        cv.style.opacity = (1 - cur) * o.opacity;
      }
      if (o.adaptive && gl) {
        slow += dt; cnt++;
        if (cnt === 24) { if (slow / cnt > budget * 1.35 && S > .25) { S = Math.max(.25, S * .8); resize(); } slow = cnt = 0; }
      }
    }
    function loop(now) {
      if (dead) return; raf = requestAnimationFrame(loop);
      try { step(now); } catch (e) { cleanup(); removeBadge(); if (window.console) console.error('Karhutla.js stopped:', e); }
    }
    raf = requestAnimationFrame(loop);
    return {
      skipped: false,
      destroy: function () { cleanup(); removeBadge(); },
      clear: function (sec) { ov = { t: performance.now(), f: cur, d: (sec || 1.2) * 1000 }; },
      setOptions: function (p) {
        if (dead && !bd) return;
        var pb = p.badge; p = assign({}, p); delete p.badge; assign(o, p);
        if (p.keepOnTop !== undefined && !dead) raise();
        if (p.lang !== undefined) {
          var ol = lang; lang = resolveLang(p.lang);
          if (o.badge) {
            if (o.badge.href === BADGE_LANG[ol].href) o.badge.href = BADGE_LANG[lang].href;
            if (o.badge.title === BADGE_LANG[ol].title) o.badge.title = BADGE_LANG[lang].title;
            styleBadge();
          }
        }
        if (pb === false) { removeBadge(); o.badge = null; }
        else if (pb) { o.badge = assign({}, o.badge || assign({}, BADGE, BADGE_LANG[lang]), pb); if (!bd) makeBadge(); styleBadge(); }
        if (p.color !== undefined) cc = p.color === 'auto' ? null : toRGB(p.color);
        if (p.resolution !== undefined) { S = p.resolution; resize(); } if (p.scrollDistance !== undefined) measure();
      },
      get progress() { return cur; }
    };
  }
  return { init: init, defaults: DEFAULTS, reset: function (key) { try { localStorage.removeItem(key || DEFAULTS.storageKey); } catch (e) {} } };
});
