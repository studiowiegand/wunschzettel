/* Weihnachtliche Klickgeräusche, live im Browser erzeugt (keine Audiodateien) */
(function () {
  var KEY = "wz-ton";
  var on = true;
  try { on = localStorage.getItem(KEY) !== "aus"; } catch (e) {}
  var ctx = null;

  var master = null;
  // iPhone: Töne auch bei Lautlos-Schalter abspielen
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}

  function ac() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = 1;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state !== "running") { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  // Beim ersten Tippen Audio freischalten (Safari braucht das)
  function unlock() {
    var a = ac(); if (!a) return;
    var b = a.createBuffer(1, 1, 22050), s = a.createBufferSource();
    s.buffer = b; s.connect(a.destination); s.start(0);
    document.removeEventListener("touchstart", unlock, true);
    document.removeEventListener("pointerdown", unlock, true);
  }
  document.addEventListener("touchstart", unlock, true);
  document.addEventListener("pointerdown", unlock, true);

  // Glocke: Grundton plus unharmonische Obertöne, weich ausklingend
  function bell(freq, when, vol, len) {
    var a = ac(); if (!a) return;
    var t = a.currentTime + 0.03 + (when || 0);
    var out = a.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(Math.min(0.9, (vol || 0.25) * 3), t + 0.008);
    out.gain.exponentialRampToValueAtTime(0.0001, t + (len || 1.2));
    out.connect(master);
    [[1, 1], [2.76, 0.45], [5.4, 0.22], [8.93, 0.1]].forEach(function (p) {
      var o = a.createOscillator(), g = a.createGain();
      o.type = "sine"; o.frequency.value = freq * p[0];
      g.gain.value = p[1];
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + (len || 1.2) + 0.05);
    });
  }

  // Schlittenschellen: kurze helle Rauschimpulse durch einen Bandpass
  function jingle(when, count) {
    var a = ac(); if (!a) return;
    var n = a.sampleRate * 0.12, buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    for (var k = 0; k < (count || 3); k++) {
      var t = a.currentTime + 0.03 + (when || 0) + k * 0.055 + Math.random() * 0.015;
      var s = a.createBufferSource(); s.buffer = buf;
      var f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 5200 + Math.random() * 2500; f.Q.value = 3;
      var g = a.createGain(); g.gain.value = 1.4;
      s.connect(f); f.connect(g); g.connect(master);
      s.start(t);
    }
  }

  var sounds = {
    // normaler Klick: kleines Schellenklingeln
    tap: function () { jingle(0, 3); bell(1568, 0.02, 0.06, 0.5); },
    // Kind wechseln: zwei helle Glöckchen
    tab: function () { bell(1319, 0, 0.12, 0.8); bell(1760, 0.09, 0.1, 0.9); },
    // gekauft oder beteiligt: kleine Glockenmelodie (Kling Glöckchen)
    yay: function () {
      jingle(0, 4);
      [[1568, 0], [1319, 0.14], [1568, 0.28], [2093, 0.46]].forEach(function (n) { bell(n[0], n[1], 0.16, 1.4); });
    },
    // zurücknehmen oder löschen: tiefe, kurze Glocke
    soft: function () { bell(659, 0, 0.12, 0.7); }
  };

  function pick(el) {
    if (el.matches(".kid, [role=tab]")) return "tab";
    var txt = (el.textContent || "").toLowerCase();
    if (/zurück|rückgängig|löschen|entfernen|abmelden/.test(txt)) return "soft";
    if (el.matches(".btn.dark, .btn.orange, [type=submit]")) return "yay";
    return "tap";
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("button, a.btn, .kid, .seg button, input[type=checkbox]");
    if (!el || !on || el.id === "wz-ton") return;
    try { sounds[pick(el)](); } catch (err) {}
  }, true);

  // Schalter oben rechts zum Stummschalten
  var css = document.createElement("style");
  css.textContent =
    "#wz-ton{display:inline-flex;align-items:center;gap:6px;font:500 14px var(--font-body);color:var(--forest);background:transparent;border:1px solid var(--line);border-radius:100px;padding:7px 12px;cursor:pointer}" +
    "#wz-ton:hover{background:var(--sand)}#wz-ton svg{width:16px;height:16px}" +
    ".nav .wrap .wz-right{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap}";
  document.head.appendChild(css);

  function icon() {
    return on
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 9.3-5"/><path d="M18 8c0 7 3 9 3 9H9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/><path d="m2 2 20 20"/></svg>';
  }

  function mount() {
    var cd = document.getElementById("countdown");
    if (!cd || document.getElementById("wz-ton")) return;
    var wrap = document.createElement("div"); wrap.className = "wz-right";
    cd.parentNode.insertBefore(wrap, cd); wrap.appendChild(cd);
    var b = document.createElement("button");
    b.type = "button"; b.id = "wz-ton";
    function paint() {
      b.innerHTML = icon() + (on ? "Ton an" : "Ton aus");
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-label", on ? "Weihnachtsklänge ausschalten" : "Weihnachtsklänge einschalten");
    }
    paint();
    b.addEventListener("click", function () {
      on = !on;
      try { localStorage.setItem(KEY, on ? "an" : "aus"); } catch (e) {}
      paint();
      if (on) sounds.tab();
    });
    wrap.appendChild(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
