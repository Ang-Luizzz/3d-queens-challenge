(() => {
  const checkBtn = document.getElementById('check');
  const result = document.getElementById('result');
  const rules = document.querySelector('.rules');

  const text = {
    es: {
      manual: 'Manual visual', close: 'Cerrar', guideTitle: 'Cómo atacan las reinas',
      guideIntro: 'Estos diagramas muestran las relaciones de ataque que usa el tablero. Son ejemplos visuales, no pistas sobre la solución.',
      sameLayer: 'Dentro de una capa', alone: 'Una reina sola', row: 'Misma fila', column: 'Misma columna', diagonal: 'Diagonal',
      safe: 'Sin otra reina alineada, no hay conflicto.', rowText: 'Una reina al lado en la misma fila es atacada.', columnText: 'Lo mismo ocurre arriba o abajo en la misma columna.', diagonalText: 'Cualquier diagonal dentro de la capa también cuenta.',
      between: 'Entre capas', betweenText: 'Al pasar una capa, la reina también ataca la misma posición y posiciones desplazadas un paso en fila, columna o diagonal.',
      three: 'Con una capa intermedia', threeText: 'Si la otra reina está dos capas más lejos, el desplazamiento lateral o diagonal que forma una línea de ataque avanza dos casillas. La misma lógica continúa en profundidad.',
      example: 'Ejemplo', source: 'Reina', attacked: 'Atacada', layer1: 'Capa 1', layer2: 'Capa 2', layer3: 'Capa 3',
      congrats: '¡Felicidades!', solved: 'Resolviste este reto correctamente.'
    },
    en: {
      manual: 'Visual guide', close: 'Close', guideTitle: 'How queens attack',
      guideIntro: 'These diagrams show the attack relationships used by the board. They are visual examples, not solution hints.',
      sameLayer: 'Within one layer', alone: 'A queen alone', row: 'Same row', column: 'Same column', diagonal: 'Diagonal',
      safe: 'With no aligned queen, there is no conflict.', rowText: 'A queen beside it on the same row is attacked.', columnText: 'The same applies above or below in the same column.', diagonalText: 'Any diagonal within the layer also counts.',
      between: 'Between layers', betweenText: 'One layer away, the queen also attacks the same position and positions shifted one step by row, column, or diagonal.',
      three: 'With a layer in between', threeText: 'If the other queen is two layers away, a lateral or diagonal attack line advances two squares. The same relationship continues through depth.',
      example: 'Example', source: 'Queen', attacked: 'Attacked', layer1: 'Layer 1', layer2: 'Layer 2', layer3: 'Layer 3',
      congrats: 'Congratulations!', solved: 'You solved this challenge correctly.'
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    .visual-manual-btn{margin-top:10px;min-height:38px;padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,.035);color:var(--text);font-size:12px;font-weight:850}
    .ux-overlay{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,8,18,.76);backdrop-filter:blur(8px)}
    .ux-overlay.open{display:flex}
    .ux-dialog{position:relative;width:min(760px,96vw);max-height:min(88vh,780px);overflow:auto;border:1px solid rgba(163,184,225,.3);border-radius:20px;background:#0d1728;color:#e8eefc;box-shadow:0 26px 80px rgba(0,0,0,.52)}
    .ux-dialog.small{width:min(390px,92vw);overflow:visible;text-align:center;padding:30px 24px 24px}
    .ux-dialog-head{position:sticky;top:0;z-index:5;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 18px 14px;background:rgba(13,23,40,.96);border-bottom:1px solid rgba(163,184,225,.18);backdrop-filter:blur(8px)}
    .ux-dialog h2{margin:0;font-size:22px}.ux-dialog h3{margin:22px 0 10px;font-size:15px}.ux-dialog p{color:#aab9d0;line-height:1.55}
    .ux-close{flex:0 0 auto;width:38px;height:38px;border-radius:10px;border:1px solid rgba(163,184,225,.25);background:rgba(255,255,255,.04);color:#e8eefc;font-size:20px;line-height:1}
    .guide-body{padding:4px 18px 22px}.guide-intro{margin:12px 0 2px}
    .diagram-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
    .diagram-card{min-width:0;padding:11px;border:1px solid rgba(163,184,225,.16);border-radius:14px;background:rgba(255,255,255,.025)}
    .diagram-title{font-size:11px;font-weight:900;margin-bottom:8px}.diagram-copy{margin:8px 0 0!important;font-size:10px;line-height:1.4!important}
    .mini-board{display:grid;grid-template-columns:repeat(5,1fr);aspect-ratio:1;border:1px solid rgba(255,255,255,.15);border-radius:7px;overflow:hidden}
    .mini-cell{display:grid;place-items:center;position:relative;font-size:13px;background:rgba(222,226,232,.72);color:#08111f}.mini-cell:nth-child(odd){background:rgba(105,120,140,.8)}
    .mini-cell.q{background:#476fe5;color:white;font-size:17px;font-weight:900}.mini-cell.hit{background:#ef647d;color:#fff;font-weight:950}.mini-cell.hit::after{content:'×'}
    .layer-examples{display:grid;grid-template-columns:1fr 1fr;gap:12px}.layer-stack{display:grid;gap:6px;padding:12px;border:1px solid rgba(163,184,225,.16);border-radius:14px;background:rgba(255,255,255,.025)}
    .layer-row{display:grid;grid-template-columns:62px minmax(0,150px) 1fr;align-items:center;gap:9px}.layer-label{font-size:10px;font-weight:900;color:#b9c6da}.layer-note{font-size:10px;color:#9dacbf;line-height:1.35}.layer-arrow{text-align:center;color:#7f95e8;font-weight:900;font-size:16px}
    .legend{display:flex;gap:14px;flex-wrap:wrap;margin:14px 0 0;font-size:10px;color:#aab9d0}.legend span{display:inline-flex;align-items:center;gap:6px}.legend-dot{width:12px;height:12px;border-radius:3px;background:#476fe5}.legend-dot.hit{background:#ef647d}
    .success-mark{font-size:44px;line-height:1;margin-bottom:10px}.success-title{font-size:24px;font-weight:950;margin:0 0 6px}.success-copy{margin:0!important}.success-close{position:absolute;top:10px;right:10px}
    .confetti-field{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:1001}.confetti-piece{position:absolute;left:50%;top:48%;width:9px;height:14px;border-radius:2px;background:hsl(var(--h) 82% 62%);animation:confetti-pop 1200ms cubic-bezier(.14,.75,.24,1) forwards;animation-delay:var(--delay)}
    @keyframes confetti-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.4) rotate(0deg)}10%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1) rotate(var(--rot))}}
    @media(max-width:640px){.diagram-grid{grid-template-columns:1fr 1fr}.layer-examples{grid-template-columns:1fr}.layer-row{grid-template-columns:52px minmax(0,125px) 1fr}.ux-dialog{max-height:90vh}}
    @media(max-width:390px){.diagram-grid{grid-template-columns:1fr}.layer-row{grid-template-columns:44px minmax(0,112px) 1fr}.guide-body{padding-left:12px;padding-right:12px}}
    @media(prefers-reduced-motion:reduce){.confetti-piece{animation-duration:1ms}}
  `;
  document.head.appendChild(style);

  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'es'; }
  function T() { return text[lang()]; }

  function miniBoard(queenIndex, hitIndexes = []) {
    let html = '<div class="mini-board" aria-hidden="true">';
    for (let i = 0; i < 25; i++) {
      const cls = i === queenIndex ? 'mini-cell q' : hitIndexes.includes(i) ? 'mini-cell hit' : 'mini-cell';
      html += `<span class="${cls}">${i === queenIndex ? '♛' : ''}</span>`;
    }
    return html + '</div>';
  }

  function layerRow(label, queen, hits, note) {
    return `<div class="layer-row"><div class="layer-label">${label}</div>${miniBoard(queen, hits)}<div class="layer-note">${note}</div></div>`;
  }

  let manualBtn = null;
  if (rules) {
    manualBtn = document.createElement('button');
    manualBtn.type = 'button';
    manualBtn.className = 'visual-manual-btn';
    rules.appendChild(manualBtn);
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
        <div class="ux-dialog-head"><div><h2 id="guideTitle">${t.guideTitle}</h2></div><button type="button" class="ux-close" aria-label="${t.close}" title="${t.close}">×</button></div>
        <div class="guide-body">
          <p class="guide-intro">${t.guideIntro}</p>
          <h3>${t.sameLayer}</h3>
          <div class="diagram-grid">
            <div class="diagram-card"><div class="diagram-title">${t.alone}</div>${miniBoard(12)}<p class="diagram-copy">${t.safe}</p></div>
            <div class="diagram-card"><div class="diagram-title">${t.row}</div>${miniBoard(12,[13])}<p class="diagram-copy">${t.rowText}</p></div>
            <div class="diagram-card"><div class="diagram-title">${t.column}</div>${miniBoard(12,[7])}<p class="diagram-copy">${t.columnText}</p></div>
            <div class="diagram-card"><div class="diagram-title">${t.diagonal}</div>${miniBoard(12,[6])}<p class="diagram-copy">${t.diagonalText}</p></div>
          </div>

          <h3>${t.between}</h3>
          <p>${t.betweenText}</p>
          <div class="layer-stack">
            ${layerRow(t.layer1,12,[],t.source)}
            <div class="layer-arrow">↓</div>
            ${layerRow(t.layer2,-1,[12,13,8],t.attacked)}
          </div>

          <h3>${t.three}</h3>
          <p>${t.threeText}</p>
          <div class="layer-stack">
            ${layerRow(t.layer1,12,[],t.source)}
            <div class="layer-arrow">↓</div>
            ${layerRow(t.layer2,-1,[],t.example)}
            <div class="layer-arrow">↓</div>
            ${layerRow(t.layer3,-1,[12,24,14],t.attacked)}
          </div>
          <div class="legend"><span><i class="legend-dot"></i>${t.source}</span><span><i class="legend-dot hit"></i>${t.attacked}</span></div>
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

  renderManual();
})();
