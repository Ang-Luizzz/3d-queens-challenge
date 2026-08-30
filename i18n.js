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
      cells: 'casillas', view: 'Vista', perspective: 'Perspectiva', front: 'Frente', back: 'Atrás', original: 'Diagonal',
      spacing: 'Separación de capas', aids: 'Ayudas', attacked: 'Casillas atacadas', conflicts: 'Reinas en conflicto',
      layers: 'Capas', layer: 'Capa', top: 'Arriba', bottom: 'Abajo', reset: 'Reiniciar', check: 'Verificar intento',
      unchecked: 'Sin verificar', correct: 'Correcto.', incorrect: 'Incorrecto.',
      zoomOut: 'Alejar', zoomIn: 'Acercar', center: 'Centrar',
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
      cells: 'squares', view: 'View', perspective: 'Perspective', front: 'Front', back: 'Back', original: 'Diagonal',
      spacing: 'Layer spacing', aids: 'Aids', attacked: 'Attacked squares', conflicts: 'Queens in conflict',
      layers: 'Layers', layer: 'Layer', top: 'Top', bottom: 'Bottom', reset: 'Reset', check: 'Check attempt',
      unchecked: 'Not checked', correct: 'Correct.', incorrect: 'Incorrect.',
      zoomOut: 'Zoom out', zoomIn: 'Zoom in', center: 'Center',
      sizeAria: 'Puzzle size', layerAria: 'Select layer', boardAria: 'Three-dimensional board', spacingAria: 'Spacing between layers'
    }
  };

  let lang = 'es';
  try {
    const saved = localStorage.getItem('queens-language');
    if (saved === 'es' || saved === 'en') lang = saved;
  } catch (_) {}

  const style = document.createElement('style');
  style.textContent = `
    .intro{position:relative}
    .i18n-switch{position:absolute;top:-14px;right:14px;z-index:60;display:flex;gap:2px;padding:3px;border:1px solid var(--border);border-radius:10px;background:#101a2d;box-shadow:0 5px 14px rgba(0,0,0,.28)}
    .i18n-btn{min-width:38px;height:28px;padding:0 8px;border:0;border-radius:7px;background:transparent;color:var(--muted);font-size:10px;line-height:28px;font-weight:900;letter-spacing:.05em}
    .i18n-btn.active{background:var(--accent-soft);color:#fff;box-shadow:inset 0 0 0 1px rgba(126,148,232,.42)}
    @media(max-width:590px){.i18n-switch{top:-12px;right:10px}.i18n-btn{min-width:36px;height:27px;line-height:27px}}
  `;
  document.head.appendChild(style);

  const intro = document.querySelector('.intro');
  const sw = document.createElement('div');
  sw.className = 'i18n-switch';
  sw.setAttribute('role', 'group');
  sw.setAttribute('aria-label', 'Idioma / Language');

  const esBtn = document.createElement('button');
  const enBtn = document.createElement('button');
  for (const [button, code] of [[esBtn, 'es'], [enBtn, 'en']]) {
    button.type = 'button';
    button.className = 'i18n-btn';
    button.textContent = code.toUpperCase();
    button.setAttribute('aria-label', code === 'es' ? 'Español' : 'English');
    button.addEventListener('click', () => setLanguage(code));
    sw.appendChild(button);
  }
  if (intro) intro.appendChild(sw);

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el && el.textContent !== value) el.textContent = value;
  }

  function setButton(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const dot = el.querySelector('.assist-dot');
    if (!dot) {
      if (el.textContent !== value) el.textContent = value;
      return;
    }
    let textNode = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
    if (!textNode) {
      textNode = document.createTextNode('');
      el.appendChild(textNode);
    }
    if (textNode.nodeValue.trim() !== value) textNode.nodeValue = value;
  }

  function setControlTitleFromControl(control, value, rootSelector = '.control-block') {
    const el = typeof control === 'string' ? document.querySelector(control) : control;
    const root = el?.closest(rootSelector);
    const title = root?.querySelector('.control-title');
    if (title && title.textContent !== value) title.textContent = value;
  }

  function translateDynamic() {
    const L = copy[lang];
    const buttons = [...document.querySelectorAll('.layer-btn')];
    buttons.forEach((button, i) => {
      const name = button.querySelector('.layer-name');
      const pos = button.querySelector('.layer-pos');
      const nextName = `${L.layer} ${i + 1}`;
      const nextPos = i === 0 ? L.top : i === buttons.length - 1 ? L.bottom : '';
      if (name && name.textContent !== nextName) name.textContent = nextName;
      if (pos && pos.textContent !== nextPos) pos.textContent = nextPos;
    });

    const result = document.getElementById('result');
    if (result) {
      const nextResult = result.classList.contains('ok') ? L.correct : result.classList.contains('bad') ? L.incorrect : L.unchecked;
      if (result.textContent !== nextResult) result.textContent = nextResult;
    }
  }

  function applyLanguage() {
    const L = copy[lang];
    document.documentElement.lang = lang;
    document.title = lang === 'es' ? '3D Queens Challenge — Reinas 3D' : '3D Queens Challenge — 3D Queens';

    setText('.intro h1', L.title);
    const goal = document.querySelector('.goal');
    if (goal && goal.innerHTML !== L.goal) goal.innerHTML = L.goal;
    setText('.rules-title', L.rulesTitle);
    document.querySelectorAll('.rules li').forEach((el, i) => {
      if (L.rules[i] && el.textContent !== L.rules[i]) el.textContent = L.rules[i];
    });

    document.querySelectorAll('.size-btn small').forEach((el, i) => {
      const count = [27, 64, 125][i];
      const next = count ? `${count} ${L.cells}` : '';
      if (next && el.textContent !== next) el.textContent = next;
    });

    // These blocks are moved around after initial load. Identify each title by
    // the control it actually belongs to instead of relying on DOM order.
    setControlTitleFromControl('#original', L.view);
    setControlTitleFromControl('#separation', L.spacing);
    setControlTitleFromControl('#showAttacked', L.aids, '.assist-control');

    setButton('perspective', L.perspective);
    setButton('front', L.front);
    setButton('back', L.back);
    setButton('original', L.original);
    setButton('showAttacked', L.attacked);
    setButton('showConflicts', L.conflicts);
    setText('.rail-title', L.layers);
    setButton('resetPieces', L.reset);
    setButton('check', L.check);

    const zoomOut = document.getElementById('zoomOut');
    const zoomIn = document.getElementById('zoomIn');
    const center = document.getElementById('centerView');
    if (zoomOut) { zoomOut.setAttribute('aria-label', L.zoomOut); zoomOut.title = L.zoomOut; }
    if (zoomIn) { zoomIn.setAttribute('aria-label', L.zoomIn); zoomIn.title = L.zoomIn; }
    if (center) { center.setAttribute('aria-label', L.center); center.title = L.center; }

    document.querySelector('.size-strip')?.setAttribute('aria-label', L.sizeAria);
    document.getElementById('layerRail')?.setAttribute('aria-label', L.layerAria);
    document.getElementById('cube')?.setAttribute('aria-label', L.boardAria);
    document.getElementById('separation')?.setAttribute('aria-label', L.spacingAria);

    esBtn.classList.toggle('active', lang === 'es');
    enBtn.classList.toggle('active', lang === 'en');
    esBtn.setAttribute('aria-pressed', String(lang === 'es'));
    enBtn.setAttribute('aria-pressed', String(lang === 'en'));

    translateDynamic();
  }

  function setLanguage(next) {
    if (next !== 'es' && next !== 'en') return;
    lang = next;
    try { localStorage.setItem('queens-language', lang); } catch (_) {}
    applyLanguage();
  }

  document.addEventListener('click', () => {
    queueMicrotask(translateDynamic);
  });

  applyLanguage();
})();
