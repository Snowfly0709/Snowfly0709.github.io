// Random stellar-system generator. Produces a body list with the same shape as
// data.js's NS.BODIES so the rest of the renderer can use it unchanged. Star
// types include red/blue giants, dwarfs, neutron stars, and black holes —
// each with its own STAR_VISUALS palette consumed by render.js.
window.SolarSys = window.SolarSys || {};

(function (NS) {
  const m = NS.math;
  const TAU = m.TAU;

  // ─── Star visual palettes (consumed by render.js drawSunStar / drawBlackHole) ───
  // Each entry describes how the central body is painted to ctx.
  NS.STAR_VISUALS = {
    'sun': {
      bloomMul: 5.5, coreMul: 1.15,
      bloomStops: (a) => [
        { p: 0.00, c: `rgba(255, 240, 200, ${0.55 * a})` },
        { p: 0.22, c: `rgba(255, 200, 110, ${0.25 * a})` },
        { p: 0.55, c: `rgba(255, 140, 50,  ${0.08 * a})` },
        { p: 1.00, c: 'rgba(255, 100, 30, 0)' }
      ],
      coreStops: (a, primary) => [
        { p: 0.00, c: `rgba(255, 255, 250, ${a})` },
        { p: 0.40, c: `rgba(255, 235, 180, ${a})` },
        { p: 0.85, c: hexA(primary, a) },
        { p: 1.00, c: hexA(primary, 0) }
      ]
    },

    'red-giant': {
      bloomMul: 9.5, coreMul: 1.30,
      bloomStops: (a) => [
        { p: 0.00, c: `rgba(255, 180, 130, ${0.62 * a})` },
        { p: 0.18, c: `rgba(255, 110, 60,  ${0.36 * a})` },
        { p: 0.45, c: `rgba(210, 60, 25,   ${0.14 * a})` },
        { p: 0.80, c: `rgba(120, 30, 10,   ${0.04 * a})` },
        { p: 1.00, c: 'rgba(60, 10, 5, 0)' }
      ],
      coreStops: (a, primary) => [
        { p: 0.00, c: `rgba(255, 220, 180, ${a})` },
        { p: 0.40, c: `rgba(255, 140, 80,  ${a})` },
        { p: 0.85, c: hexA(primary, a) },
        { p: 1.00, c: hexA('#3A0A05', 0) }
      ]
    },

    'blue-giant': {
      bloomMul: 7.5, coreMul: 1.25,
      bloomStops: (a) => [
        { p: 0.00, c: `rgba(220, 240, 255, ${0.62 * a})` },
        { p: 0.22, c: `rgba(150, 200, 255, ${0.30 * a})` },
        { p: 0.55, c: `rgba(80,  130, 240, ${0.12 * a})` },
        { p: 1.00, c: 'rgba(40, 80, 200, 0)' }
      ],
      coreStops: (a, primary) => [
        { p: 0.00, c: `rgba(255, 255, 255, ${a})` },
        { p: 0.40, c: `rgba(200, 220, 255, ${a})` },
        { p: 0.85, c: hexA(primary, a) },
        { p: 1.00, c: hexA(primary, 0) }
      ]
    },

    'red-dwarf': {
      bloomMul: 3.8, coreMul: 1.10,
      bloomStops: (a) => [
        { p: 0.00, c: `rgba(255, 130, 90,  ${0.45 * a})` },
        { p: 0.40, c: `rgba(200, 60, 30,   ${0.18 * a})` },
        { p: 1.00, c: 'rgba(140, 30, 10, 0)' }
      ],
      coreStops: (a, primary) => [
        { p: 0.00, c: `rgba(255, 200, 160, ${a})` },
        { p: 0.45, c: `rgba(220, 90, 50,   ${a})` },
        { p: 1.00, c: hexA(primary, 0) }
      ]
    },

    'white-dwarf': {
      bloomMul: 3.2, coreMul: 1.55,
      bloomStops: (a) => [
        { p: 0.00, c: `rgba(255, 255, 255, ${0.80 * a})` },
        { p: 0.45, c: `rgba(200, 220, 255, ${0.30 * a})` },
        { p: 1.00, c: 'rgba(120, 150, 220, 0)' }
      ],
      coreStops: (a) => [
        { p: 0.00, c: `rgba(255, 255, 255, ${a})` },
        { p: 0.55, c: `rgba(225, 235, 255, ${a})` },
        { p: 1.00, c: 'rgba(180, 200, 255, 0)' }
      ]
    },

    'neutron-star': {
      bloomMul: 5.0, coreMul: 1.8,
      bloomStops: (a) => [
        { p: 0.00, c: `rgba(230, 230, 255, ${0.85 * a})` },
        { p: 0.30, c: `rgba(160, 140, 255, ${0.40 * a})` },
        { p: 0.70, c: `rgba(90,  60, 200,  ${0.12 * a})` },
        { p: 1.00, c: 'rgba(40, 20, 120, 0)' }
      ],
      coreStops: (a) => [
        { p: 0.00, c: `rgba(255, 255, 255, ${a})` },
        { p: 0.40, c: `rgba(220, 220, 255, ${a})` },
        { p: 1.00, c: 'rgba(180, 160, 255, 0)' }
      ]
    },

    'black-hole': {
      // Special — accretion disk handled separately in render.js.
      accretion: true,
      diskMul: 3.6,
      haloMul: 6.0
    }
  };

  // ─── Type registries ───
  const STAR_TYPES = [
    {
      id: 'sun', weight: 0.18,
      nameZh: '类日恒星', altName: '主序', labelChar: '日',
      primaryColor: '#F5C04A',
      sizeRange: [4.5, 6.5], maxRange: [8, 10],
      detailFactor: 0.30,
      rotDays: [20, 35],
      diamRange: [1.2e6, 1.8e6], massRange: [1.5e30, 3e30],
      tempLabel: '约 5300 ~ 6000 ℃',
      taglines: ['平静燃烧的中年', '黄白色的稳态', '主序之上']
    },
    {
      id: 'red-giant', weight: 0.16,
      nameZh: '红巨星', altName: '红巨', labelChar: '巨',
      primaryColor: '#FF5C2A',
      sizeRange: [7, 11], maxRange: [12, 14],
      detailFactor: 0.42,
      rotDays: [80, 200],
      diamRange: [1e8, 5e8], massRange: [2e30, 1.5e31],
      tempLabel: '约 2500 ~ 3500 ℃',
      taglines: ['膨胀的暮年', '红色暮光', '行将熄灭的庞然', '吞没内行星的躯壳']
    },
    {
      id: 'blue-giant', weight: 0.10,
      nameZh: '蓝巨星', altName: '蓝巨', labelChar: '炽',
      primaryColor: '#A8D8FF',
      sizeRange: [6.5, 9], maxRange: [10, 12],
      detailFactor: 0.36,
      rotDays: [3, 15],
      diamRange: [8e6, 4e7], massRange: [3e31, 6e31],
      tempLabel: '约 25000 ~ 45000 ℃',
      taglines: ['短促的炽烈', '主序顶端', '终将以超新星谢幕']
    },
    {
      id: 'red-dwarf', weight: 0.22,
      nameZh: '红矮星', altName: '红矮', labelChar: '矮',
      primaryColor: '#D04B30',
      sizeRange: [3, 4.5], maxRange: [4.5, 6],
      detailFactor: 0.22,
      rotDays: [10, 60],
      diamRange: [2e5, 7e5], massRange: [1.5e29, 1e30],
      tempLabel: '约 2500 ~ 4000 ℃',
      taglines: ['静谧的长寿者', '低光的暗红', '宇宙中最常见的恒星']
    },
    {
      id: 'white-dwarf', weight: 0.10,
      nameZh: '白矮星', altName: '白矮', labelChar: '白',
      primaryColor: '#E8EEFF',
      sizeRange: [1.5, 2.5], maxRange: [2.5, 3.5],
      detailFactor: 0.16,
      rotDays: [0.001, 1],
      diamRange: [6e3, 1.5e4], massRange: [1e30, 2e30],
      tempLabel: '约 8000 ~ 100000 ℃',
      taglines: ['坍缩的灰烬', '钻石般的密度核心', '熄火中的余温']
    },
    {
      id: 'neutron-star', weight: 0.10,
      nameZh: '中子星', altName: '中子', labelChar: '中',
      primaryColor: '#C0B8FF',
      sizeRange: [1.0, 1.6], maxRange: [1.6, 2.2],
      detailFactor: 0.14,
      rotDays: [0.00001, 0.001],
      diamRange: [10, 30], massRange: [3e30, 5e30],
      tempLabel: '约 600000 ℃',
      taglines: ['极速旋转的灯塔', '宇宙中最致密的物质态', '脉冲呼吸']
    },
    {
      id: 'black-hole', weight: 0.14,
      nameZh: '黑洞', altName: '深渊', labelChar: '渊',
      primaryColor: '#FFB060',
      sizeRange: [4, 7], maxRange: [7, 10],
      // detailFactor is interpreted as event-horizon radius / viewport-width;
      // the full disk + halo extend ~8× this around the BH.
      detailFactor: 0.06,
      rotDays: [0.1, 10],
      diamRange: [5, 5e5], massRange: [1e31, 1e34],
      tempLabel: '事件视界内 · 不可观测',
      taglines: ['吞噬一切光的深渊', '吸积盘的灼烈环', '时空的褶皱']
    }
  ];

  const PLANET_TYPES = [
    {
      id: 'terrestrial', weight: 0.30,
      nameZh: '类地行星', labelChar: '地',
      colors: ['#A87858', '#B8AFA0', '#9F8A6C', '#7A6B58', '#C2A47C'],
      sizeRange: [0.55, 1.15], maxRange: [1.2, 1.8],
      detailFactor: [0.18, 0.28],
      eccRange: [0.0, 0.20],
      surface: (rng, color) => ({
        type: 'noise', seed: rng.int(1, 10000),
        craterDensity: rng.float(0.25, 0.5),
        polarBright: rng.float(0.15, 0.35)
      }),
      taglines: ['岩石的世界', '尘土与裂谷', '类地疆土']
    },
    {
      id: 'gas-giant', weight: 0.18,
      nameZh: '气态巨行星', labelChar: '气',
      colors: ['#D9A878', '#C68A53', '#A87044', '#D6BC85', '#B8723C'],
      sizeRange: [2.5, 3.6], maxRange: [3.6, 5],
      detailFactor: [0.30, 0.38],
      eccRange: [0.0, 0.08],
      surface: (rng, color) => ({
        type: 'bands',
        bands: makeRandomBands(rng, 5 + rng.int(0, 4)),
        storms: rng.bool(0.5)
          ? [{ lon: rng.float(-160, 160), lat: rng.float(-40, 40),
               rLon: rng.float(15, 28), rLat: rng.float(5, 10),
               intensity: 1.0, color: shiftColor(color, -40) }]
          : []
      }),
      taglines: ['流体的暴风', '不见底的大气', '木星之亲']
    },
    {
      id: 'ice-giant', weight: 0.14,
      nameZh: '冰巨星', labelChar: '冰',
      colors: ['#7DD3D8', '#82C8C6', '#5BA8D9', '#A0D8E5'],
      sizeRange: [1.6, 2.4], maxRange: [2.4, 3.4],
      detailFactor: [0.24, 0.30],
      eccRange: [0.0, 0.06],
      surface: (rng, color) => ({
        type: 'bands',
        bands: makeRandomBands(rng, 3 + rng.int(0, 2), 0.5, 0.85),
        storms: []
      }),
      taglines: ['甲烷与冰的低温世界', '苍蓝的远疆']
    },
    {
      id: 'lava', weight: 0.10,
      nameZh: '熔岩世界', labelChar: '炎',
      colors: ['#C95F3B', '#D9532A', '#A83C20', '#E66B30'],
      sizeRange: [0.5, 1.05], maxRange: [1.0, 1.6],
      detailFactor: [0.18, 0.26],
      eccRange: [0.0, 0.30],
      surface: (rng, color) => ({
        type: 'noise', seed: rng.int(1, 10000),
        craterDensity: rng.float(0.55, 0.75)
      }),
      taglines: ['沸腾的岩浆海', '昼面 1500℃', '太接近恒星的代价']
    },
    {
      id: 'ocean', weight: 0.12,
      nameZh: '海洋世界', labelChar: '渊',
      colors: ['#3A6FCC', '#2A4AAE', '#487AD3', '#1E5BB8'],
      sizeRange: [0.7, 1.3], maxRange: [1.3, 2.0],
      detailFactor: [0.20, 0.28],
      eccRange: [0.0, 0.10],
      surface: (rng, color) => ({
        type: 'noise', seed: rng.int(1, 10000),
        swirlBands: 3 + rng.int(0, 3),
        cloudiness: rng.float(0.3, 0.6)
      }),
      taglines: ['全球性的洋面', '深海之下的未知']
    },
    {
      id: 'frozen', weight: 0.10,
      nameZh: '冰冻世界', labelChar: '霜',
      colors: ['#D8E0EA', '#C5D5E0', '#A8B8C8', '#E0E8F0'],
      sizeRange: [0.45, 0.95], maxRange: [1.0, 1.5],
      detailFactor: [0.16, 0.24],
      eccRange: [0.05, 0.25],
      surface: (rng, color) => ({
        type: 'noise', seed: rng.int(1, 10000),
        craterDensity: rng.float(0.20, 0.40),
        polarBright: rng.float(0.45, 0.70)
      }),
      taglines: ['永夜的冰封', '甲烷雪覆盖一切']
    },
    {
      id: 'desert', weight: 0.06,
      nameZh: '沙漠世界', labelChar: '漠',
      colors: ['#E8C547', '#D9A85C', '#C2924A', '#A87830'],
      sizeRange: [0.6, 1.1], maxRange: [1.1, 1.7],
      detailFactor: [0.18, 0.26],
      eccRange: [0.0, 0.15],
      surface: (rng, color) => ({
        type: 'noise', seed: rng.int(1, 10000),
        swirlBands: 4 + rng.int(0, 4),
        cloudiness: rng.float(0.1, 0.3)
      }),
      taglines: ['风蚀的沙海', '极端干燥的赤色']
    }
  ];

  // ─── Naming pools ───
  const STAR_NAME_PREFIXES = ['HD', 'Gliese', 'Kepler', 'TRAPPIST', 'Wolf', 'TOI', 'WASP', 'HIP'];
  const STAR_CHINESE_REGISTRY = [
    '大角', '心宿', '参宿', '北辰', '织女', '牛郎', '北落师门', '天狼',
    '毕宿', '南河', '北河', '紫微', '天枢', '天璇', '天玑', '天权',
    '玉衡', '开阳', '摇光', '角宿', '亢宿', '氐宿', '房宿', '尾宿',
    '箕宿', '斗宿', '女宿', '虚宿', '危宿', '室宿', '壁宿', '奎宿',
    '娄宿', '胃宿', '昴宿', '觜宿', '井宿', '鬼宿', '柳宿', '星宿',
    '张宿', '翼宿', '轸宿', '太微', '天市', '招摇', '玄武', '朱雀'
  ];
  const PLANET_LETTERS = ['b','c','d','e','f','g','h','i','j','k'];

  // ─── Helper utilities ───
  function makeRng(seed) {
    const base = m.mulberry32(seed);
    return {
      float: (a, b) => a + base() * (b - a),
      int: (a, b) => Math.floor(a + base() * (b - a + 1)),
      bool: (p) => base() < p,
      pick: (arr) => arr[Math.floor(base() * arr.length)]
    };
  }

  function weightedPick(types, rng) {
    let total = 0;
    for (const t of types) total += t.weight;
    let pick = rng.float(0, total);
    for (const t of types) {
      pick -= t.weight;
      if (pick <= 0) return t;
    }
    return types[types.length - 1];
  }

  function hexA(hex, a) {
    if (a <= 0) return 'rgba(0,0,0,0)';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }

  function shiftColor(hex, delta) {
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + delta));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + delta));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + delta));
    return '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
  }

  function makeRandomBands(rng, count, minIntensity, maxIntensity) {
    minIntensity = minIntensity != null ? minIntensity : 0.45;
    maxIntensity = maxIntensity != null ? maxIntensity : 0.95;
    const bands = [];
    const step = 180 / count;
    for (let i = 0; i < count; i++) {
      const from = -90 + i * step;
      const to = from + step;
      bands.push({ from, to, intensity: rng.float(minIntensity, maxIntensity) });
    }
    return bands;
  }

  function fmtScientific(v) {
    return v.toExponential(2);
  }

  // ─── Star body construction ───
  function buildStarBody(rng, type) {
    const sizeF = rng.float(...type.sizeRange);
    const sizeM = rng.float(...type.maxRange);
    const nameZh = rng.pick(STAR_CHINESE_REGISTRY);
    const prefix = rng.pick(STAR_NAME_PREFIXES);
    const num = rng.int(10, 9999);
    const nameEn = `${prefix}-${num}`;
    return {
      id: 'star_0',
      starType: type.id,
      nameZh, nameEn,
      labelChar: type.labelChar,
      altName: type.altName + ' · ' + nameZh,
      primaryColor: type.primaryColor,
      sprite: '☀',
      spriteFactor: sizeF,
      spriteMax: sizeM,
      distanceAU: 0, displayDistance: 0,
      eccentricity: 0,
      orbitalPeriodYears: 0,
      visualOrbitSec: 0,
      rotationPeriodDays: rng.float(...type.rotDays),
      diameterKm: rng.float(...type.diamRange),
      massKg: rng.float(...type.massRange),
      surfaceTempC: type.tempLabel,
      discoverer: '巡天观测 · 编号 #' + rng.int(100, 99999),
      discoveryYear: rng.int(1960, 2030),
      // Random systems have no real history — skip the "发现与探测" panel.
      events: [],
      detailRadiusFactor: type.detailFactor,
      tagline: rng.pick(type.taglines),
      hasRings: false,
      moons: [],
      surface: { type: 'star' },
      phaseOffset: 0
    };
    // visualRotSec computed below
  }

  // ─── Planet body construction ───
  function buildPlanetBody(rng, idx, parent, distance) {
    const type = weightedPick(PLANET_TYPES, rng);
    const color = rng.pick(type.colors);
    const sizeF = rng.float(...type.sizeRange);
    const sizeM = rng.float(...type.maxRange);
    const detailF = rng.float(type.detailFactor[0], type.detailFactor[1]);
    const ecc = rng.float(...type.eccRange);
    const orbitYears = Math.pow(distance / 21, 1.5) * rng.float(0.85, 1.15); // crude Kepler-ish
    const rotSign = rng.bool(0.15) ? -1 : 1;     // 15% chance of retrograde
    const rotDays = rng.float(0.5, 80) * rotSign;
    const letter = PLANET_LETTERS[idx] || ('z' + idx);
    const nameEn = `${parent.nameEn} ${letter}`;
    const nameZh = `${parent.nameZh}·${idx + 1}号`;
    const hasRings = type.id === 'gas-giant' && rng.bool(0.45);

    return {
      id: 'p_' + idx,
      nameZh, nameEn,
      labelChar: type.labelChar,
      altName: type.nameZh,
      primaryColor: color,
      sprite: 'o',
      spriteFactor: sizeF,
      spriteMax: sizeM,
      distanceAU: distance / 21, // pseudo AU vs Earth=1 → display 21
      displayDistance: distance,
      eccentricity: ecc,
      orbitalPeriodYears: orbitYears,
      visualOrbitSec: NS.visOrbit(orbitYears),
      rotationPeriodDays: rotDays,
      visualRotSec: NS.visRot(rotDays),
      diameterKm: rng.float(3000, 150000) * sizeF,
      massKg: rng.float(1e23, 2e27) * sizeF,
      surfaceTempC: planetTempLabel(rng, type, distance, parent),
      discoverer: rng.pick(['凌日法', '视向速度法', '直接成像', '微引力透镜', '天文测量']) +
                  ' · 编号 #' + rng.int(100, 99999),
      discoveryYear: rng.int(2005, 2030),
      events: [],
      detailRadiusFactor: detailF,
      tagline: rng.pick(type.taglines),
      hasRings,
      ringColor: hasRings ? shiftColor(color, 20) : undefined,
      moons: [],
      surface: type.surface(rng, color),
      planetType: type.id
    };
  }

  function planetTempLabel(rng, type, distance, parent) {
    if (type.id === 'lava') return '约 ' + rng.int(900, 1700) + ' ℃';
    if (type.id === 'frozen') return '约 ' + rng.int(-220, -150) + ' ℃';
    if (type.id === 'terrestrial') return '约 ' + rng.int(-80, 60) + ' ℃';
    if (type.id === 'gas-giant') return '约 ' + rng.int(-150, -80) + ' ℃ (云顶)';
    if (type.id === 'ice-giant') return '约 ' + rng.int(-220, -180) + ' ℃ (云顶)';
    if (type.id === 'ocean') return '约 ' + rng.int(-10, 30) + ' ℃';
    if (type.id === 'desert') return '约 ' + rng.int(20, 70) + ' ℃';
    return '约 ' + rng.int(-100, 50) + ' ℃';
  }

  // ─── System assembly ───
  function generateSystem(seed) {
    const rng = makeRng(seed);
    const starType = weightedPick(STAR_TYPES, rng);
    const star = buildStarBody(rng, starType);
    star.visualRotSec = NS.visRot(star.rotationPeriodDays);
    star.phaseOffset = 0;

    // Spacing: start clear of the star's bloom, then Titius-Bode-ish.
    const N = rng.int(4, 8);
    const planets = [];
    let dist = 12 + star.spriteFactor * 1.6 + rng.float(0, 6);
    for (let i = 0; i < N; i++) {
      const planet = buildPlanetBody(rng, i, star, dist);
      planet.phaseOffset = i * 0.731 + rng.float(0, 0.5);
      planets.push(planet);
      dist *= rng.float(1.32, 1.85);
      if (dist > 240) break; // outer bound matching our scale
    }

    // Optional asteroid belt between two non-adjacent planets
    let asteroids = NS.ORIGINAL_ASTEROIDS;
    if (rng.bool(0.55) && planets.length >= 4) {
      const gapIdx = rng.int(1, planets.length - 2);
      const lo = planets[gapIdx].displayDistance;
      const hi = planets[gapIdx + 1].displayDistance;
      asteroids = {
        minAU: lo + (hi - lo) * 0.30,
        maxAU: lo + (hi - lo) * 0.70,
        count: rng.int(150, 320),
        chars: ['.', '·', ','],
        color: '#54514B',
        baseAlpha: rng.float(0.32, 0.5),
        angularSpeed: 0.00003 * rng.float(0.5, 1.5),
        seed: rng.int(1, 9999)
      };
    } else if (rng.bool(0.4)) {
      asteroids = null;
    }

    return {
      bodies: [star, ...planets],
      asteroids,
      meta: {
        seed,
        starName: star.nameEn,
        starNameZh: star.nameZh,
        starType: starType.id
      }
    };
  }

  // Public API
  NS.generateRandomSystem = function (seed) {
    if (seed == null) seed = Math.floor(Math.random() * 4294967295);
    return generateSystem(seed);
  };

  // Replace the live solar system with a generated one. Resets the scene back
  // to ENTRY_ANIM so the new bodies fade in cascade-style.
  NS.applySystem = function (scene, system) {
    NS.BODIES = system.bodies;
    NS.ASTEROIDS = system.asteroids || null;
    if (NS.render && NS.render.invalidateAsteroids) NS.render.invalidateAsteroids();
    scene.state = NS.scenes.STATE.ENTRY_ANIM;
    scene.stateT = 0;
    scene.currentBody = null;
    scene.transitionTargetBody = null;
    scene.transitionProgress = 0;
    scene.hoveredBody = null;
    scene.hoveredCellPos = null;
    scene.appearProgress = {};
    for (const b of NS.BODIES) scene.appearProgress[b.id] = 0;
    scene.starFade = 1;       // stars already faded in earlier
    scene.titleAlpha = 0;
    scene.hintAlpha = 1;
    scene.systemMeta = system.meta || null;
  };

  // Snapshot the original solar system on first load so callers can later
  // reset back to it (this becomes the implicit "home" system).
  NS.ORIGINAL_SYSTEM = {
    bodies: NS.ORIGINAL_BODIES.slice(),
    asteroids: NS.ORIGINAL_ASTEROIDS,
    meta: null
  };
})(window.SolarSys);
