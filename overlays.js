(() => {
  const checkBtn = document.getElementById('check');
  const result = document.getElementById('result');
  const rules = document.querySelector('.rules');

  const LAYER_COLORS = ['#38bdf8','#8b5cf6','#f59e0b'];
  const BOARD_N = 5;

  const text = {
    es: {
      manual: 'Manual visual', close: 'Cerrar',
      guideTitle: 'Cómo atacan las reinas en 3D',
      guideIntro: 'Cada ejemplo usa el mismo lenguaje visual del tablero. La reina con borde claro es la referencia; una reina con borde rojo forma un ataque con ella.',
      sameLayer: '1. En una sola capa',
      between: '2. Entre dos capas',
      through: '3. A través de varias capas',
      alone: 'Reina sola', row: 'Misma fila', column: 'Misma columna', diagonal: 'Misma diagonal',
      vertical: 'Misma posición', sideStep: 'Un paso al lado', layerDiagonal: 'Diagonal entre capas', safeOffset: 'No están alineadas',
      farVertical: 'Dos capas de distancia', farDiagonal: 'Diagonal a través de 3 capas',
      aloneText: 'Una reina sola no entra en conflicto.',
      rowText: 'Dos reinas en la misma fila se atacan.',
      columnText: 'Dos reinas en la misma columna se atacan.',
      diagonalText: 'Una diagonal dentro de la capa también es una línea de ataque.',
      verticalText: 'La misma casilla en otra capa queda directamente arriba o abajo.',
      sideStepText: 'Al subir una capa y avanzar una casilla al lado, siguen formando una línea.',
      layerDiagonalText: 'Subir una capa y avanzar una fila y una columna forma una diagonal 3D.',
      safeOffsetText: 'Si los desplazamientos no forman una misma línea, no se atacan.',
      farVerticalText: 'La distancia no rompe la línea: dos capas más lejos sigue siendo ataque.',
      farDiagonalText: 'Una diagonal puede continuar por la capa intermedia y atravesar el cubo.',
      safe: 'Sin conflicto', attack: 'Se atacan',
      reference: 'Reina de referencia', conflict: 'Reina en conflicto', path: 'Línea de ataque',
      layer: 'Capa',
      congrats: '¡Felicidades!', solved: 'Resolviste este reto correctamente.'
    },
    en: {
      manual: 'Visual guide', close: 'Close',
      guideTitle: 'How queens attack in 3D',
      guideIntro: 'Each example uses the same visual language as the board. The queen with the light outline is the reference; a queen with a red outline forms an attack with it.',
      sameLayer: '1. Within one layer',
      between: '2. Between two layers',
      through: '3. Across multiple layers',
      alone: 'Single queen', row: 'Same row', column: 'Same column', diagonal: 'Same diagonal',
      vertical: 'Same position', sideStep: 'One step sideways', layerDiagonal: 'Diagonal between layers', safeOffset: 'Not aligned',
      farVertical: 'Two layers apart', farDiagonal: 'Diagonal across 3 layers',
      aloneText: 'A single queen has no conflict.',
      rowText: 'Two queens on the same row attack each other.',
      columnText: 'Two queens on the same column attack each other.',
      diagonalText: 'A diagonal within the layer is also an attack line.',
      verticalText: 'The same square on another layer lies directly above or below.',
      sideStepText: 'Going up one layer and one square sideways still forms one line.',
      layerDiagonalText: 'Going up one layer while moving one row and one column forms a 3D diagonal.',
      safeOffsetText: 'If the offsets do not form one straight line, the queens do not attack.',
      farVerticalText: 'Distance does not break the line: two layers away is still an attack.',
      farDiagonalText: 'A diagonal can continue through the middle layer and cross the cube.',
      safe: 'No conflict', attack: 'They attack',
      reference: 'Reference queen', conflict: 'Conflicting queen', path: 'Attack line',
      layer: 'Layer',
      congrats: 'Congratulations!', solved: 'You solved this challenge correctly.'
    }
  };

  const scenarios = [
    {
      section: 'sameLayer', title: 'alone', copy: 'aloneText', safe: true, layers: 1,
      queens: [{z:0,r:2,c:2,role:'reference'}], paths: {}
    },
    {
      section: 'sameLayer', title: 'row', copy: 'rowText', safe: false, layers: 1,
      queens: [{z:0,r:2,c:1,role:'reference'},{z:0,r:2,c:3,role:'conflict'}],
      paths: {0:[[2,2]]}
    },
    {
      section: 'sameLayer', title: 'column', copy: 'columnText', safe: false, layers: 1,
      queens: [{z:0,r:1,c:2,role:'reference'},{z:0,r:3,c:2,role:'conflict'}],
      paths: {0:[[2,2]]}
    },
    {
      section: 'sameLayer', title: 'diagonal', copy: 'diagonalText', safe: false, layers: 1,
      queens: [{z:0,r:1,c:1,role:'reference'},{z:0,r:3,c:3,role:'conflict'}],
      paths: {0:[[2,2]]}
    },
    {
      section: 'between', title: 'vertical', copy: 'verticalText', safe: false, layers: 2,
      queens: [{z:0,r:2,c:2,role:'reference'},{z:1,r:2,c:2,role:'conflict'}],
      paths: {0:[[2,2]],1:[[2,2]]}
    },
    {
      section: 'between', title: 'sideStep', copy: 'sideStepText', safe: false, layers: 2,
      queens: [{z:0,r:2,c:2,role:'reference'},{z:1,r:2,c:3,role:'conflict'}],
      paths: {0:[[2,2]],1:[[2,3]]}
    },
    {
      section: 'between', title: 'layerDiagonal', copy: 'layerDiagonalText', safe: false, layers: 2,
      queens: [{z:0,r:2,c:2,role:'reference'},{z:1,r:3,c:3,role:'conflict'}],
      paths: {0:[[2,2]],1:[[3,3]]}
    },
    {
      section: 'between', title: 'safeOffset', copy: 'safeOffsetText', safe: true, layers: 2,
      queens: [{z:0,r:2,c:2,role:'reference'},{z:1,r:3,c:4,role:'normal'}], paths: {}
    },
    {
      section: 'through', title: 'farVertical', copy: 'farVerticalText', safe: false, layers: 3,
      queens: [{z:0,r:2,c:2,role:'reference'},{z:2,r:2,c:2,role:'conflict'}],
      paths: {0:[[2,2]],1:[[2,2]],2:[[2,2]]}
    },
    {
      section: 'through', title: 'farDiagonal', copy: 'farDiagonalText', safe: false, layers: 3,
      queens: [{z:0,r:1,c:1,role:'reference'},{z:2,r:3,c:3,role:'conflict'}],
      paths: {0:[[1,1]],1:[[2,2]],2:[[3,3]]}
    }
  ];

  const style = document.createElement('style');
  style.textContent = `
    .visual-manual-btn{margin-top:10px;min-height:38px;padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.035);color:var(--text);font-size:12px;font-weight:850}
    .ux-overlay{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,8,18,.76);backdrop-filter:blur(8px)}
    .ux-overlay.open{display:flex}
    .ux-dialog{position:relative;width:min(920px,96vw);max-height:min(90vh,860px);overflow:auto;border:1px solid rgba(163,184,225,.3);border-radius:20px;background:#0d1728;color:#e8eefc;box-shadow:0 26px 80px rgba(0,0,0,.52)}
    .ux-dialog.small{width:min(390px,92vw);overflow:visible;text-align:center;padding:30px 24px 24px}
    .ux-dialog-head{position:sticky;top:0;z-index:20;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 18px 14px;background:rgba(13,23,40,.96);border-bottom:1px solid rgba(163,184,225,.18);backdrop-filter:blur(8px)}
    .ux-dialog h2{margin:0;font-size:22px}.ux-dialog h3{margin:24px 0 11px;font-size:15px;letter-spacing:.01em}.ux-dialog p{color:#aab9d0;line-height:1.55}
    .ux-close{flex:0 0 auto;width:38px;height:38px;border-radius:10px;border:1px solid rgba(163,184,225,.25);background:rgba(255,255,255,.04);color:#e8eefc;font-size:20px;line-height:1}
    .guide-body{padding:4px 18px 24px}.guide-intro{margin:13px 0 2px;max-width:760px}
    .guide-section{margin-top:4px}.scenario-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .scenario-card{min-width:0;border:1px solid rgba(163,184,225,.17);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.018));overflow:hidden}
    .scenario-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 13px 0}.scenario-title{font-size:12px;font-weight:950;color:#eef3ff}.scenario-status{flex:0 0 auto;padding:4px 7px;border-radius:999px;font-size:9px;font-weight:950;letter-spacing:.025em;border:1px solid}
    .scenario-status.safe{color:#98efb2;background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.34)}.scenario-status.attack{color:#ff9dad;background:rgba(244,63,94,.08);border-color:rgba(244,63,94,.4)}
    .scenario-copy{margin:0!important;padding:0 13px 13px;font-size:11px;line-height:1.45!important;min-height:45px}
    .scenario-visual{height:210px;display:grid;place-items:center;padding:10px 10px 4px;overflow:hidden;background:radial-gradient(circle at 50% 46%,rgba(126,148,232,.08),transparent 55%)}
    .scenario-visual.single{height:205px}
    .manual-flat-board,.manual-plane-board{display:grid;grid-template-columns:repeat(5,1fr);width:158px;height:158px;border-radius:12px;overflow:hidden;border:1px solid rgba(210,225,255,.3);box-shadow:0 14px 28px rgba(0,0,0,.23)}
    .manual-cell{position:relative;display:grid;place-items:center;min-width:0;min-height:0}
    .manual-cell.light{background:rgba(231,223,208,.94)}.manual-cell.dark{background:rgba(111,126,145,.94)}
    .manual-cell::after{content:'';position:absolute;inset:0;border:1px solid rgba(255,255,255,.08);pointer-events:none}
    .manual-cell.path::before{content:'';position:absolute;inset:10%;border-radius:5px;background:rgba(245,158,11,.26);box-shadow:inset 0 0 0 1px rgba(245,158,11,.68);z-index:1}
    .manual-queen{position:relative;z-index:4;width:72%;height:72%;display:grid;place-items:center;border-radius:50%;background:var(--mq-color);color:#fff;font-size:23px;font-weight:950;line-height:1;box-shadow:0 3px 9px rgba(0,0,0,.42),inset 0 0 0 2px rgba(255,255,255,.25)}
    .manual-queen.reference{box-shadow:0 0 0 3px rgba(235,244,255,.9),0 4px 10px rgba(0,0,0,.46),inset 0 0 0 2px rgba(255,255,255,.25)}
    .manual-queen.conflict{box-shadow:0 0 0 4px rgba(244,63,94,.95),0 4px 10px rgba(0,0,0,.46),inset 0 0 0 2px rgba(255,255,255,.25)}
    .manual-3d-stage{position:relative;width:230px;height:190px;display:grid;place-items:center;perspective:820px;perspective-origin:50% 48%}
    .manual-3d-cube{position:relative;width:142px;height:142px;transform-style:preserve-3d;transform:rotateX(58deg) rotateY(-10deg);transform-origin:center center}
    .manual-plane{position:absolute;inset:0;transform-style:preserve-3d;filter:drop-shadow(0 10px 13px rgba(0,0,0,.18))}
    .manual-plane-board{position:absolute;inset:0;width:142px;height:142px;border-color:color-mix(in srgb,var(--layer-color) 54%,rgba(210,225,255,.28));box-shadow:0 0 0 2px color-mix(in srgb,var(--layer-color) 26%,transparent)}
    .manual-layer-tag{position:absolute;right:5px;top:5px;z-index:8;padding:3px 6px;border-radius:999px;background:rgba(8,17,31,.86);border:1px solid color-mix(in srgb,var(--layer-color) 62%,transparent);color:#eef3ff;font-size:8px;font-weight:950;letter-spacing:.02em;transform:translateZ(3px)}
    .manual-plane:not(.front-most){opacity:.84}.manual-plane:not(.front-most) .manual-cell.light{background:rgba(231,223,208,.72)}.manual-plane:not(.front-most) .manual-cell.dark{background:rgba(111,126,145,.7)}
    .manual-legend{display:flex;gap:13px;flex-wrap:wrap;margin:16px 0 4px;padding:11px 12px;border-radius:12px;background:rgba(255,255,255,.022);border:1px solid rgba(163,184,225,.13);font-size:10px;color:#aab9d0}
    .manual-legend span{display:inline-flex;align-items:center;gap:7px}.legend-queen{width:18px;height:18px;border-radius:50%;background:#38bdf8;display:inline-block;box-shadow:0 0 0 2px rgba(235,244,255,.88)}.legend-queen.conflict{background:#8b5cf6;box-shadow:0 0 0 3px rgba(244,63,94,.94)}.legend-path{width:18px;height:18px;border-radius:4px;background:rgba(245,158,11,.28);box-shadow:inset 0 0 0 1px rgba(245,158,11,.7)}
    .success-mark{font-size:44px;line-height:1;margin-bottom:10px}.success-title{font-size:24px;font-weight:950;margin:0 0 6px}.success-copy{margin:0!important}.success-close{position:absolute;top:10px;right:10px}
    .confetti-field{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:1001}.confetti-piece{position:absolute;left:50%;top:48%;width:9px;height:14px;border-radius:2px;background:hsl(var(--h) 82% 62%);animation:confetti-pop 1200ms cubic-bezier(.14,.75,.24,1) forwards;animation-delay:var(--delay)}
    @keyframes confetti-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.4) rotate(0deg)}10%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1) rotate(var(--rot))}}
    @media(max-width:700px){.scenario-grid{grid-template-columns:1fr}.scenario-visual{height:220px}.scenario-visual.single{height:205px}.ux-dialog{max-height:91vh}.scenario-copy{min-height:0}}
    @media(max-width:390px){.guide-body{padding-left:11px;padding-right:11px}.ux-dialog-head{padding-left:13px;padding-right:13px}.manual-3d-stage{transform:scale(.92)}.scenario-visual{height:205px}}
    @media(prefers-reduced-motion:reduce){.confetti-piece{animation-duration:1ms}}
  `;
  document.head.appendChild(style);

  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'es'; }
  function T() { return text[lang()]; }
  function idx(r,c) { return r * BOARD_N + c; }

  function boardMarkup(scenario, z, flat = false) {
    const t = T();
    const pathCells = (scenario.paths[z] || []).map(([r,c]) => idx(r,c));
    const queens = scenario.queens.filter(q => q.z === z);
    let cells = '';

    for (let i = 0; i < BOARD_N * BOARD_N; i++) {
      const r = Math.floor(i / BOARD_N);
      const c = i % BOARD_N;
      const q = queens.find(item => item.r === r && item.c === c);
      const classes = ['manual-cell', (r + c) % 2 === 0 ? 'light' : 'dark'];
      if (pathCells.includes(i)) classes.push('path');
      let queen = '';
      if (q) {
        const role = q.role || 'normal';
        const color = LAYER_COLORS[z] || LAYER_COLORS[0];
        queen = `<span class="manual-queen ${role}" style="--mq-color:${color}">♛</span>`;
      }
      cells += `<span class="${classes.join(' ')}">${queen}</span>`;
    }

    if (flat) return `<div class="manual-flat-board" aria-hidden="true">${cells}</div>`;
    return `<div class="manual-plane-board" aria-hidden="true">${cells}</div><span class="manual-layer-tag">${t.layer} ${z + 1}</span>`;
  }

  function visualMarkup(scenario) {
    if (scenario.layers === 1) {
      return `<div class="scenario-visual single">${boardMarkup(scenario, 0, true)}</div>`;
    }

    const gap = scenario.layers === 2 ? 48 : 42;
    let planes = '';
    for (let z = 0; z < scenario.layers; z++) {
      const translate = ((scenario.layers - 1) / 2 - z) * gap;
      planes += `<div class="manual-plane ${z === 0 ? 'front-most' : ''}" style="--layer-color:${LAYER_COLORS[z]};transform:translateZ(${translate}px)">${boardMarkup(scenario, z, false)}</div>`;
    }
    return `<div class="scenario-visual"><div class="manual-3d-stage"><div class="manual-3d-cube">${planes}</div></div></div>`;
  }

  function scenarioCard(scenario) {
    const t = T();
    return `
      <article class="scenario-card">
        <div class="scenario-card-head">
          <div class="scenario-title">${t[scenario.title]}</div>
          <span class="scenario-status ${scenario.safe ? 'safe' : 'attack'}">${scenario.safe ? t.safe : t.attack}</span>
        </div>
        ${visualMarkup(scenario)}
        <p class="scenario-copy">${t[scenario.copy]}</p>
      </article>`;
  }

  function sectionMarkup(sectionKey) {
    const t = T();
    const cards = scenarios.filter(s => s.section === sectionKey).map(scenarioCard).join('');
    return `<section class="guide-section"><h3>${t[sectionKey]}</h3><div class="scenario-grid">${cards}</div></section>`;
  }

  let manualBtn = null;
  if (rules) {
    manualBtn = rules.querySelector('.visual-manual-btn');
    if (!manualBtn) {
      manualBtn = document.createElement('button');
      manualBtn.type = 'button';
      manualBtn.className = 'visual-manual-btn';
      rules.appendChild(manualBtn);
    }
  }

  const manualOverlay = document.createElement('div');
  manualOverlay.className = 'ux-overlay';
  manualOverlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(manualOverlay);

  const successOverlay = document.createElement('div');
  successOverlay.className = 'ux-overlay';
  successOverlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(successOverlay);

  function renderManual() {
    const t = T();
    if (manualBtn) manualBtn.textContent = t.manual;
    manualOverlay.innerHTML = `
      <div class="ux-dialog" role="dialog" aria-modal="true" aria-labelledby="guideTitle">
        <div class="ux-dialog-head">
          <div><h2 id="guideTitle">${t.guideTitle}</h2></div>
          <button type="button" class="ux-close" aria-label="${t.close}" title="${t.close}">×</button>
        </div>
        <div class="guide-body">
          <p class="guide-intro">${t.guideIntro}</p>
          <div class="manual-legend">
            <span><i class="legend-queen"></i>${t.reference}</span>
            <span><i class="legend-queen conflict"></i>${t.conflict}</span>
            <span><i class="legend-path"></i>${t.path}</span>
          </div>
          ${sectionMarkup('sameLayer')}
          ${sectionMarkup('between')}
          ${sectionMarkup('through')}
        </div>
      </div>`;
    manualOverlay.querySelector('.ux-close')?.addEventListener('click', closeManual);
  }

  function openManual() {
    renderManual();
    manualOverlay.classList.add('open');
    manualOverlay.setAttribute('aria-hidden','false');
    manualOverlay.querySelector('.ux-close')?.focus();
  }

  function closeManual() {
    manualOverlay.classList.remove('open');
    manualOverlay.setAttribute('aria-hidden','true');
    manualBtn?.focus();
  }

  manualBtn?.addEventListener('click', openManual);
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
    successOverlay.innerHTML = `
      <div class="ux-dialog small" role="dialog" aria-modal="true" aria-labelledby="successTitle">
        <button type="button" class="ux-close success-close" aria-label="${t.close}" title="${t.close}">×</button>
        <div class="success-mark">♛</div>
        <div id="successTitle" class="success-title">${t.congrats}</div>
        <p class="success-copy">${t.solved}</p>
      </div>`;
    successOverlay.classList.add('open');
    successOverlay.setAttribute('aria-hidden','false');
    successOverlay.querySelector('.ux-close')?.addEventListener('click', closeSuccess);
    successOverlay.querySelector('.ux-close')?.focus();
    spawnConfetti();
  }

  function closeSuccess() {
    successOverlay.classList.remove('open');
    successOverlay.setAttribute('aria-hidden','true');
    checkBtn?.focus();
  }

  successOverlay.addEventListener('click', e => { if (e.target === successOverlay) closeSuccess(); });

  checkBtn?.addEventListener('click', () => {
    setTimeout(() => {
      if (result?.classList.contains('ok')) openSuccess();
    }, 0);
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (successOverlay.classList.contains('open')) closeSuccess();
    else if (manualOverlay.classList.contains('open')) closeManual();
  });

  const langObserver = new MutationObserver(() => {
    if (manualBtn) manualBtn.textContent = T().manual;
    if (manualOverlay.classList.contains('open')) renderManual();
  });
  langObserver.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});

  if (manualBtn) manualBtn.textContent = T().manual;
})();
