(() => {
  const checkBtn = document.getElementById('check');
  const result = document.getElementById('result');
  const rules = document.querySelector('.rules');
  if (!rules) return;

  const BOARD_N = 5;
  const LAYER_COLORS = ['#38bdf8', '#8b5cf6', '#f59e0b'];

  const copy = {
    es: {
      manual: 'Manual visual', close: 'Cerrar',
      guideTitle: 'Cómo atacan las reinas en 3D',
      guideIntro: 'Los ejemplos usan el mismo lenguaje visual del tablero. Una reina normal está permitida mientras no comparta una línea de ataque; cuando dos reinas se atacan, ambas aparecen marcadas como conflicto.',
      sameLayer: '1. En una sola capa', between: '2. Entre dos capas', through: '3. A través de varias capas',
      alone: 'Reina sola', row: 'Misma fila', column: 'Misma columna', diagonal: 'Misma diagonal',
      vertical: 'Misma posición', sideStep: 'Un paso al lado', layerDiagonal: 'Diagonal entre capas', safeOffset: 'No están alineadas',
      farVertical: 'Dos capas de distancia', farDiagonal: 'Diagonal a través de 3 capas',
      aloneText: 'Una reina sola no entra en conflicto.',
      rowText: 'Dos reinas en la misma fila se atacan. La fila completa es una línea de ataque.',
      columnText: 'Dos reinas en la misma columna se atacan. La columna completa queda alineada.',
      diagonalText: 'Si comparten una diagonal dentro de la capa, ambas están en conflicto.',
      verticalText: 'La misma casilla en la siguiente capa queda exactamente arriba o abajo.',
      sideStepText: 'Al subir una capa y avanzar una casilla lateralmente, continúan en una misma línea 3D.',
      layerDiagonalText: 'Subir una capa y avanzar una fila y una columna forma una diagonal 3D.',
      safeOffsetText: 'Si los desplazamientos no mantienen una misma línea, las reinas no se atacan.',
      farVerticalText: 'La distancia no rompe la línea: la misma posición sigue atacada aunque haya una capa intermedia.',
      farDiagonalText: 'Una diagonal puede continuar por la capa intermedia y atravesar varias capas.',
      safe: 'Sin conflicto', attack: 'Se atacan',
      queen: 'Reina', conflict: 'Reina en conflicto', line: 'Línea de ataque', layer: 'Capa',
      congrats: '¡Felicidades!', solved: 'Resolviste este reto correctamente.'
    },
    en: {
      manual: 'Visual guide', close: 'Close',
      guideTitle: 'How queens attack in 3D',
      guideIntro: 'The examples use the same visual language as the board. A normal queen is allowed while it does not share an attack line; when two queens attack each other, both are marked as conflicting.',
      sameLayer: '1. Within one layer', between: '2. Between two layers', through: '3. Across multiple layers',
      alone: 'Single queen', row: 'Same row', column: 'Same column', diagonal: 'Same diagonal',
      vertical: 'Same position', sideStep: 'One step sideways', layerDiagonal: 'Diagonal between layers', safeOffset: 'Not aligned',
      farVertical: 'Two layers apart', farDiagonal: 'Diagonal across 3 layers',
      aloneText: 'A single queen has no conflict.',
      rowText: 'Two queens on the same row attack each other. The full row is an attack line.',
      columnText: 'Two queens on the same column attack each other. The full column stays aligned.',
      diagonalText: 'If they share a diagonal within the layer, both queens are conflicting.',
      verticalText: 'The same square on the next layer lies directly above or below.',
      sideStepText: 'Moving up one layer and one square sideways keeps both queens on one 3D line.',
      layerDiagonalText: 'Moving up one layer, one row and one column forms a 3D diagonal.',
      safeOffsetText: 'If the offsets do not stay on one line, the queens do not attack each other.',
      farVerticalText: 'Distance does not break the line: the same position remains attacked with a layer in between.',
      farDiagonalText: 'A diagonal can continue through the middle layer and cross multiple layers.',
      safe: 'No conflict', attack: 'They attack',
      queen: 'Queen', conflict: 'Conflicting queen', line: 'Attack line', layer: 'Layer',
      congrats: 'Congratulations!', solved: 'You solved this challenge correctly.'
    }
  };

  const scenarios = [
    { section:'sameLayer', title:'alone', copy:'aloneText', safe:true, layers:1,
      queens:[{z:0,r:2,c:2,conflict:false}], line:null },
    { section:'sameLayer', title:'row', copy:'rowText', safe:false, layers:1,
      queens:[{z:0,r:2,c:1,conflict:true},{z:0,r:2,c:3,conflict:true}], line:{dr:0,dc:1,dz:0} },
    { section:'sameLayer', title:'column', copy:'columnText', safe:false, layers:1,
      queens:[{z:0,r:1,c:2,conflict:true},{z:0,r:3,c:2,conflict:true}], line:{dr:1,dc:0,dz:0} },
    { section:'sameLayer', title:'diagonal', copy:'diagonalText', safe:false, layers:1,
      queens:[{z:0,r:1,c:1,conflict:true},{z:0,r:3,c:3,conflict:true}], line:{dr:1,dc:1,dz:0} },
    { section:'between', title:'vertical', copy:'verticalText', safe:false, layers:2,
      queens:[{z:0,r:2,c:2,conflict:true},{z:1,r:2,c:2,conflict:true}], line:{dr:0,dc:0,dz:1}, arrow:true },
    { section:'between', title:'sideStep', copy:'sideStepText', safe:false, layers:2,
      queens:[{z:0,r:2,c:2,conflict:true},{z:1,r:2,c:3,conflict:true}], line:{dr:0,dc:1,dz:1}, arrow:true },
    { section:'between', title:'layerDiagonal', copy:'layerDiagonalText', safe:false, layers:2,
      queens:[{z:0,r:2,c:2,conflict:true},{z:1,r:3,c:3,conflict:true}], line:{dr:1,dc:1,dz:1}, arrow:true },
    { section:'between', title:'safeOffset', copy:'safeOffsetText', safe:true, layers:2,
      queens:[{z:0,r:2,c:2,conflict:false},{z:1,r:3,c:4,conflict:false}], line:null },
    { section:'through', title:'farVertical', copy:'farVerticalText', safe:false, layers:3,
      queens:[{z:0,r:2,c:2,conflict:true},{z:2,r:2,c:2,conflict:true}], line:{dr:0,dc:0,dz:1}, arrow:true },
    { section:'through', title:'farDiagonal', copy:'farDiagonalText', safe:false, layers:3,
      queens:[{z:0,r:1,c:1,conflict:true},{z:2,r:3,c:3,conflict:true}], line:{dr:1,dc:1,dz:1}, arrow:true }
  ];

  const style = document.createElement('style');
  style.textContent = `
    .visual-manual-btn{margin-top:10px;min-height:38px;padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.035);color:var(--text);font-size:12px;font-weight:850}
    .ux-overlay{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,8,18,.76);backdrop-filter:blur(8px)}
    .ux-overlay.open{display:flex}
    .ux-dialog{position:relative;width:min(920px,96vw);max-height:min(90vh,860px);overflow:auto;border:1px solid rgba(163,184,225,.3);border-radius:20px;background:#0d1728;color:#e8eefc;box-shadow:0 26px 80px rgba(0,0,0,.52)}
    .ux-dialog.small{width:min(390px,92vw);overflow:visible;text-align:center;padding:30px 24px 24px}
    .ux-dialog-head{position:sticky;top:0;z-index:20;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 18px 14px;background:rgba(13,23,40,.96);border-bottom:1px solid rgba(163,184,225,.18);backdrop-filter:blur(8px)}
    .ux-dialog h2{margin:0;font-size:22px}.ux-dialog h3{margin:24px 0 11px;font-size:15px}.ux-dialog p{color:#aab9d0;line-height:1.55}
    .ux-close{flex:0 0 auto;width:38px;height:38px;border-radius:10px;border:1px solid rgba(163,184,225,.25);background:rgba(255,255,255,.04);color:#e8eefc;font-size:20px;line-height:1}
    .guide-body{padding:4px 18px 24px}.guide-intro{margin:13px 0 2px;max-width:780px}.guide-section{margin-top:4px}
    .scenario-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .scenario-card{min-width:0;border:1px solid rgba(163,184,225,.17);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.018));overflow:hidden}
    .scenario-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 13px 0}.scenario-title{font-size:12px;font-weight:950;color:#eef3ff}.scenario-status{flex:0 0 auto;padding:4px 7px;border-radius:999px;font-size:9px;font-weight:950;border:1px solid}
    .scenario-status.safe{color:#98efb2;background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.34)}.scenario-status.attack{color:#ff9dad;background:rgba(244,63,94,.08);border-color:rgba(244,63,94,.4)}
    .scenario-copy{margin:0!important;padding:0 13px 13px;font-size:11px;line-height:1.45!important;min-height:48px}
    .scenario-visual{height:242px;display:grid;place-items:center;padding:8px 8px 2px;overflow:hidden;background:radial-gradient(circle at 50% 48%,rgba(126,148,232,.075),transparent 58%)}
    .scenario-visual.single{height:218px}
    .manual-flat-board,.manual-plane-board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-template-rows:repeat(5,minmax(0,1fr));aspect-ratio:1/1;border-radius:12px;overflow:hidden;border:1px solid rgba(210,225,255,.3);box-sizing:border-box}
    .manual-flat-board{width:164px;height:164px}
    .manual-cell{position:relative;display:grid;place-items:center;min-width:0;min-height:0;width:100%;height:100%;aspect-ratio:1/1;overflow:visible;box-sizing:border-box}
    .manual-cell.light{background:rgba(231,223,208,.94)}.manual-cell.dark{background:rgba(111,126,145,.94)}
    .manual-cell::after{content:'';position:absolute;inset:0;border:1px solid rgba(255,255,255,.085);pointer-events:none;box-sizing:border-box}
    .manual-cell.attack-cell::before{content:'';position:absolute;inset:10%;border-radius:5px;background:rgba(245,158,11,.25);box-shadow:inset 0 0 0 1px rgba(245,158,11,.68);z-index:1}
    .manual-queen{position:relative;z-index:4;width:72%;height:72%;max-width:none;max-height:none;min-width:0;min-height:0;aspect-ratio:1/1;display:grid;place-items:center;border-radius:50%;background:var(--mq-color);color:#fff;font-size:clamp(17px,3.4vw,24px);font-weight:950;line-height:1;box-sizing:border-box;box-shadow:0 3px 9px rgba(0,0,0,.42),inset 0 0 0 2px rgba(255,255,255,.25)}
    .manual-queen.conflict{box-shadow:0 0 0 4px rgba(244,63,94,.96),0 4px 10px rgba(0,0,0,.46),inset 0 0 0 2px rgba(255,255,255,.28)}
    .manual-3d-stage{position:relative;width:300px;height:226px;display:grid;place-items:center;perspective:950px;perspective-origin:50% 50%}
    .manual-3d-cube{position:relative;width:132px;height:132px;transform-style:preserve-3d;transform:rotateX(60deg) rotateY(0deg);transform-origin:center center}
    .manual-plane{position:absolute;inset:0;transform-style:preserve-3d;filter:drop-shadow(0 9px 11px rgba(0,0,0,.2))}
    .manual-plane-board{position:absolute;inset:0;width:132px;height:132px;border-color:color-mix(in srgb,var(--layer-color) 56%,rgba(210,225,255,.28));box-shadow:0 0 0 2px color-mix(in srgb,var(--layer-color) 28%,transparent)}
    .manual-layer-tag{position:absolute;right:4px;top:4px;z-index:8;padding:3px 6px;border-radius:999px;background:rgba(8,17,31,.9);border:1px solid color-mix(in srgb,var(--layer-color) 64%,transparent);color:#eef3ff;font-size:8px;font-weight:950;transform:translateZ(4px)}
    .manual-plane:not(.manual-front){opacity:.9}.manual-plane:not(.manual-front) .manual-cell.light{background:rgba(231,223,208,.78)}.manual-plane:not(.manual-front) .manual-cell.dark{background:rgba(111,126,145,.76)}
    .manual-arrow-layer{position:absolute;inset:0;z-index:15;pointer-events:none;overflow:visible}.manual-arrow-line{stroke:#fbbf24;stroke-width:3;stroke-linecap:round;stroke-dasharray:7 5;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}.manual-arrow-guide{stroke:rgba(251,191,36,.42);stroke-width:2;stroke-linecap:round;stroke-dasharray:3 6}
    .manual-legend{display:flex;gap:15px;flex-wrap:wrap;margin:16px 0 4px;padding:11px 12px;border-radius:12px;background:rgba(255,255,255,.022);border:1px solid rgba(163,184,225,.13);font-size:10px;color:#aab9d0}
    .manual-legend span{display:inline-flex;align-items:center;gap:7px}.legend-queen{width:18px;height:18px;border-radius:50%;background:#38bdf8;display:inline-block;box-shadow:inset 0 0 0 2px rgba(255,255,255,.25)}.legend-queen.conflict{box-shadow:0 0 0 3px rgba(244,63,94,.96),inset 0 0 0 2px rgba(255,255,255,.25)}.legend-line{width:26px;height:0;border-top:3px dashed #fbbf24;display:inline-block}
    .success-mark{font-size:44px;line-height:1;margin-bottom:10px}.success-title{font-size:24px;font-weight:950;margin:0 0 6px}.success-copy{margin:0!important}.success-close{position:absolute;top:10px;right:10px}
    .confetti-field{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:1001}.confetti-piece{position:absolute;left:50%;top:48%;width:9px;height:14px;border-radius:2px;background:hsl(var(--h) 82% 62%);animation:confetti-pop 1200ms cubic-bezier(.14,.75,.24,1) forwards;animation-delay:var(--delay)}
    @keyframes confetti-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.4) rotate(0deg)}10%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1) rotate(var(--rot))}}
    @media(max-width:680px){.scenario-grid{grid-template-columns:1fr}.scenario-visual{height:228px}.scenario-visual.single{height:214px}.manual-3d-stage{width:286px;height:216px}.scenario-copy{min-height:0}.ux-dialog{max-height:90vh}}
    @media(max-width:380px){.guide-body{padding-left:12px;padding-right:12px}.manual-3d-stage{width:255px}.manual-flat-board{width:154px;height:154px}}
    @media(prefers-reduced-motion:reduce){.confetti-piece{animation-duration:1ms}}
  `;
  document.head.appendChild(style);

  const lang = () => document.documentElement.lang === 'en' ? 'en' : 'es';
  const T = () => copy[lang()];

  function cellsOnFlatLine(s) {
    if (!s.line || s.layers !== 1) return new Set();
    const {dr, dc} = s.line;
    const q = s.queens[0];
    const out = new Set();
    for (let k = -BOARD_N * 2; k <= BOARD_N * 2; k++) {
      const r = q.r + dr * k;
      const c = q.c + dc * k;
      if (r >= 0 && r < BOARD_N && c >= 0 && c < BOARD_N) out.add(`${r},${c}`);
    }
    return out;
  }

  function cellsOn3DLine(s) {
    const perLayer = new Map();
    if (!s.line || s.layers < 2) return perLayer;
    const q = s.queens[0];
    const {dr, dc, dz} = s.line;
    for (let k = -BOARD_N * 2; k <= BOARD_N * 2; k++) {
      const z = q.z + dz * k;
      const r = q.r + dr * k;
      const c = q.c + dc * k;
      if (z >= 0 && z < s.layers && r >= 0 && r < BOARD_N && c >= 0 && c < BOARD_N) {
        if (!perLayer.has(z)) perLayer.set(z, new Set());
        perLayer.get(z).add(`${r},${c}`);
      }
    }
    return perLayer;
  }

  function queenAt(s, z, r, c) {
    return s.queens.find(q => q.z === z && q.r === r && q.c === c) || null;
  }

  function boardHtml(s, z, flatLine = null, line3d = null) {
    let html = '';
    const lineCells = flatLine || line3d?.get(z) || new Set();
    for (let r = 0; r < BOARD_N; r++) {
      for (let c = 0; c < BOARD_N; c++) {
        const light = (r + c) % 2 === 0;
        const q = queenAt(s, z, r, c);
        const onLine = lineCells.has(`${r},${c}`);
        html += `<span class="manual-cell ${light ? 'light' : 'dark'}${onLine ? ' attack-cell' : ''}">`;
        if (q) html += `<span class="manual-queen${q.conflict ? ' conflict' : ''}" style="--mq-color:${LAYER_COLORS[z % LAYER_COLORS.length]}">♛</span>`;
        html += '</span>';
      }
    }
    return html;
  }

  function flatVisual(s) {
    const line = cellsOnFlatLine(s);
    return `<div class="manual-flat-board" aria-hidden="true">${boardHtml(s, 0, line, null)}</div>`;
  }

  function projectedPoint(s, q) {
    const stageW = 300;
    const stageH = 226;
    const board = 132;
    const cell = board / BOARD_N;
    const depth = s.layers === 2 ? 112 : 88;
    const centerX = stageW / 2;
    const centerY = stageH / 2;
    const localX = (q.c + .5 - BOARD_N / 2) * cell;
    const localY = (q.r + .5 - BOARD_N / 2) * cell;
    const z = ((s.layers - 1) / 2 - q.z) * depth;
    const rad = Math.PI / 3;
    return { x:centerX + localX, y:centerY + localY * Math.cos(rad) - z * Math.sin(rad) };
  }

  function arrowSvg(s) {
    if (!s.arrow || s.queens.length < 2) return '';
    const a = projectedPoint(s, s.queens[0]);
    const b = projectedPoint(s, s.queens[s.queens.length - 1]);
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    dx /= len; dy /= len;
    const extend = 28;
    const x1 = a.x - dx * extend;
    const y1 = a.y - dy * extend;
    const x2 = b.x + dx * extend;
    const y2 = b.y + dy * extend;
    const markerId = `arrowHeadManual-${s.title}`;
    return `<svg class="manual-arrow-layer" viewBox="0 0 300 226" aria-hidden="true">
      <defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#fbbf24"/></marker></defs>
      <line class="manual-arrow-guide" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>
      <line class="manual-arrow-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" marker-end="url(#${markerId})"/>
    </svg>`;
  }

  function multiVisual(s) {
    const line3d = cellsOn3DLine(s);
    const depth = s.layers === 2 ? 112 : 88;
    let planes = '';
    for (let z = s.layers - 1; z >= 0; z--) {
      const translate = ((s.layers - 1) / 2 - z) * depth;
      planes += `<div class="manual-plane${z === 0 ? ' manual-front' : ''}" style="--layer-color:${LAYER_COLORS[z % LAYER_COLORS.length]};transform:translateZ(${translate}px)">
        <div class="manual-plane-board">${boardHtml(s, z, null, line3d)}</div>
        <span class="manual-layer-tag">${T().layer} ${z + 1}</span>
      </div>`;
    }
    return `<div class="manual-3d-stage" aria-hidden="true"><div class="manual-3d-cube">${planes}</div>${arrowSvg(s)}</div>`;
  }

  function scenarioCard(s) {
    const t = T();
    return `<article class="scenario-card">
      <div class="scenario-card-head"><span class="scenario-title">${t[s.title]}</span><span class="scenario-status ${s.safe ? 'safe' : 'attack'}">${s.safe ? t.safe : t.attack}</span></div>
      <div class="scenario-visual${s.layers === 1 ? ' single' : ''}">${s.layers === 1 ? flatVisual(s) : multiVisual(s)}</div>
      <p class="scenario-copy">${t[s.copy]}</p>
    </article>`;
  }

  let manualBtn = document.querySelector('.visual-manual-btn');
  if (!manualBtn) {
    manualBtn = document.createElement('button');
    manualBtn.type = 'button';
    manualBtn.className = 'visual-manual-btn';
    rules.appendChild(manualBtn);
  }

  let manualOverlay = document.querySelector('#manualOverlay');
  if (!manualOverlay) {
    manualOverlay = document.createElement('div');
    manualOverlay.id = 'manualOverlay';
    manualOverlay.className = 'ux-overlay';
    manualOverlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(manualOverlay);
  }

  let successOverlay = document.querySelector('#successOverlay');
  if (!successOverlay) {
    successOverlay = document.createElement('div');
    successOverlay.id = 'successOverlay';
    successOverlay.className = 'ux-overlay';
    successOverlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(successOverlay);
  }

  function renderManual() {
    const t = T();
    manualBtn.textContent = t.manual;
    const sections = ['sameLayer', 'between', 'through'];
    const sectionHtml = sections.map(section => {
      const cards = scenarios.filter(s => s.section === section).map(scenarioCard).join('');
      return `<section class="guide-section"><h3>${t[section]}</h3><div class="scenario-grid">${cards}</div></section>`;
    }).join('');
    manualOverlay.innerHTML = `<div class="ux-dialog" role="dialog" aria-modal="true" aria-labelledby="guideTitle">
      <div class="ux-dialog-head"><h2 id="guideTitle">${t.guideTitle}</h2><button type="button" class="ux-close" aria-label="${t.close}" title="${t.close}">×</button></div>
      <div class="guide-body"><p class="guide-intro">${t.guideIntro}</p>${sectionHtml}
        <div class="manual-legend"><span><i class="legend-queen"></i>${t.queen}</span><span><i class="legend-queen conflict"></i>${t.conflict}</span><span><i class="legend-line"></i>${t.line}</span></div>
      </div></div>`;
    manualOverlay.querySelector('.ux-close')?.addEventListener('click', closeManual);
  }

  function openManual() {
    renderManual();
    manualOverlay.classList.add('open');
    manualOverlay.setAttribute('aria-hidden', 'false');
    manualOverlay.querySelector('.ux-close')?.focus();
  }
  function closeManual() {
    manualOverlay.classList.remove('open');
    manualOverlay.setAttribute('aria-hidden', 'true');
    manualBtn.focus();
  }

  manualBtn.addEventListener('click', openManual);
  manualOverlay.addEventListener('click', e => { if (e.target === manualOverlay) closeManual(); });

  function spawnConfetti() {
    document.querySelector('.confetti-field')?.remove();
    const field = document.createElement('div');
    field.className = 'confetti-field';
    for (let i = 0; i < 42; i++) {
      const p = document.createElement('i');
      p.className = 'confetti-piece';
      const angle = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 250;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist + 80}px`);
      p.style.setProperty('--rot', `${Math.round(Math.random() * 900 - 450)}deg`);
      p.style.setProperty('--delay', `${Math.round(Math.random() * 120)}ms`);
      p.style.setProperty('--h', `${Math.round(Math.random() * 360)}`);
      field.appendChild(p);
    }
    document.body.appendChild(field);
    setTimeout(() => field.remove(), 1500);
  }

  function openSuccess() {
    const t = T();
    successOverlay.innerHTML = `<div class="ux-dialog small" role="dialog" aria-modal="true" aria-labelledby="successTitle">
      <button type="button" class="ux-close success-close" aria-label="${t.close}" title="${t.close}">×</button>
      <div class="success-mark">♛</div><div id="successTitle" class="success-title">${t.congrats}</div><p class="success-copy">${t.solved}</p></div>`;
    successOverlay.classList.add('open');
    successOverlay.setAttribute('aria-hidden', 'false');
    successOverlay.querySelector('.ux-close')?.addEventListener('click', closeSuccess);
    successOverlay.querySelector('.ux-close')?.focus();
    spawnConfetti();
  }
  function closeSuccess() {
    successOverlay.classList.remove('open');
    successOverlay.setAttribute('aria-hidden', 'true');
    checkBtn?.focus();
  }

  successOverlay.addEventListener('click', e => { if (e.target === successOverlay) closeSuccess(); });
  checkBtn?.addEventListener('click', () => setTimeout(() => { if (result?.classList.contains('ok')) openSuccess(); }, 0));

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (successOverlay.classList.contains('open')) closeSuccess();
    else if (manualOverlay.classList.contains('open')) closeManual();
  });

  const langObserver = new MutationObserver(() => {
    manualBtn.textContent = T().manual;
    if (manualOverlay.classList.contains('open')) renderManual();
  });
  langObserver.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});

  manualBtn.textContent = T().manual;
})();