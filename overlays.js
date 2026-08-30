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
      guideIntro: 'Cada ejemplo parte de una reina de referencia. Sus casillas de ataque se resaltan completas en todas las capas visibles. Si otra reina ocupa una de esas casillas, ambas quedan en conflicto.',
      conventionNote: 'La reina de referencia conserva su identidad; si entra en conflicto, también recibe el borde rojo.',
      sameLayer: '1. En una sola capa', between: '2. Entre dos capas', through: '3. A través de varias capas',
      alone: 'Reina sola', row: 'Misma fila', column: 'Misma columna', diagonal: 'Misma diagonal',
      vertical: 'Misma posición', sideStep: 'Un paso al lado', layerDiagonal: 'Diagonal entre capas', safeOffset: 'No están alineadas',
      farVertical: 'Dos capas de distancia', farDiagonal: 'Diagonal a través de 3 capas',
      aloneText: 'La referencia muestra todas las casillas que puede atacar dentro de esta capa.',
      rowText: 'La segunda reina cae en una de las casillas atacadas de la misma fila.',
      columnText: 'La segunda reina cae en una casilla atacada de la misma columna.',
      diagonalText: 'La segunda reina ocupa una de las diagonales atacadas por la referencia.',
      verticalText: 'La misma posición en la siguiente capa está atacada directamente arriba o abajo.',
      sideStepText: 'Al subir una capa y desplazarse una casilla lateralmente, la posición sigue atacada.',
      layerDiagonalText: 'Subir una capa, una fila y una columna produce una diagonal 3D atacada.',
      safeOffsetText: 'La segunda reina queda fuera de todas las casillas atacadas por la referencia.',
      farVerticalText: 'La misma posición continúa atacada aunque exista una capa intermedia.',
      farDiagonalText: 'Desde el centro, la diagonal continúa por la capa intermedia hasta la tercera capa.',
      safe: 'Sin conflicto', attack: 'Se atacan',
      reference: 'Reina de referencia', queen: 'Reina', conflict: 'Reina en conflicto', attackedSquare: 'Casilla atacada', layer: 'Capa',
      congrats: '¡Felicidades!', solved: 'Resolviste este reto correctamente.'
    },
    en: {
      manual: 'Visual guide', close: 'Close',
      guideTitle: 'How queens attack in 3D',
      guideIntro: 'Each example starts from a reference queen. Every square it attacks is highlighted across all visible layers. If another queen occupies one of those squares, both queens are in conflict.',
      conventionNote: 'The reference queen keeps its identity; if it is involved in a conflict, it also receives the red conflict outline.',
      sameLayer: '1. Within one layer', between: '2. Between two layers', through: '3. Across multiple layers',
      alone: 'Single queen', row: 'Same row', column: 'Same column', diagonal: 'Same diagonal',
      vertical: 'Same position', sideStep: 'One step sideways', layerDiagonal: 'Diagonal between layers', safeOffset: 'Not aligned',
      farVertical: 'Two layers apart', farDiagonal: 'Diagonal across 3 layers',
      aloneText: 'The reference queen shows every square it can attack within this layer.',
      rowText: 'The second queen sits on one of the attacked squares in the same row.',
      columnText: 'The second queen sits on an attacked square in the same column.',
      diagonalText: 'The second queen occupies one of the diagonals attacked by the reference queen.',
      verticalText: 'The same position on the next layer is attacked directly above or below.',
      sideStepText: 'Going up one layer and one square sideways still lands on an attacked square.',
      layerDiagonalText: 'Moving up one layer, one row and one column creates an attacked 3D diagonal.',
      safeOffsetText: 'The second queen remains outside every square attacked by the reference queen.',
      farVerticalText: 'The same position remains attacked even with a middle layer in between.',
      farDiagonalText: 'Starting from the center, the diagonal continues through the middle layer to the third layer.',
      safe: 'No conflict', attack: 'They attack',
      reference: 'Reference queen', queen: 'Queen', conflict: 'Conflicting queen', attackedSquare: 'Attacked square', layer: 'Layer',
      congrats: 'Congratulations!', solved: 'You solved this challenge correctly.'
    }
  };

  const scenarios = [
    { id:'alone', section:'sameLayer', title:'alone', copy:'aloneText', safe:true, layers:1,
      queens:[{z:0,r:2,c:2,role:'reference',conflict:false}] },
    { id:'row', section:'sameLayer', title:'row', copy:'rowText', safe:false, layers:1,
      queens:[{z:0,r:2,c:2,role:'reference',conflict:true},{z:0,r:2,c:4,role:'queen',conflict:true}] },
    { id:'column', section:'sameLayer', title:'column', copy:'columnText', safe:false, layers:1,
      queens:[{z:0,r:2,c:2,role:'reference',conflict:true},{z:0,r:4,c:2,role:'queen',conflict:true}] },
    { id:'diagonal', section:'sameLayer', title:'diagonal', copy:'diagonalText', safe:false, layers:1,
      queens:[{z:0,r:2,c:2,role:'reference',conflict:true},{z:0,r:4,c:4,role:'queen',conflict:true}] },
    { id:'vertical', section:'between', title:'vertical', copy:'verticalText', safe:false, layers:2, arrow:true,
      queens:[{z:0,r:2,c:2,role:'reference',conflict:true},{z:1,r:2,c:2,role:'queen',conflict:true}] },
    { id:'sideStep', section:'between', title:'sideStep', copy:'sideStepText', safe:false, layers:2, arrow:true,
      queens:[{z:0,r:2,c:2,role:'reference',conflict:true},{z:1,r:2,c:3,role:'queen',conflict:true}] },
    { id:'layerDiagonal', section:'between', title:'layerDiagonal', copy:'layerDiagonalText', safe:false, layers:2, arrow:true,
      queens:[{z:0,r:2,c:2,role:'reference',conflict:true},{z:1,r:3,c:3,role:'queen',conflict:true}] },
    { id:'safeOffset', section:'between', title:'safeOffset', copy:'safeOffsetText', safe:true, layers:2,
      queens:[{z:0,r:2,c:2,role:'reference',conflict:false},{z:1,r:3,c:4,role:'queen',conflict:false}] },
    { id:'farVertical', section:'through', title:'farVertical', copy:'farVerticalText', safe:false, layers:3, arrow:true,
      queens:[{z:0,r:2,c:2,role:'reference',conflict:true},{z:2,r:2,c:2,role:'queen',conflict:true}] },
    { id:'farDiagonal', section:'through', title:'farDiagonal', copy:'farDiagonalText', safe:false, layers:3, arrow:true,
      queens:[{z:0,r:2,c:2,role:'reference',conflict:true},{z:2,r:4,c:4,role:'queen',conflict:true}] }
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
    .guide-body{padding:4px 18px 24px}.guide-intro{margin:13px 0 10px;max-width:800px}.guide-section{margin-top:4px}

    .manual-conventions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:12px 0 4px}
    .manual-convention{display:flex;align-items:center;gap:9px;min-width:0;padding:9px 10px;border:1px solid rgba(163,184,225,.14);border-radius:12px;background:rgba(255,255,255,.022);font-size:10px;color:#b5c1d3;font-weight:800}
    .legend-cell{position:relative;flex:0 0 38px;width:38px;height:38px;display:grid;place-items:center;border-radius:7px;overflow:hidden;background:rgba(231,223,208,.94);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
    .legend-cell.dark{background:rgba(111,126,145,.94)}
    .legend-cell.attacked::before{content:'';position:absolute;inset:2px;border-radius:5px;background:rgba(245,158,11,.28);box-shadow:inset 0 0 0 2px rgba(245,158,11,.78);z-index:1}
    .legend-q{position:relative;z-index:3;width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#38bdf8;color:#fff;font-size:18px;font-weight:950;line-height:1;box-shadow:0 2px 6px rgba(0,0,0,.35),inset 0 0 0 2px rgba(255,255,255,.25)}
    .legend-q.reference{box-shadow:0 0 0 3px rgba(235,244,255,.92),0 2px 6px rgba(0,0,0,.35),inset 0 0 0 2px rgba(255,255,255,.25)}
    .legend-q.conflict{box-shadow:0 0 0 4px rgba(244,63,94,.96),0 2px 7px rgba(0,0,0,.4),inset 0 0 0 2px rgba(255,255,255,.25)}
    .manual-convention-note{margin:8px 0 0!important;font-size:10px;line-height:1.4!important}

    .scenario-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .scenario-card{min-width:0;border:1px solid rgba(163,184,225,.17);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.018));overflow:hidden}
    .scenario-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 13px 0}.scenario-title{font-size:12px;font-weight:950;color:#eef3ff}.scenario-status{flex:0 0 auto;padding:4px 7px;border-radius:999px;font-size:9px;font-weight:950;border:1px solid}
    .scenario-status.safe{color:#98efb2;background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.34)}.scenario-status.attack{color:#ff9dad;background:rgba(244,63,94,.08);border-color:rgba(244,63,94,.4)}
    .scenario-copy{margin:0!important;padding:0 13px 13px;font-size:11px;line-height:1.45!important;min-height:48px}
    .scenario-visual{height:286px;display:grid;place-items:center;padding:6px 8px 2px;overflow:hidden;background:radial-gradient(circle at 50% 48%,rgba(126,148,232,.075),transparent 58%)}
    .scenario-visual.single{height:220px}

    .manual-flat-board,.manual-plane-board{display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(5,1fr);aspect-ratio:1/1;border-radius:12px;overflow:hidden;border:1px solid rgba(210,225,255,.3);box-sizing:border-box}
    .manual-flat-board{width:166px;height:166px}
    .manual-cell{position:relative;display:grid;place-items:center;min-width:0;min-height:0;width:100%;height:100%;overflow:hidden;box-sizing:border-box}
    .manual-cell.light{background:rgba(231,223,208,.94)}.manual-cell.dark{background:rgba(111,126,145,.94)}
    .manual-cell::after{content:'';position:absolute;inset:0;border:1px solid rgba(255,255,255,.085);pointer-events:none;box-sizing:border-box;z-index:2}
    .manual-cell.attack-cell::before{content:'';position:absolute;inset:2px;border-radius:4px;background:rgba(245,158,11,.29);box-shadow:inset 0 0 0 2px rgba(245,158,11,.76);z-index:1}
    .manual-queen{position:relative;z-index:4;width:72%;height:72%;aspect-ratio:1/1;display:grid;place-items:center;border-radius:50%;background:var(--mq-color);color:#fff;font-size:22px;font-weight:950;line-height:1;box-sizing:border-box;box-shadow:0 3px 9px rgba(0,0,0,.42),inset 0 0 0 2px rgba(255,255,255,.25)}
    .manual-queen.reference{box-shadow:0 0 0 3px rgba(235,244,255,.92),0 3px 9px rgba(0,0,0,.42),inset 0 0 0 2px rgba(255,255,255,.25)}
    .manual-queen.conflict{box-shadow:0 0 0 4px rgba(244,63,94,.96),0 4px 10px rgba(0,0,0,.46),inset 0 0 0 2px rgba(255,255,255,.28)}
    .manual-queen.reference.conflict{box-shadow:0 0 0 4px rgba(244,63,94,.98),0 0 0 7px rgba(235,244,255,.76),0 4px 10px rgba(0,0,0,.46),inset 0 0 0 2px rgba(255,255,255,.3)}

    .manual-3d-stage{position:relative;width:320px;height:276px;display:grid;place-items:center;perspective:1000px;perspective-origin:50% 50%}
    .manual-3d-cube{position:relative;width:132px;height:132px;transform-style:preserve-3d;transform:rotateX(60deg) rotateY(0deg);transform-origin:center center}
    .manual-plane{position:absolute;inset:0;transform-style:preserve-3d;filter:drop-shadow(0 9px 11px rgba(0,0,0,.2))}
    .manual-plane-board{position:absolute;inset:0;width:132px;height:132px;border-color:color-mix(in srgb,var(--layer-color) 56%,rgba(210,225,255,.28));box-shadow:0 0 0 2px color-mix(in srgb,var(--layer-color) 28%,transparent)}
    .manual-layer-tag{position:absolute;right:4px;top:4px;z-index:8;padding:3px 6px;border-radius:999px;background:rgba(8,17,31,.9);border:1px solid color-mix(in srgb,var(--layer-color) 64%,transparent);color:#eef3ff;font-size:8px;font-weight:950;transform:translateZ(4px)}
    .manual-plane:not(.manual-front){opacity:.91}.manual-plane:not(.manual-front) .manual-cell.light{background:rgba(231,223,208,.8)}.manual-plane:not(.manual-front) .manual-cell.dark{background:rgba(111,126,145,.78)}
    .manual-arrow-layer{position:absolute;inset:0;width:100%;height:100%;z-index:15;pointer-events:none;overflow:visible}.manual-arrow-line{stroke:#fbbf24;stroke-width:3;stroke-linecap:round;filter:drop-shadow(0 1px 2px rgba(0,0,0,.55))}

    .success-mark{font-size:44px;line-height:1;margin-bottom:10px}.success-title{font-size:24px;font-weight:950;margin:0 0 6px}.success-copy{margin:0!important}.success-close{position:absolute;top:10px;right:10px}
    .confetti-field{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:1001}.confetti-piece{position:absolute;left:50%;top:48%;width:9px;height:14px;border-radius:2px;background:hsl(var(--h) 82% 62%);animation:confetti-pop 1200ms cubic-bezier(.14,.75,.24,1) forwards;animation-delay:var(--delay)}
    @keyframes confetti-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.4) rotate(0deg)}10%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1) rotate(var(--rot))}}
    @media(max-width:680px){.manual-conventions{grid-template-columns:1fr 1fr}.scenario-grid{grid-template-columns:1fr}.scenario-visual{height:272px}.scenario-visual.single{height:214px}.manual-3d-stage{width:294px;height:262px}.scenario-copy{min-height:0}.ux-dialog{max-height:90vh}}
    @media(max-width:380px){.guide-body{padding-left:12px;padding-right:12px}.manual-3d-stage{width:260px}.manual-flat-board{width:154px;height:154px}.manual-convention{padding:8px}.legend-cell{flex-basis:34px;width:34px;height:34px}.legend-q{width:23px;height:23px;font-size:16px}}
    @media(prefers-reduced-motion:reduce){.confetti-piece{animation-duration:1ms}}
  `;
  document.head.appendChild(style);

  const lang = () => document.documentElement.lang === 'en' ? 'en' : 'es';
  const T = () => copy[lang()];

  function attacks(a, b) {
    const diffs = [Math.abs(a.c - b.c), Math.abs(a.r - b.r), Math.abs(a.z - b.z)];
    const nonzero = diffs.filter(v => v !== 0);
    return nonzero.length > 0 && nonzero.every(v => v === nonzero[0]);
  }

  function referenceQueen(s) {
    return s.queens.find(q => q.role === 'reference') || s.queens[0];
  }

  function attackedMap(s) {
    const ref = referenceQueen(s);
    const perLayer = new Map();
    for (let z = 0; z < s.layers; z++) {
      const set = new Set();
      for (let r = 0; r < BOARD_N; r++) {
        for (let c = 0; c < BOARD_N; c++) {
          const same = z === ref.z && r === ref.r && c === ref.c;
          if (same || attacks(ref, {z,r,c})) set.add(`${r},${c}`);
        }
      }
      perLayer.set(z, set);
    }
    return perLayer;
  }

  function queenAt(s, z, r, c) {
    return s.queens.find(q => q.z === z && q.r === r && q.c === c) || null;
  }

  function boardHtml(s, z, attackMap) {
    let html = '';
    const attacked = attackMap.get(z) || new Set();
    for (let r = 0; r < BOARD_N; r++) {
      for (let c = 0; c < BOARD_N; c++) {
        const light = (r + c) % 2 === 0;
        const q = queenAt(s, z, r, c);
        const onAttack = attacked.has(`${r},${c}`);
        html += `<span class="manual-cell ${light ? 'light' : 'dark'}${onAttack ? ' attack-cell' : ''}" data-z="${z}" data-r="${r}" data-c="${c}">`;
        if (q) {
          const classes = ['manual-queen'];
          if (q.role === 'reference') classes.push('reference');
          if (q.conflict) classes.push('conflict');
          html += `<span class="${classes.join(' ')}" style="--mq-color:${LAYER_COLORS[z % LAYER_COLORS.length]}">♛</span>`;
        }
        html += '</span>';
      }
    }
    return html;
  }

  function flatVisual(s) {
    const map = attackedMap(s);
    return `<div class="manual-flat-board" aria-hidden="true">${boardHtml(s, 0, map)}</div>`;
  }

  function arrowSvg(s) {
    if (!s.arrow || s.queens.length < 2) return '';
    const markerId = `manualArrowHead-${s.id}`;
    return `<svg class="manual-arrow-layer" aria-hidden="true">
      <defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#fbbf24"/></marker></defs>
      <line class="manual-arrow-line" x1="0" y1="0" x2="0" y2="0" marker-end="url(#${markerId})"/>
    </svg>`;
  }

  function multiVisual(s) {
    const map = attackedMap(s);
    const depth = s.layers === 2 ? 132 : 104;
    let planes = '';
    for (let z = s.layers - 1; z >= 0; z--) {
      const translate = ((s.layers - 1) / 2 - z) * depth;
      planes += `<div class="manual-plane${z === 0 ? ' manual-front' : ''}" style="--layer-color:${LAYER_COLORS[z % LAYER_COLORS.length]};transform:translateZ(${translate}px)">
        <div class="manual-plane-board">${boardHtml(s, z, map)}</div>
        <span class="manual-layer-tag">${T().layer} ${z + 1}</span>
      </div>`;
    }
    return `<div class="manual-3d-stage" aria-hidden="true"><div class="manual-3d-cube">${planes}</div>${arrowSvg(s)}</div>`;
  }

  function scenarioCard(s) {
    const t = T();
    const ref = referenceQueen(s);
    const target = s.queens.find(q => q !== ref) || null;
    const refData = `${ref.z},${ref.r},${ref.c}`;
    const targetData = target ? `${target.z},${target.r},${target.c}` : '';
    return `<article class="scenario-card" data-scenario="${s.id}" data-arrow="${s.arrow ? 'true' : 'false'}" data-ref="${refData}" data-target="${targetData}">
      <div class="scenario-card-head"><span class="scenario-title">${t[s.title]}</span><span class="scenario-status ${s.safe ? 'safe' : 'attack'}">${s.safe ? t.safe : t.attack}</span></div>
      <div class="scenario-visual${s.layers === 1 ? ' single' : ''}">${s.layers === 1 ? flatVisual(s) : multiVisual(s)}</div>
      <p class="scenario-copy">${t[s.copy]}</p>
    </article>`;
  }

  function conventionHtml() {
    const t = T();
    return `<div class="manual-conventions" aria-label="${t.reference}, ${t.queen}, ${t.conflict}, ${t.attackedSquare}">
      <div class="manual-convention"><span class="legend-cell attacked"><i class="legend-q reference">♛</i></span><span>${t.reference}</span></div>
      <div class="manual-convention"><span class="legend-cell dark"><i class="legend-q">♛</i></span><span>${t.queen}</span></div>
      <div class="manual-convention"><span class="legend-cell attacked"><i class="legend-q conflict">♛</i></span><span>${t.conflict}</span></div>
      <div class="manual-convention"><span class="legend-cell attacked"></span><span>${t.attackedSquare}</span></div>
    </div><p class="manual-convention-note">${t.conventionNote}</p>`;
  }

  function parsePos(value) {
    const [z,r,c] = String(value || '').split(',').map(Number);
    return Number.isFinite(z) && Number.isFinite(r) && Number.isFinite(c) ? {z,r,c} : null;
  }

  function findCell(card, pos) {
    if (!pos) return null;
    return card.querySelector(`.manual-cell[data-z="${pos.z}"][data-r="${pos.r}"][data-c="${pos.c}"]`);
  }

  function positionManualArrows() {
    document.querySelectorAll('#manualOverlay .scenario-card[data-arrow="true"]').forEach(card => {
      const stage = card.querySelector('.manual-3d-stage');
      const line = card.querySelector('.manual-arrow-line');
      const aCell = findCell(card, parsePos(card.dataset.ref));
      const bCell = findCell(card, parsePos(card.dataset.target));
      if (!stage || !line || !aCell || !bCell) return;
      const sr = stage.getBoundingClientRect();
      const ar = aCell.getBoundingClientRect();
      const br = bCell.getBoundingClientRect();
      const x1 = ar.left + ar.width / 2 - sr.left;
      const y1 = ar.top + ar.height / 2 - sr.top;
      const x2 = br.left + br.width / 2 - sr.left;
      const y2 = br.top + br.height / 2 - sr.top;
      line.setAttribute('x1', x1.toFixed(2));
      line.setAttribute('y1', y1.toFixed(2));
      line.setAttribute('x2', x2.toFixed(2));
      line.setAttribute('y2', y2.toFixed(2));
    });
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
      <div class="guide-body"><p class="guide-intro">${t.guideIntro}</p>${conventionHtml()}${sectionHtml}</div>
    </div>`;
    manualOverlay.querySelector('.ux-close')?.addEventListener('click', closeManual);
    requestAnimationFrame(() => requestAnimationFrame(positionManualArrows));
  }

  function openManual() {
    renderManual();
    manualOverlay.classList.add('open');
    manualOverlay.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => requestAnimationFrame(positionManualArrows));
    manualOverlay.querySelector('.ux-close')?.focus();
  }

  function closeManual() {
    manualOverlay.classList.remove('open');
    manualOverlay.setAttribute('aria-hidden', 'true');
    manualBtn.focus();
  }

  manualBtn.addEventListener('click', openManual);
  manualOverlay.addEventListener('click', e => { if (e.target === manualOverlay) closeManual(); });
  window.addEventListener('resize', () => {
    if (manualOverlay.classList.contains('open')) requestAnimationFrame(positionManualArrows);
  });

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