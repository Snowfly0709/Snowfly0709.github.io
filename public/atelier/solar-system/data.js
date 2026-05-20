// Planet/Sun data table. Real astronomical values for distance & rotation.
// Each body declares one of four surface types used by the dot-matrix renderer:
//   continents → polygons over (lon, lat)
//   bands      → horizontal latitude stripes with optional storm spots
//   noise      → seeded crater/cloud field
//   star       → uniformly bright with corona
window.SolarSys = window.SolarSys || {};

(function (NS) {
  // Ecliptic foreshortening — the orbital plane is squashed vertically by this
  // factor when projected to the screen. 0.5 = top-down with mild tilt;
  // 0.06 = near-edge-on observer, orbits read as nearly horizontal lines.
  NS.VIEW_SQUASH = 0.06;

  // Orbital plane tilt — rotation applied AFTER squashing, pivoting on the sun.
  // Negative angle (canvas convention) tilts the right side of the orbit UP
  // and left side DOWN, producing a "right-top → left-bottom" diagonal.
  NS.VIEW_TILT = -20 * Math.PI / 180;

  // Visual time scaling. Multipliers doubled relative to v5 — overall motion
  // (both self-rotation and revolution) plays at half the previous speed.
  const visRot = (realDays) => Math.sign(realDays) * Math.pow(Math.abs(realDays), 0.5) * 8;
  const visOrbit = (realYears) => Math.sign(realYears) * Math.pow(Math.abs(realYears), 0.55) * 36;

  // ── Surface polygon banks (each polygon is [[lon, lat], ...] in degrees) ───────
  // Deliberately blocky — the dot-matrix renderer thins detail anyway.

  const EARTH_LAND = [
    // Afro-Eurasia (huge composite blob)
    [[-10,36],[5,38],[15,42],[28,46],[42,48],[55,50],[70,55],[90,60],[105,55],[120,50],
     [130,42],[140,40],[145,32],[140,22],[130,15],[120,10],[110,5],[100,-5],[95,-10],
     [90,-12],[85,-5],[75,8],[65,12],[55,15],[45,12],[40,18],[35,28],[28,32],[20,34],
     [12,34],[5,33],[0,33],[-5,34],[-8,34],[-10,36]],
    // Africa lower lobe
    [[5,33],[12,30],[22,20],[35,15],[40,5],[42,-5],[40,-15],[35,-22],[28,-30],[20,-35],
     [12,-34],[5,-28],[0,-20],[-5,-10],[-8,0],[-10,10],[-8,20],[-5,28],[0,32],[5,33]],
    // North America
    [[-160,68],[-140,72],[-120,72],[-100,68],[-80,60],[-70,50],[-65,42],[-72,35],
     [-80,28],[-90,20],[-100,18],[-105,22],[-115,30],[-125,38],[-130,48],[-135,55],
     [-145,60],[-155,62],[-160,68]],
    // South America
    [[-78,12],[-68,8],[-58,-2],[-50,-12],[-45,-22],[-42,-32],[-50,-42],[-58,-50],
     [-68,-52],[-72,-45],[-75,-35],[-78,-25],[-80,-15],[-80,-5],[-78,5],[-78,12]],
    // Australia
    [[115,-12],[130,-12],[145,-18],[152,-28],[148,-38],[138,-40],[125,-36],[115,-30],
     [112,-22],[115,-12]],
    // Antarctica band
    [[-180,-68],[180,-68],[180,-82],[-180,-82],[-180,-68]],
    // Greenland
    [[-50,82],[-30,80],[-20,72],[-30,64],[-48,62],[-58,68],[-58,78],[-50,82]]
  ];

  const MARS_LAND = [
    // Tharsis bulge (volcanoes)
    [[-130,20],[-110,25],[-95,18],[-95,0],[-110,-8],[-130,-2],[-140,8],[-130,20]],
    // Arabia Terra
    [[-20,30],[10,32],[28,22],[25,5],[5,-3],[-15,5],[-25,18],[-20,30]],
    // Hellas basin rim (low albedo ring read as 'land' here for visual richness)
    [[55,-30],[75,-30],[88,-40],[78,-55],[58,-55],[48,-42],[55,-30]],
    // Polar caps
    [[-180,68],[180,68],[180,90],[-180,90],[-180,68]],
    [[-180,-72],[180,-72],[180,-90],[-180,-90],[-180,-72]]
  ];

  // Tombaugh Regio (heart) on Pluto — visible on the anti-Charon hemisphere.
  const PLUTO_HEART = [
    [[-30,15],[-10,30],[10,30],[30,15],[35,0],[25,-15],[5,-30],[0,-38],
     [-5,-30],[-25,-15],[-35,0],[-30,15]]
  ];

  NS.BODIES = [
    {
      id: 'sun',
      nameZh: '太阳', nameEn: 'Sun', labelChar: '日',
      primaryColor: '#F5C04A',
      coronaColor:  '#FF8A1F',
      surface: { type: 'star' },
      sprite: '☀', spriteFactor: 6, spriteMax: 9,
      distanceAU: 0, displayDistance: 0,
      eccentricity: 0,
      orbitalPeriodYears: 0, visualOrbitSec: 0,
      rotationPeriodDays: 25, visualRotSec: visRot(25),
      diameterKm: 1392700, massKg: 1.989e30,
      surfaceTempC: '约 5500 ℃ (光球)',
      discoverer: '远古已知', discoveryYear: null,
      events: [
        { year: 1610, text: '伽利略首次记录黑子' },
        { year: 1995, text: 'SOHO 卫星升空，持续观测日冕' },
        { year: 2021, text: '帕克探测器首次进入日冕' }
      ],
      detailRadiusFactor: 0.30,
      tagline: '系之心 · 万象之源',
      altName: '日 · 大明',
      hasRings: false,
      moons: []
    },
    {
      id: 'mercury',
      nameZh: '水星', nameEn: 'Mercury', labelChar: '水',
      primaryColor: '#B8AFA0',
      surface: { type: 'noise', seed: 202, craterDensity: 0.42, polarBright: 0.30 },
      sprite: '·', spriteFactor: 0.45, spriteMax: 1.0,
      distanceAU: 0.39, displayDistance: 12,
      eccentricity: 0.2056,
      orbitalPeriodYears: 0.2408, visualOrbitSec: visOrbit(0.2408),
      rotationPeriodDays: 58.6, visualRotSec: visRot(58.6),
      diameterKm: 4879, massKg: 3.301e23,
      surfaceTempC: '-173 ~ 427 ℃',
      discoverer: '远古已知', discoveryYear: null,
      events: [
        { year: 1631, text: '伽桑迪首次观测凌日' },
        { year: 1974, text: '水手 10 号三度飞掠' },
        { year: 2011, text: '信使号进入水星轨道' }
      ],
      detailRadiusFactor: 0.22,
      tagline: '辰星 · 最近太阳的灼裂之地',
      altName: '辰星',
      hasRings: false,
      moons: []
    },
    {
      id: 'venus',
      nameZh: '金星', nameEn: 'Venus', labelChar: '金',
      primaryColor: '#D9A85C',
      surface: { type: 'noise', seed: 303, swirlBands: 6, cloudiness: 0.55 },
      sprite: 'o', spriteFactor: 1.0, spriteMax: 2,
      distanceAU: 0.72, displayDistance: 22,
      eccentricity: 0.0068,
      orbitalPeriodYears: 0.6152, visualOrbitSec: visOrbit(0.6152),
      rotationPeriodDays: -243, visualRotSec: visRot(-243),
      diameterKm: 12104, massKg: 4.867e24,
      surfaceTempC: '约 464 ℃',
      discoverer: '远古已知', discoveryYear: null,
      events: [
        { year: 1610, text: '伽利略发现金星相位' },
        { year: 1970, text: '金星 7 号软着陆，传回首批数据' },
        { year: 1990, text: '麦哲伦号雷达测绘全表面' }
      ],
      detailRadiusFactor: 0.26,
      tagline: '太白 · 启明 · 长庚',
      altName: '太白 · 启明',
      hasRings: false,
      moons: []
    },
    {
      id: 'earth',
      nameZh: '地球', nameEn: 'Earth', labelChar: '地',
      primaryColor: '#5BA8D9',
      surface: { type: 'continents', polygons: EARTH_LAND, cloudiness: 0.10, polarCaps: true },
      sprite: 'O', spriteFactor: 1.0, spriteMax: 2,
      distanceAU: 1.0, displayDistance: 35,
      eccentricity: 0.0167,
      orbitalPeriodYears: 1.0, visualOrbitSec: visOrbit(1.0),
      rotationPeriodDays: 1.0, visualRotSec: visRot(1.0),
      diameterKm: 12742, massKg: 5.972e24,
      surfaceTempC: '约 15 ℃ (平均)',
      discoverer: '——', discoveryYear: null,
      events: [],
      detailRadiusFactor: 0.28,
      tagline: '寄蜉蝣于天地，渺沧海之一粟  ——苏轼《赤壁赋》',
      altName: '后土 · 大地',
      hasRings: false,
      moons: [
        { name: '月', distanceCells: 3, periodSec: 6, char: '·', color: '#CCCCCC' }
      ]
    },
    {
      id: 'mars',
      nameZh: '火星', nameEn: 'Mars', labelChar: '火',
      primaryColor: '#C95F3B',
      surface: { type: 'continents', polygons: MARS_LAND, cloudiness: 0.03, polarCaps: false },
      sprite: 'o', spriteFactor: 0.7, spriteMax: 1.4,
      distanceAU: 1.52, displayDistance: 50,
      eccentricity: 0.0934,
      orbitalPeriodYears: 1.881, visualOrbitSec: visOrbit(1.881),
      rotationPeriodDays: 1.026, visualRotSec: visRot(1.026),
      diameterKm: 6779, massKg: 6.417e23,
      surfaceTempC: '-87 ~ -5 ℃',
      discoverer: '远古已知', discoveryYear: null,
      events: [
        { year: 1610, text: '伽利略首次望远镜观测' },
        { year: 1965, text: '水手 4 号传回首张近距图像' },
        { year: 2021, text: '祝融号 · 毅力号同年着陆' }
      ],
      detailRadiusFactor: 0.24,
      tagline: '荧惑 · 锈红的远古河床',
      altName: '荧惑',
      hasRings: false,
      moons: []
    },
    {
      id: 'jupiter',
      nameZh: '木星', nameEn: 'Jupiter', labelChar: '木',
      primaryColor: '#D9A878',
      surface: {
        type: 'bands',
        bands: [
          { from:  60, to:  90, intensity: 0.55 },
          { from:  30, to:  60, intensity: 0.85 },
          { from:  10, to:  30, intensity: 0.45 },
          { from: -10, to:  10, intensity: 0.90 },
          { from: -30, to: -10, intensity: 0.50 },
          { from: -60, to: -30, intensity: 0.80 },
          { from: -90, to: -60, intensity: 0.55 }
        ],
        storms: [{ lon: 45, lat: -22, rLon: 22, rLat: 8, intensity: 1.0, color: '#A4413A' }]
      },
      sprite: '◉', spriteFactor: 3.0, spriteMax: 4,
      distanceAU: 5.20, displayDistance: 80,
      eccentricity: 0.0489,
      orbitalPeriodYears: 11.86, visualOrbitSec: visOrbit(11.86),
      rotationPeriodDays: 0.4135, visualRotSec: visRot(0.4135),
      diameterKm: 139820, massKg: 1.898e27,
      surfaceTempC: '约 -108 ℃ (云顶)',
      discoverer: '远古已知', discoveryYear: null,
      events: [
        { year: 1610, text: '伽利略发现四颗大卫星' },
        { year: 1979, text: '旅行者 1 号飞掠，发现木星环' },
        { year: 2016, text: '朱诺号进入极地轨道' }
      ],
      detailRadiusFactor: 0.32,
      tagline: '岁星 · 气体的暴风之王',
      altName: '岁星',
      hasRings: false,
      moons: [
        { name: '木卫一', distanceCells: 3, periodSec: 4,  char: '·', color: '#E8DC6C' },
        { name: '木卫二', distanceCells: 4, periodSec: 6,  char: '·', color: '#CFC4A8' },
        { name: '木卫三', distanceCells: 5, periodSec: 9,  char: '·', color: '#A89886' },
        { name: '木卫四', distanceCells: 7, periodSec: 14, char: '·', color: '#7A6F5C' }
      ]
    },
    {
      id: 'saturn',
      nameZh: '土星', nameEn: 'Saturn', labelChar: '土',
      primaryColor: '#D6BC85',
      surface: {
        type: 'bands',
        bands: [
          { from:  60, to:  90, intensity: 0.55 },
          { from:  20, to:  60, intensity: 0.75 },
          { from: -20, to:  20, intensity: 0.90 },
          { from: -60, to: -20, intensity: 0.75 },
          { from: -90, to: -60, intensity: 0.55 }
        ],
        storms: []
      },
      sprite: '⊙', spriteFactor: 2.7, spriteMax: 3.7,
      distanceAU: 9.54, displayDistance: 115,
      eccentricity: 0.0565,
      orbitalPeriodYears: 29.46, visualOrbitSec: visOrbit(29.46),
      rotationPeriodDays: 0.444, visualRotSec: visRot(0.444),
      diameterKm: 116460, massKg: 5.683e26,
      surfaceTempC: '约 -139 ℃ (云顶)',
      discoverer: '远古已知', discoveryYear: null,
      events: [
        { year: 1610, text: '伽利略首次见其"双耳"形态' },
        { year: 1655, text: '惠更斯辨认出真正的环结构' },
        { year: 2004, text: '卡西尼号进入轨道，运行至 2017' }
      ],
      detailRadiusFactor: 0.30,
      tagline: '镇星 · 戴环者',
      altName: '镇星',
      hasRings: true,
      ringColor: '#C9A765',
      moons: []
    },
    {
      id: 'uranus',
      nameZh: '天王星', nameEn: 'Uranus', labelChar: '天',
      primaryColor: '#82C8C6',
      surface: {
        type: 'bands',
        bands: [
          { from:  45, to:  90, intensity: 0.60 },
          { from: -45, to:  45, intensity: 0.85 },
          { from: -90, to: -45, intensity: 0.60 }
        ],
        storms: []
      },
      sprite: 'o', spriteFactor: 1.75, spriteMax: 2.7,
      distanceAU: 19.19, displayDistance: 150,
      eccentricity: 0.0463,
      orbitalPeriodYears: 84.01, visualOrbitSec: visOrbit(84.01),
      rotationPeriodDays: -0.7183, visualRotSec: visRot(-0.7183),
      diameterKm: 50724, massKg: 8.681e25,
      surfaceTempC: '约 -195 ℃ (云顶)',
      discoverer: '威廉·赫歇尔', discoveryYear: 1781,
      events: [
        { year: 1781, text: '赫歇尔在巴斯首次确认' },
        { year: 1977, text: '掩星观测意外发现环系' },
        { year: 1986, text: '旅行者 2 号唯一近距飞掠' }
      ],
      detailRadiusFactor: 0.26,
      tagline: '横躺者 · 冰冷的青蓝',
      altName: '天王',
      hasRings: false,
      moons: []
    },
    {
      id: 'neptune',
      nameZh: '海王星', nameEn: 'Neptune', labelChar: '海',
      primaryColor: '#3A6FCC',
      surface: {
        type: 'bands',
        bands: [
          { from:  40, to:  90, intensity: 0.60 },
          { from: -40, to:  40, intensity: 0.88 },
          { from: -90, to: -40, intensity: 0.60 }
        ],
        storms: [{ lon: -30, lat: -20, rLon: 18, rLat: 7, intensity: 1.0, color: '#1E3B8C' }]
      },
      sprite: 'o', spriteFactor: 1.75, spriteMax: 2.7,
      distanceAU: 30.07, displayDistance: 185,
      eccentricity: 0.0086,
      orbitalPeriodYears: 164.8, visualOrbitSec: visOrbit(164.8),
      rotationPeriodDays: 0.6713, visualRotSec: visRot(0.6713),
      diameterKm: 49244, massKg: 1.024e26,
      surfaceTempC: '约 -201 ℃ (云顶)',
      discoverer: '伽勒 · 据勒维耶推算', discoveryYear: 1846,
      events: [
        { year: 1846, text: '据数学预言被直接观测确认' },
        { year: 1989, text: '旅行者 2 号飞掠，记录大暗斑' },
        { year: 2011, text: '完成发现后的首个公转周期' }
      ],
      detailRadiusFactor: 0.26,
      tagline: '深渊之蓝 · 算笔尖上的星',
      altName: '海王',
      hasRings: false,
      moons: []
    },
    {
      id: 'pluto',
      nameZh: '冥王星', nameEn: 'Pluto', labelChar: '冥',
      primaryColor: '#B59E84',
      surface: { type: 'continents', polygons: PLUTO_HEART, cloudiness: 0, polarCaps: true, polarSize: 0.20 },
      sprite: '·', spriteFactor: 0.38, spriteMax: 0.8,
      distanceAU: 39.48, displayDistance: 220,
      eccentricity: 0.2488,
      orbitalPeriodYears: 248, visualOrbitSec: visOrbit(248),
      rotationPeriodDays: -6.387, visualRotSec: visRot(-6.387),
      diameterKm: 2376, massKg: 1.309e22,
      surfaceTempC: '约 -229 ℃',
      discoverer: '克莱德·汤博', discoveryYear: 1930,
      events: [
        { year: 1930, text: '汤博在洛厄尔天文台发现' },
        { year: 2006, text: '重新分类为矮行星' },
        { year: 2015, text: '新视野号近距飞掠，拍下心形高原' }
      ],
      detailRadiusFactor: 0.20,
      tagline: '远疆的爱心 · 2006 年的告别',
      altName: '冥王',
      hasRings: false,
      moons: []
    }
  ];

  // Asteroid belt (sparse, monochrome) — sits between Mars (50) and Jupiter (80).
  NS.ASTEROIDS = {
    minAU: 60, maxAU: 72,
    count: 260,
    chars: ['.', '·', ','],
    color: '#54514B',
    baseAlpha: 0.42,
    angularSpeed: 0.00003,
    seed: 42
  };

  // Subtle background star field — no twinkle, no spectral palette.
  NS.STARS = {
    count: 110,
    chars: ['.', '·'],
    minAlpha: 0.10,
    maxAlpha: 0.42,
    seed: 7,
    color: '#9AA1AD'
  };

  // Celestial coordinate grid overlay — fades to nothing at edges.
  NS.GRID = {
    color: '#1B1E26',
    edgeFade: 0.55,
    alpha: 0.55,
    minorEvery: 8,   // cells
    majorEvery: 32,
    tickColor: '#3C414B'
  };

  // Rare ranging comet (kept, simplified).
  NS.COMET = {
    minInterval: 18000,
    maxInterval: 42000,
    durationMs: 1500,
    trailLen: 8,
    tailChars: ['.', ',', '-', '='],
    headChar: '*',
    color: '#D4D8E0'
  };

  NS.UI = {
    title: 'SOLAR · 太阳系',
    subtitle: '一份点阵观测笔记',
    hint: 'WHEEL · ZOOM    CLICK · INSPECT',
    detailHint: 'WHEEL OUT · RETURN',
    loading: 'LOADING'
  };

  // Assign a unique orbital phase offset so bodies don't all start along +x.
  NS.BODIES.forEach((b, i) => { b.phaseOffset = i * 0.731; });

  // Snapshot original system so the explorer can swap back to it later.
  NS.ORIGINAL_BODIES = NS.BODIES.slice();
  NS.ORIGINAL_ASTEROIDS = NS.ASTEROIDS;

  // Time-scaling helpers exposed for the random generator.
  NS.visRot = visRot;
  NS.visOrbit = visOrbit;
})(window.SolarSys);
