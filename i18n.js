(() => {
  const copy = {
    es: {
      title: 'Reinas en un cubo',
      goal: '<b>Objetivo:</b> coloca el mayor número de reinas que puedas sin que ninguna ataque a otra. Cuando creas haber encontrado el máximo, verifica tu intento.',
      rulesTitle: 'Reglas de ataque',
      rules: [
        'Una reina ataca en fila, columna o diagonal dentro de su capa.',
        'También ataca directamente entre capas y por diagonales que atraviesan el cubo.',
        'Puedes colocar una reina en cualquier casilla; las ayudas solo resaltan información y nunca bloquean movimientos.'
      ],
      cells: 'casillas', view: 'Vista', perspective: 'Perspectiva', front: 'Frente', original: 'Vista original',
      spacing: 'Separación de capas', aids: 'Ayudas', attacked: 'Casillas atacadas', conflicts: 'Reinas en conflicto',
      layers: 'Capas', layer: 'Capa', top: 'Arriba', bottom: 'Abajo', reset: 'Reiniciar', check: 'Verificar intento',
      unchecked: 'Sin verificar', correct: 'Correcto.', incorrect: 'Incorrecto.',
      sizeAria: 'Tamaño del puzzle', layerAria: 'Seleccionar capa', boardAria: 'Tablero tridimensional', spacingAria: 'Separación entre capas'
    },
    en: {
      title: 'Queens in a Cube',
      goal: '<b>Objective:</b> place as many queens as possible without any queen attacking another. When you think you have found the maximum, check your attempt.',
      rulesTitle: 'Attack rules',
      rules: [
        'A queen attacks along rows, columns, and diagonals within its own layer.',
        'It also attacks directly between layers and along diagonals that pass through the cube.',
        'You may place a queen on any square; the optional aids only highlight information and never block moves.'
      ],
      cells: 'squares', view: 'View', perspective: 'Perspective', front: 'Front', original: 'Original view',
      spacing: 'Layer spacing', aids: 'Aids', attacked: 'Attacked squares', conflicts: 'Queens in conflict',
      layers: 'Layers', layer: 'Layer', top: 'Top', bottom: 'Bottom', reset: 'Reset', check: 'Check attempt',
      unchecked: 'Not checked', correct: 'Correct.', incorrect: 'Incorrect.',
      sizeAria: 'Puzzle size', layerAria: 'Select layer', boardAria: 'Three-dimensional board', spacingAria: 'Spacing between layers'
    }
  };

  let lang;
  try {
    lang = localStorage.getItem('queens-language');
  } catch (_) {}
  if (lang !== 'es' && lang !== 'en') lang = navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';

  const style = document.createElement('style');
  style.textContent = `
    .i18n-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:2px}
    .i18n-switch{display:flex;gap:3px;padding:3px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,.025);flex:0 0 auto}
    .i18n-btn{min-width:42px;min-height:32px;border:0;border-radius:7px;background:transparent;color:var(--muted);font-size:11px;font-weight:850;letter-spacing:.04em}
    .i18n-btn.active{background:var(--accent-soft);color:#fff;box-shadow:inset 0 0 0 1px rgba(126,148,232,.4)}
  `;
  document.head.appendChild(style);

  const introLead = document.querySelector('.intro > div:first-child');
  const eyebrow = introLead?.querySelector('.eyebrow');
  let esBtn, enBtn;
  if (introLead && eyebrow) {
    const head = document.createElement('div');
    head.className = 'i18n-head';
    introLead.insertBefore(head, eyebrow);
    head.appendChild(eyebrow);

    const sw = document.createElement('div');
    sw.className = 'i18n-switch';
    sw.setAttribute('aria-label', 'Language / Idioma');
    esBtn = document.createElement('button');
    enBtn = document.createElement('button');
    for (const [button, code] of [[esBtn, 'es'], [enBtn, 'en']]) {
      button.type = 'button';
      button.className = 'i18n-btn';
      button.textContent = code.toUpperCase();
      button.addEventListener('click', () => setLanguage(code));
      sw.appendChild(button);
    }
    head.appendChild(sw);
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function setButtonText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const textNode = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (textNode) textNode.textContent = value;
    else if (!el.querySelector('.assist-dot')) el.textContent = value;
  }

  function translateLayers(L) {
    const buttons = [...document.querySelectorAll('.layer-btn')];
    buttons.forEach((button, i) => {
      const name = button.querySelector('.layer-name');
      const pos = button.querySelector('.layer-pos');
      const nameText = `${L.layer} ${i + 1}`;
      const posText = i === 0 ? L.top : i === buttons.length - 1 ? L.bottom : '';
      if (name && name.textContent !== nameText) name.textContent = nameText;
      if (pos && pos.textContent !== posText) pos.textContent = posText;
    });
  }

  function translateResult(L) {
    const result = document.getElementById('result');
    if (!result) return;
    const value = result.classList.contains('ok') ? L.correct : result.classList.contains('bad') ? L.incorrect : L.unchecked;
    if (result.textContent !== value) result.textContent = value;
  }

  let translating = false;
  function translateDynamic() {
    if (translating) return;
    translating = true;
    const L = copy[lang];
    translateLayers(L);
    translateResult(L);
    translating = false;
  }

  function applyLanguage() {
    const L = copy[lang];
    document.documentElement.lang = lang;
    document.title = lang === 'es' ? '3D Queens Challenge — Reinas 3D' : '3D Queens Challenge — 3D Queens';

    setText('.intro h1', L.title);
    const goal = document.querySelector('.goal');
    if (goal) goal.innerHTML = L.goal;
    setText('.rules-title', L.rulesTitle);
    document.querySelectorAll('.rules li').forEach((el, i) => { if (L.rules[i]) el.textContent = L.rules[i]; });

    document.querySelectorAll('.size-btn small').forEach((el, i) => {
      const count = [27, 64, 125][i];
      if (count) el.textContent = `${count} ${L.cells}`;
    });

    const titles = document.querySelectorAll('.control-title');
    if (titles[0]) titles[0].textContent = L.view;
    if (titles[1]) titles[1].textContent = L.spacing;
    if (titles[2]) titles[2].textContent = L.aids;

    setButtonText('perspective', L.perspective);
    setButtonText('front', L.front);
    setButtonText('original', L.original);
    setButtonText('showAttacked', L.attacked);
    setButtonText('showConflicts', L.conflicts);
    setText('.rail-title', L.layers);
    setButtonText('resetPieces', L.reset);
    setButtonText('check', L.check);

    document.querySelector('.size-strip')?.setAttribute('aria-label', L.sizeAria);
    document.getElementById('layerRail')?.setAttribute('aria-label', L.layerAria);
    document.getElementById('cube')?.setAttribute('aria-label', L.boardAria);
    document.getElementById('separation')?.setAttribute('aria-label', L.spacingAria);

    if (esBtn && enBtn) {
      esBtn.classList.toggle('active', lang === 'es');
      enBtn.classList.toggle('active', lang === 'en');
      esBtn.setAttribute('aria-pressed', String(lang === 'es'));
      enBtn.setAttribute('aria-pressed', String(lang === 'en'));
    }
    translateDynamic();
  }

  function setLanguage(next) {
    lang = next;
    try { localStorage.setItem('queens-language', lang); } catch (_) {}
    applyLanguage();
  }

  const layerRail = document.getElementById('layerRail');
  const result = document.getElementById('result');
  let queued = false;
  const observer = new MutationObserver(() => {
    if (translating || queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      translateDynamic();
    });
  });
  if (layerRail) observer.observe(layerRail, {childList:true, subtree:true, characterData:true});
  if (result) observer.observe(result, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class']});

  applyLanguage();
})();
