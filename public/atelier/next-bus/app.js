/* NEXT BUS — live Singapore bus arrivals
   data: LTA DataMall via arrivelah (https://github.com/cheeaun/arrivelah)
   stops: busrouter.sg static dataset · map tiles: CARTO dark */

(() => {
  "use strict";

  const ARRIVALS_API = (id) => `https://arrivelah2.busrouter.sg/?id=${encodeURIComponent(id)}`;
  const STOPS_URL = "https://data.busrouter.sg/v1/stops.min.json";
  const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  const TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const REFRESH_MS = 20_000;
  const DEFAULT_STOP = "20251";
  const RECENT_KEY = "nextbus.recent";
  const MAX_RECENT = 5;
  const SG_CENTER = [1.3521, 103.8198];
  const STOP_ZOOM = 15; // markers appear at this zoom and above

  const $ = (id) => document.getElementById(id);
  const el = {
    rows: $("rows"),
    stopCode: $("stop-code"),
    stopName: $("stop-name"),
    stopRoad: $("stop-road"),
    clock: $("clock"),
    livePill: $("live-pill"),
    liveLabel: $("live-label"),
    updated: $("updated"),
    sweep: $("sweep"),
    search: $("search"),
    results: $("results"),
    recent: $("recent"),
    locate: $("locate"),
    maphint: $("maphint"),
    signAlert: $("sign-alert"),
    board: $("board"),
  };

  const state = {
    stop: null,
    services: [],     // raw service objects from the API
    stops: null,      // { code: [lng, lat, name, road] }
    stopsIndex: null, // [{ code, name, road, lat, lng, norm, tokens }]
    fetchTimer: null,
    lastFetch: null,
    activeResult: -1,
  };

  /* ============================================================
     fuzzy-core start
     LTA stop names abbreviate heavily (Blk, Pk, Stn…). Both the
     query and the haystack are normalised to the same canonical
     full words, so "BLOCK", "PARK", "STATION" match "Blk/Pk/Stn"
     and vice versa.
     ============================================================ */

  const ABBR = {
    blk: "block", opp: "opposite", aft: "after", bef: "before", bet: "between",
    stn: "station", int: "interchange", ter: "terminal", rd: "road",
    ave: "avenue", av: "avenue", dr: "drive", cres: "crescent", ctrl: "central",
    gdns: "gardens", gdn: "garden", pk: "park", hts: "heights",
    ind: "industrial", est: "estate", sch: "school", sec: "secondary",
    pri: "primary", pr: "primary", hosp: "hospital", lib: "library",
    ctr: "centre", center: "centre", sq: "square", twr: "tower",
    bldg: "building", mkt: "market", upp: "upper", nth: "north", sth: "south",
    bt: "bukit", jln: "jalan", kg: "kampong", lor: "lorong", tg: "tanjong",
    ln: "lane", hse: "house", ch: "church", pl: "place", cl: "close",
    st: "street", hwy: "highway", expy: "expressway", cp: "carpark",
    condo: "condominium", apt: "apartments", apts: "apartments",
    cwealth: "commonwealth",
  };

  // lowercase → expand abbreviations → cheap plural stem, identically
  // on both sides so any spelling converges to the same form
  function normTokens(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/)
      .filter(Boolean)
      .map((tok) => {
        tok = ABBR[tok] || tok;
        if (tok.length > 3 && tok.endsWith("s")) tok = tok.slice(0, -1);
        return tok;
      });
  }

  function searchStops(index, query, limit = 12) {
    const qraw = query.trim().toLowerCase();
    const qtokens = normTokens(query);
    if (!qtokens.length) return [];
    const hits = [];
    for (const s of index) {
      let ok = true;
      for (const t of qtokens) {
        if (!s.norm.includes(t)) { ok = false; break; }
      }
      if (!ok) continue;
      let score = 3;
      if (s.code === qraw) score = 0;
      else if (/^\d+$/.test(qraw) && s.code.startsWith(qraw)) score = 1;
      else if (qtokens.every((t) => s.tokens.some((ht) => ht.startsWith(t)))) score = 2;
      hits.push([score, s]);
    }
    hits.sort((a, b) => a[0] - b[0]);
    return hits.slice(0, limit).map((h) => h[1]);
  }

  /* fuzzy-core end */

  /* ---------- stop dataset ---------- */

  let stopsPromise = null;
  function loadStops() {
    if (!stopsPromise) {
      stopsPromise = fetch(STOPS_URL)
        .then((r) => r.json())
        .then((data) => {
          state.stops = data;
          state.stopsIndex = Object.entries(data).map(([code, [lng, lat, name, road]]) => {
            const tokens = normTokens(`${name} ${road}`);
            return { code, name, road, lat, lng, tokens, norm: `${code} ${tokens.join(" ")}` };
          });
          renderStopHeader();
          renderRows();   // destination names may now resolve
          renderRecent(); // chips can now show stop names
        })
        .catch(() => { stopsPromise = null; });
    }
    return stopsPromise;
  }

  const stopInfo = (code) => {
    const s = state.stops?.[code];
    return s ? { lng: s[0], lat: s[1], name: s[2], road: s[3] } : null;
  };

  /* ---------- arrivals ---------- */

  async function fetchArrivals() {
    try {
      const r = await fetch(ARRIVALS_API(state.stop), { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      state.services = (data.services || []).slice().sort(byServiceNo);
      state.lastFetch = new Date();
      setLive(true);
      renderRows();
      restartSweep();
    } catch {
      setLive(false);
    }
  }

  function byServiceNo(a, b) {
    const na = parseInt(a.no, 10), nb = parseInt(b.no, 10);
    return na - nb || a.no.localeCompare(b.no);
  }

  function setLive(ok) {
    el.livePill.classList.toggle("is-down", !ok);
    el.liveLabel.textContent = ok ? "LIVE" : "NO SIGNAL";
    if (!ok && !state.services.length) showMsg("NO SIGNAL · RETRYING");
    if (ok) el.updated.textContent = `upd ${fmtClock(state.lastFetch)}`;
  }

  function startPolling() {
    stopPolling();
    fetchArrivals();
    state.fetchTimer = setInterval(fetchArrivals, REFRESH_MS);
  }

  function stopPolling() {
    if (state.fetchTimer) clearInterval(state.fetchTimer);
    state.fetchTimer = null;
  }

  document.addEventListener("visibilitychange", () => {
    document.hidden ? stopPolling() : startPolling();
  });

  /* ---------- rendering ---------- */

  function showMsg(text) {
    el.rows.innerHTML = `<div class="board-msg">${text}</div>`;
  }

  function renderStopHeader() {
    el.stopCode.textContent = state.stop;
    const info = stopInfo(state.stop);
    el.stopName.textContent = info ? info.name : "";
    el.stopRoad.textContent = info ? info.road : "";
    document.title = info
      ? `${info.name} · Next Bus 下一班巴士`
      : `Stop ${state.stop} · Next Bus 下一班巴士`;
  }

  function renderRows() {
    if (!state.services.length) {
      if (state.lastFetch) showMsg("NO SERVICE AT THIS STOP");
      return;
    }
    el.rows.innerHTML = state.services.map(rowHtml).join("");
    tick();
  }

  function rowHtml(svc) {
    const destCode = svc.next?.destination_code;
    const dest = destCode ? (stopInfo(destCode)?.name || `→ ${destCode}`) : "";
    const etas = [svc.next, svc.next2, svc.next3].map(etaHtml).join("");
    return `<div class="row">
      <div class="svc">${esc(svc.no)}</div>
      <div class="dest">
        <span class="dest-name">${dest ? "→ " + esc(dest) : ""}</span>
        <span class="dest-meta">${esc(svc.operator || "")}</span>
      </div>
      ${etas}
    </div>`;
  }

  function etaHtml(bus) {
    if (!bus || !bus.time) {
      return `<div class="eta is-empty"><span class="eta-min">—</span><span class="eta-sub"></span></div>`;
    }
    const load = (bus.load || "").toLowerCase();           // sea | sda | lsd
    const sched = bus.monitored === 0;
    const type = { DD: "DBL", SD: "SGL", BD: "BND" }[bus.type] || "";
    const sub = sched ? "SCH" : type;
    return `<div class="eta l-${load}${sched ? " is-sched" : ""}" data-time="${esc(bus.time)}">
      <span class="eta-min"></span><span class="eta-sub">${sub}</span>
    </div>`;
  }

  /* per-second tick: live countdowns + clock */
  function tick() {
    const now = Date.now();
    document.querySelectorAll(".eta[data-time]").forEach((cell) => {
      const mins = Math.floor((new Date(cell.dataset.time) - now) / 60_000);
      const min = cell.querySelector(".eta-min");
      if (mins <= 0) {
        cell.classList.add("is-arr");
        min.textContent = "ARR";
      } else {
        cell.classList.remove("is-arr");
        min.textContent = mins;
      }
    });
    el.clock.textContent = fmtClock(new Date());
  }

  const sgTime = new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore", hour12: false,
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const fmtClock = (d) => sgTime.format(d);

  function restartSweep() {
    el.sweep.classList.remove("is-running");
    void el.sweep.offsetWidth; // reflow restarts the CSS animation
    el.sweep.classList.add("is-running");
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- stop switching ---------- */

  function setStop(code, push = true) {
    if (!/^\d{4,5}$/.test(code)) return;
    state.stop = code;
    state.services = [];
    showMsg("CONNECTING…");
    renderStopHeader();
    addRecent(code);
    if (push) {
      const url = new URL(location.href);
      url.searchParams.set("stop", code);
      history.replaceState(null, "", url);
    }
    startPolling();
    updateMapSelection();
  }

  function addRecent(code) {
    const list = getRecent().filter((c) => c !== code);
    list.unshift(code);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT))); } catch {}
    renderRecent();
  }

  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; }
  }

  function renderRecent() {
    const list = getRecent().filter((c) => c !== state.stop);
    el.recent.innerHTML = list.map((code) => {
      const info = stopInfo(code);
      return `<button class="chip" type="button" data-stop="${esc(code)}">
        <span class="c-code">${esc(code)}</span>${info ? esc(info.name) : ""}
      </button>`;
    }).join("");
  }

  el.recent.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-stop]");
    if (chip) setStop(chip.dataset.stop);
  });

  /* ---------- search ---------- */

  el.search.addEventListener("focus", loadStops, { once: true });

  let searchDebounce = null;
  el.search.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(runSearch, 120);
  });

  function runSearch() {
    const q = el.search.value.trim();
    state.activeResult = -1;
    if (q.length < 2 || !state.stopsIndex) {
      closeResults();
      return;
    }
    const hits = searchStops(state.stopsIndex, q);
    if (!hits.length) { closeResults(); return; }
    el.results.innerHTML = hits.map((s) =>
      `<li role="option" data-stop="${esc(s.code)}">
        <span class="r-code">${esc(s.code)}</span>
        <span class="r-name">${esc(s.name)}</span>
        <span class="r-road">${esc(s.road)}</span>
      </li>`).join("");
    el.results.hidden = false;
    el.search.setAttribute("aria-expanded", "true");
  }

  function closeResults() {
    el.results.hidden = true;
    el.search.setAttribute("aria-expanded", "false");
  }

  el.search.addEventListener("keydown", (e) => {
    const items = [...el.results.querySelectorAll("li")];
    if (e.key === "Enter") {
      e.preventDefault();
      const pick = items[state.activeResult] || items[0];
      const raw = el.search.value.trim();
      if (pick) selectStop(pick.dataset.stop);
      else if (/^\d{4,5}$/.test(raw)) selectStop(raw);
      return;
    }
    if (!items.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const dir = e.key === "ArrowDown" ? 1 : -1;
      state.activeResult = (state.activeResult + dir + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle("is-active", i === state.activeResult));
      items[state.activeResult].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Escape") {
      closeResults();
    }
  });

  el.results.addEventListener("mousedown", (e) => {
    const li = e.target.closest("[data-stop]");
    if (li) selectStop(li.dataset.stop);
  });

  function selectStop(code) {
    closeResults();
    el.search.value = "";
    el.search.blur();
    setStop(code);
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".searchwrap")) closeResults();
  });

  /* ---------- map (lazy leaflet) ---------- */

  let map = null;
  let stopsLayer = null;
  let selectedMarker = null;
  let userMarker = null;
  let leafletPromise = null;

  function loadLeaflet() {
    if (!leafletPromise) {
      leafletPromise = new Promise((resolve, reject) => {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = LEAFLET_CSS;
        document.head.appendChild(css);
        const js = document.createElement("script");
        js.src = LEAFLET_JS;
        js.onload = resolve;
        js.onerror = () => { leafletPromise = null; reject(new Error("leaflet failed")); };
        document.head.appendChild(js);
      });
    }
    return leafletPromise;
  }

  async function initMap() {
    if (map) return map;
    await Promise.all([loadLeaflet(), loadStops()]);
    const here = stopInfo(state.stop);
    map = L.map("map", { preferCanvas: true, zoomSnap: 0.5 })
      .setView(here ? [here.lat, here.lng] : SG_CENTER, here ? 16 : 12);
    L.tileLayer(TILES, {
      attribution: "© OpenStreetMap · © CARTO",
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);
    stopsLayer = L.layerGroup().addTo(map);
    map.on("moveend zoomend", renderStopMarkers);
    renderStopMarkers();
    return map;
  }

  function renderStopMarkers() {
    if (!map || !state.stopsIndex) return;
    stopsLayer.clearLayers();
    const zoomedIn = map.getZoom() >= STOP_ZOOM;
    el.maphint.hidden = zoomedIn;
    if (!zoomedIn) { drawSelected(); return; }
    const bounds = map.getBounds().pad(0.1);
    let drawn = 0;
    for (const s of state.stopsIndex) {
      if (drawn >= 500) break;
      if (s.code === state.stop || !bounds.contains([s.lat, s.lng])) continue;
      // wide faint stroke doubles as glow and as a finger-sized hit area
      const m = L.circleMarker([s.lat, s.lng], {
        radius: 6, color: "#ffb000", weight: 14, opacity: 0.08,
        fillColor: "#ffb000", fillOpacity: 0.78,
      }).addTo(stopsLayer);
      m.bindTooltip(`${s.code} · ${s.name}`, { className: "stop-tip", direction: "top", offset: [0, -8] });
      m.on("click", () => pickFromMap(s.code));
      drawn++;
    }
    drawSelected();
  }

  function drawSelected() {
    const info = stopInfo(state.stop);
    if (!info) return;
    selectedMarker = L.circleMarker([info.lat, info.lng], {
      radius: 9, color: "#fff", weight: 3, opacity: 0.95,
      fillColor: "#ffb000", fillOpacity: 1,
    }).addTo(stopsLayer);
    selectedMarker.bindTooltip(`${state.stop} · ${info.name}`, { className: "stop-tip", direction: "top", offset: [0, -10] });
  }

  function pickFromMap(code) {
    setStop(code);
    el.board.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateMapSelection() {
    if (!map) return;
    renderStopMarkers();
    const info = stopInfo(state.stop);
    if (info) map.panTo([info.lat, info.lng]);
  }

  /* ---------- geolocation ---------- */

  el.locate.addEventListener("click", async () => {
    hideSignAlert();
    if (!navigator.geolocation) {
      showSignAlert("GEOLOCATION NOT SUPPORTED · 此浏览器不支持定位");
      return;
    }
    el.locate.setAttribute("aria-busy", "true");
    try {
      await initMap();
      navigator.geolocation.getCurrentPosition(onLocated, onLocateError, {
        enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000,
      });
    } catch {
      el.locate.removeAttribute("aria-busy");
      showSignAlert("MAP FAILED TO LOAD — CHECK CONNECTION · 地图加载失败");
    }
  });

  function onLocated(pos) {
    el.locate.removeAttribute("aria-busy");
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.layerGroup([
      L.circle([lat, lng], { radius: Math.min(accuracy, 150), color: "#ffb000", weight: 1, opacity: 0.4, fillColor: "#ffb000", fillOpacity: 0.08 }),
      L.marker([lat, lng], { icon: L.divIcon({ className: "user-dot", iconSize: [14, 14] }), interactive: false }),
    ]).addTo(map);
    map.setView([lat, lng], 17);
    const nearest = nearestStop(lat, lng);
    if (nearest) setStop(nearest.code);
    else showSignAlert("NO STOPS FOUND NEARBY · 附近未找到站点");
  }

  function onLocateError(err) {
    el.locate.removeAttribute("aria-busy");
    const msg = err.code === 1
      ? "LOCATION PERMISSION DENIED — ALLOW ACCESS AND RETRY · 请允许定位权限后重试"
      : "LOCATION UNAVAILABLE — TRY AGAIN · 定位失败，请重试";
    showSignAlert(msg);
  }

  function nearestStop(lat, lng) {
    let best = null, bestD = Infinity;
    for (const s of state.stopsIndex || []) {
      // equirectangular approximation is fine at city scale
      const dx = (s.lng - lng) * Math.cos(lat * Math.PI / 180);
      const dy = s.lat - lat;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }

  function showSignAlert(text) {
    el.signAlert.textContent = text;
    el.signAlert.hidden = false;
  }

  function hideSignAlert() {
    el.signAlert.hidden = true;
  }

  /* ---------- boot ---------- */

  const urlStop = new URLSearchParams(location.search).get("stop");
  const initial = (urlStop && /^\d{4,5}$/.test(urlStop) && urlStop)
    || getRecent()[0]
    || DEFAULT_STOP;

  setStop(initial, !!urlStop);
  renderRecent();
  loadStops();
  initMap().catch(() => {}); // silent at boot; the locate button retries on demand
  setInterval(tick, 1000);
})();
