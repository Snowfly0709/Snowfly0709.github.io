/* ============================================================
   Voice Audition — listening deck
   Vanilla JS. No dependencies.
   - Renders a 10-slide deck from the content model below
   - Each voice "specimen" gets a Web Audio spectral visualiser
     (hue mapped low->high frequency = magenta -> cyan)
   - Exclusive playback (one voice at a time), keyboard nav,
     per-slide hue traversal, hash deep-links, reduced-motion safe.
   ============================================================ */
(function () {
  "use strict";

  // ---- content model -------------------------------------------------------
  // label = exactly what the listener sees. No persona / provider reveal,
  // so the ear stays unbiased (only neutral codes + the three named refs).
  var S = {
    A2: { label: "A2", file: "audio/A2.mp3" },
    A3: { label: "A3", file: "audio/A3.mp3" },
    S1: { label: "S1", file: "audio/S1.mp3" },
    S1f: { label: "S1-flash", file: "audio/S1-flash.mp3" },
    S2: { label: "S2", file: "audio/S2.mp3" },
    S3: { label: "S3", file: "audio/S3.mp3" },
    S4: { label: "S4", file: "audio/S4.mp3" },
    Christine: { label: "Christine", file: "audio/Christine.mp3" },
    Kevin: { label: "Kevin", file: "audio/Kevin.mp3" },
    Lim: { label: "Lim", file: "audio/Lim.mp3" }
  };

  var SLIDES = [
    {
      kind: "cover",
      mark: "Listening Session",
      title: "Voice<br>Audition",
      sub: "Help me choose the voice of an AI&nbsp;voicebot.",
      lead: "Ten samples, eight questions. Listen, then tell me which timbres feel the most natural, approachable, and genuinely Singaporean. There are no right answers — only your ear.",
      stats: [["10", "voice samples"], ["08", "questions"], ["~10", "minutes"]]
    },
    {
      kind: "pairs",
      eyebrow: "01 — Pronunciation",
      prompt: "Which one says the <em>place name</em> more clearly?",
      lead: "Same line, two renderings. Which pronounces the location / MRT station more clearly — and which sounds closer to how a Singaporean would actually say it?",
      pairs: [{ label: "Compare", a: "S1", b: "S1f" }]
    },
    {
      kind: "pairs",
      eyebrow: "02 — Natural & supportive",
      prompt: "Pair by pair, which voice feels <em>warmer</em>?",
      lead: "Two pairs. In each pair, which voice sounds more natural, approachable, and supportive to you?",
      pairs: [
        { label: "Pair 1", a: "A2", b: "S2" },
        { label: "Pair 2", a: "A3", b: "S3" }
      ]
    },
    {
      kind: "tray",
      eyebrow: "03 — Comfort",
      prompt: "Could you talk to this voice at a <em>service desk</em>?",
      lead: "Think about the voice you leaned toward. Would you feel comfortable talking to it for customer service — why, or why not?",
      note: "Replay anything",
      samples: ["S1", "S1f", "A2", "S2", "A3", "S3"]
    },
    {
      kind: "cells",
      cols: "cols-4",
      eyebrow: "04 — Ranking",
      prompt: "Rank these four, best fit to <em>least</em>.",
      lead: "Among S1–S4, order them from the voice that best fits its context to the one that fits least, and score each 1–5. What factors drove the ranking?",
      samples: ["S1", "S2", "S3", "S4"]
    },
    {
      kind: "cells",
      dense: true,
      eyebrow: "05 — Most Singaporean",
      prompt: "Pick the <em>three</em> that sound most Singaporean.",
      lead: "From these seven, choose the three that sound most like Singaporeans. For each: does it sound like a real person speaking naturally, or scripted / robotic?",
      samples: ["Christine", "Kevin", "Lim", "S1", "S2", "S3", "S4"]
    },
    {
      kind: "tray",
      eyebrow: "06 — What makes them natural",
      prompt: "And <em>why</em> those three?",
      lead: "Among the three you picked, what makes them sound natural to Singaporean ears? Replay them as you talk it through.",
      note: "Your shortlist",
      samples: ["Christine", "Kevin", "Lim", "S1", "S2", "S3", "S4"]
    },
    {
      kind: "chips",
      eyebrow: "07 — Describe it",
      prompt: "Give me <em>five words</em> for a natural voice.",
      lead: "What makes a voice sound natural and approachable — in a 1-on-1 conversation or a broadcast? About five words or phrases. These are only nudges:",
      chips: ["voice texture", "level of enthusiasm", "pacing", "warmth", "breathiness", "clarity", "rhythm", "where it pauses"]
    },
    {
      kind: "options",
      eyebrow: "08 — Accent preference",
      prompt: "Standard, Singaporean, or <em>somewhere between</em>?",
      lead: "In a voice call or broadcast, which do you prefer to hear?",
      options: [
        ["Standard English", "Neutral, broadcast-perfect, accent-light."],
        ["In between", "Local colour, lightly worn."],
        ["Real Singaporean English", "Spoken the way people here actually speak."]
      ],
      note: "A refresher — S2 vs Lim",
      samples: ["S2", "Lim"]
    },
    {
      kind: "closing",
      mark: "Fin",
      title: "Thank you.",
      lead: "That's everything — thank you for lending me your ears. Your instinct about what sounds human is exactly the thing no metric can measure."
    }
  ];

  // ---- helpers --------------------------------------------------------------
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HUE_LO = 322, HUE_HI = 176;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ":" + (s < 10 ? "0" + s : s);
  }

  // ---- audio engine ---------------------------------------------------------
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var players = [];          // every voice cell across the deck
  var lastPlayer = null;     // target for the Space key
  var rafId = null;

  function ensureCtx() {
    if (!AudioCtx) return null;
    if (!ctx) { try { ctx = new AudioCtx(); } catch (e) { ctx = null; } }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function wire(p) {
    // lazily connect the analyser the first time this cell plays
    if (p.wired || !ensureCtx()) return;
    try {
      p.src = ctx.createMediaElementSource(p.audio);
      p.analyser = ctx.createAnalyser();
      p.analyser.fftSize = 256;
      p.analyser.smoothingTimeConstant = 0.78;
      p.bins = new Uint8Array(p.analyser.frequencyBinCount);
      p.src.connect(p.analyser);
      p.analyser.connect(ctx.destination);
      p.wired = true;
    } catch (e) { p.wired = false; }
  }

  function playExclusive(p) {
    players.forEach(function (q) { if (q !== p) q.audio.pause(); });
    ensureCtx();
    wire(p);
    var pr = p.audio.play();
    if (pr && pr.catch) pr.catch(function () {});
    lastPlayer = p;
    startLoop();
  }

  function toggle(p) {
    if (p.audio.paused) playExclusive(p);
    else p.audio.pause();
  }

  // ---- visualiser -----------------------------------------------------------
  var BARS = 56;
  function sizeCanvas(p) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = p.canvas.clientWidth, h = p.canvas.clientHeight;
    if (!w || !h) return false;
    p.canvas.width = Math.round(w * dpr);
    p.canvas.height = Math.round(h * dpr);
    p.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    p.cw = w; p.ch = h;
    return true;
  }

  function hueAt(t) { return HUE_LO + (HUE_HI - HUE_LO) * t; }

  function draw(p, active) {
    if (!p.cw && !sizeCanvas(p)) return;
    var g = p.g, w = p.cw, h = p.ch, mid = h / 2;
    g.clearRect(0, 0, w, h);
    var step = w / BARS, bw = Math.max(1.5, step * 0.62);
    var bins = p.bins, n = bins ? bins.length : 0;

    if (active && bins) p.analyser.getByteFrequencyData(bins);

    for (var i = 0; i < BARS; i++) {
      var t = i / (BARS - 1);
      var v;
      if (active && bins) {
        var bin = Math.floor(t * (n * 0.72)); // skip the empty top bins
        v = bins[bin] / 255;
      } else {
        // resting shimmer — quiet, deterministic
        v = 0.05 + 0.045 * (Math.sin(i * 0.55) * 0.5 + 0.5);
      }
      var bh = Math.max(2, v * h * (active ? 0.96 : 1));
      var hue = hueAt(t);
      var a = active ? 0.4 + 0.6 * v : 0.22;
      g.fillStyle = "hsla(" + hue + ", 92%, 66%, " + a + ")";
      if (active) { g.shadowBlur = 10 * v; g.shadowColor = "hsla(" + hue + ", 95%, 62%, 0.9)"; }
      else g.shadowBlur = 0;
      var x = i * step + (step - bw) / 2;
      g.fillRect(x, mid - bh / 2, bw, bh);
    }
    g.shadowBlur = 0;
  }

  function startLoop() {
    if (rafId != null || reduceMotion) { if (reduceMotion) frame(); return; }
    var tick = function () {
      var any = false;
      for (var i = 0; i < players.length; i++) {
        var p = players[i];
        if (!p.audio.paused) { draw(p, true); any = true; }
      }
      rafId = any ? requestAnimationFrame(tick) : (rafId = null);
    };
    rafId = requestAnimationFrame(tick);
  }
  function frame() { // single paint (reduced-motion path)
    players.forEach(function (p) { draw(p, !p.audio.paused); });
  }

  // ---- cell factory ---------------------------------------------------------
  var PLAY_ICON =
    '<svg viewBox="0 0 24 24" class="icon-play" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
    '<svg viewBox="0 0 24 24" class="icon-pause" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';

  function makeCell(sampleId, compact) {
    var s = S[sampleId];
    var cell = el("div", "cell" + (compact ? " compact-cell" : ""));
    cell.innerHTML =
      '<div class="cell-head"><span class="cell-label">' + s.label + '</span>' +
      (compact ? "" : '<span class="cell-tag">sample</span>') + "</div>" +
      '<div class="scope"><canvas></canvas></div>' +
      '<div class="cell-foot">' +
        '<button class="play" type="button" aria-label="Play ' + s.label + '">' + PLAY_ICON + "</button>" +
        '<input class="seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek ' + s.label + '">' +
        '<span class="time">0:00 / 0:00</span>' +
      "</div>";

    var audio = new Audio(s.file);
    audio.preload = "metadata";
    audio.crossOrigin = "anonymous";

    var p = {
      id: sampleId, audio: audio, cell: cell,
      canvas: $(".scope canvas", cell),
      btn: $(".play", cell),
      seek: $(".seek", cell),
      time: $(".time", cell),
      g: null, bins: null, wired: false, cw: 0, ch: 0
    };
    p.g = p.canvas.getContext("2d");

    var setP = function (pct) { p.seek.style.setProperty("--p", pct + "%"); };

    p.btn.addEventListener("click", function () { lastPlayer = p; toggle(p); });
    audio.addEventListener("play", function () { cell.classList.add("is-playing"); startLoop(); });
    audio.addEventListener("pause", function () { cell.classList.remove("is-playing"); draw(p, false); });
    audio.addEventListener("ended", function () { p.audio.currentTime = 0; setP(0); });
    audio.addEventListener("loadedmetadata", function () {
      p.time.textContent = "0:00 / " + fmt(audio.duration);
    });
    audio.addEventListener("timeupdate", function () {
      var d = audio.duration || 0;
      var frac = d ? audio.currentTime / d : 0;
      p.seek.value = Math.round(frac * 1000);
      setP(frac * 100);
      p.time.textContent = fmt(audio.currentTime) + " / " + fmt(d);
      if (reduceMotion && !audio.paused) draw(p, true); // low-fi update sans RAF
    });
    p.seek.addEventListener("input", function () {
      lastPlayer = p;
      var d = audio.duration || 0;
      if (d) audio.currentTime = (p.seek.value / 1000) * d;
      setP(p.seek.value / 10);
    });

    players.push(p);
    return cell;
  }

  // ---- slide rendering ------------------------------------------------------
  function ordinal(i) { return i < 10 ? "0" + i : "" + i; }

  function buildSlide(data, index) {
    var slide = el("section", "slide kind-" + data.kind);
    slide.id = "s" + ordinal(index);
    slide.setAttribute("aria-hidden", "true");
    var inner = el("div", "slide-inner");

    if (data.kind === "cover" || data.kind === "closing") {
      slide.classList.add(data.kind === "cover" ? "cover" : "closing");
      inner.appendChild(el("p", "cover-mark", data.mark));
      inner.appendChild(el("h1", "prompt", data.title));
      if (data.sub) inner.appendChild(el("p", "cover-sub", data.sub));
      if (data.lead) inner.appendChild(el("p", "lead", data.lead));
      if (data.kind === "cover") {
        var begin = el("button", "begin", 'Begin <span class="begin-arrow">→</span>');
        begin.type = "button";
        begin.addEventListener("click", function () { deck.go(index + 1); });
        inner.appendChild(begin);
        if (data.stats) {
          var st = el("div", "cover-stat");
          data.stats.forEach(function (s) {
            var d = el("div"); d.appendChild(el("b", null, s[0])); d.appendChild(el("span", null, s[1]));
            st.appendChild(d);
          });
          inner.appendChild(st);
        }
      }
      slide.appendChild(inner);
      return slide;
    }

    // question slides share a ghost ordinal + eyebrow + prompt + lead
    slide.appendChild(el("span", "slide-ordinal", ordinal(index)));
    if (data.eyebrow) inner.appendChild(el("p", "eyebrow", data.eyebrow));
    if (data.prompt) inner.appendChild(el("h2", "prompt", data.prompt));
    if (data.lead) inner.appendChild(el("p", "lead", data.lead));

    if (data.kind === "pairs") {
      var pw = el("div", "pair-wrap");
      data.pairs.forEach(function (pr) {
        var pair = el("div", "pair");
        pair.appendChild(el("span", "pair-label", pr.label));
        var grid = el("div", "pair-grid");
        grid.appendChild(makeCell(pr.a));
        grid.appendChild(el("span", "vs", "vs"));
        grid.appendChild(makeCell(pr.b));
        pair.appendChild(grid);
        pw.appendChild(pair);
      });
      inner.appendChild(pw);
    } else if (data.kind === "cells") {
      var dense = !!data.dense;
      var grid2 = el("div", "cells " + (dense ? "dense " : "") + (data.cols || ""));
      data.samples.forEach(function (id) { grid2.appendChild(makeCell(id, dense)); });
      inner.appendChild(grid2);
    } else if (data.kind === "tray") {
      if (data.note) inner.appendChild(el("p", "tray-note", data.note));
      var tray = el("div", "cells compact");
      data.samples.forEach(function (id) { tray.appendChild(makeCell(id, true)); });
      inner.appendChild(tray);
    } else if (data.kind === "chips") {
      var chips = el("div", "chips");
      data.chips.forEach(function (c) { chips.appendChild(el("span", "chip", c)); });
      inner.appendChild(chips);
    } else if (data.kind === "options") {
      var opts = el("div", "options");
      data.options.forEach(function (o) {
        var op = el("div", "option");
        op.appendChild(el("b", null, o[0]));
        op.appendChild(el("span", null, o[1]));
        opts.appendChild(op);
      });
      inner.appendChild(opts);
      if (data.samples) {
        if (data.note) inner.appendChild(el("p", "tray-note", data.note));
        var t2 = el("div", "cells compact");
        data.samples.forEach(function (id) { t2.appendChild(makeCell(id, true)); });
        inner.appendChild(t2);
      }
    }

    slide.appendChild(inner);
    return slide;
  }

  // ---- deck controller ------------------------------------------------------
  var deck = {
    root: $("#deck"),
    slides: [],
    i: 0,
    build: function () {
      var frag = document.createDocumentFragment();
      SLIDES.forEach(function (d, idx) {
        var s = buildSlide(d, idx);
        deck.slides.push(s);
        frag.appendChild(s);
      });
      deck.root.appendChild(frag);
      $("#counter-total").textContent = ordinal(SLIDES.length - 1);
    },
    go: function (n) {
      n = Math.max(0, Math.min(SLIDES.length - 1, n));
      if (n === deck.i && deck.slides[n].classList.contains("is-active")) return;
      players.forEach(function (p) { p.audio.pause(); }); // silence on transit
      deck.slides.forEach(function (s, idx) {
        var on = idx === n;
        s.classList.toggle("is-active", on);
        s.setAttribute("aria-hidden", on ? "false" : "true");
      });
      deck.i = n;

      // traverse the spectrum: hue glides magenta -> cyan across the deck
      var t = SLIDES.length > 1 ? n / (SLIDES.length - 1) : 0;
      document.documentElement.style.setProperty("--slide-hue", hueAt(t).toFixed(1));

      $("#counter-now").textContent = ordinal(n);
      $("#rail-fill").style.width = (SLIDES.length > 1 ? (n / (SLIDES.length - 1)) * 100 : 0) + "%";
      $("#prev").disabled = n === 0;
      $("#next").disabled = n === SLIDES.length - 1;

      // the cover advances via its own Begin button — hide the transport there
      var hudEl = document.querySelector(".hud");
      if (hudEl) hudEl.hidden = n === 0;

      if (history.replaceState) history.replaceState(null, "", "#" + ordinal(n));

      // size + idle-paint the canvases now that the slide is visible
      lastPlayer = null;
      requestAnimationFrame(function () {
        var active = deck.slides[n];
        players.forEach(function (p) {
          if (active.contains(p.cell)) {
            sizeCanvas(p);
            draw(p, false);
            if (!lastPlayer) lastPlayer = p;
          }
        });
      });
    },
    next: function () { deck.go(deck.i + 1); },
    prev: function () { deck.go(deck.i - 1); }
  };

  // ---- wiring ---------------------------------------------------------------
  function init() {
    deck.build();

    $("#next").addEventListener("click", deck.next);
    $("#prev").addEventListener("click", deck.prev);

    document.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); deck.next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); deck.prev(); }
      else if (e.key === "Home") { e.preventDefault(); deck.go(0); }
      else if (e.key === "End") { e.preventDefault(); deck.go(SLIDES.length - 1); }
      else if (e.key === " " || e.key === "Spacebar") {
        if (tag === "button" || tag === "input") return; // let controls work
        e.preventDefault();
        if (lastPlayer) toggle(lastPlayer);
      }
    });

    window.addEventListener("resize", function () {
      players.forEach(function (p) { p.cw = 0; });
      var active = deck.slides[deck.i];
      players.forEach(function (p) {
        if (active && active.contains(p.cell)) { sizeCanvas(p); draw(p, !p.audio.paused); }
      });
    });

    window.addEventListener("hashchange", function () { deck.go(hashIndex()); });

    deck.go(hashIndex());
  }

  function hashIndex() {
    var h = (location.hash || "").replace("#", "");
    var n = parseInt(h, 10);
    return isFinite(n) ? n : 0;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
