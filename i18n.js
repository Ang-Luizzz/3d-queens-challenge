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
      cells: 'casillas',
      view: 'Vista',
      perspective: 'Perspectiva',
      front: 'Frente',
      original: 'Vista original',
      spacing: 'Separación de capas',
      aids: 'Ayudas',
      attacked: 'Casillas atacadas',
      conflicts: 'Reinas en conflicto',
      layers: 'Capas',
      layer: 'Capa',
      top: 'Arriba',
      bottom: 'Abajo',
      reset: 'Reiniciar',
      check: 'Verificar intento',
      unchecked: 'Sin verificar',
      correct: 'Correcto.',
      incorrect: 'Incorrecto.',
      sizeAria: 'Tamaño del puzzle',
      layerAria: 'Seleccionar capa',
      boardAria: 'Tablero tridimensional',
      spacingAria: 'Separación entre capas'
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
      cells: 'squares',
      view: 'View',
      perspective: 'Perspective',
      front: 'Front',
      original: 'Original view',
      spacing: 'Layer spacing',
      aids: 'Aids',
      attacked: 'Attacked squares',
      conflicts: 'Queens in conflict',
      layers: 'Layers',
      layer: 'Layer',
      top: 'Top',
      bottom: 'Bottom',
      reset: 'Reset',
      check: 'Check attempt',
      unchecked: 'Not checked',
      correct: 'Correct.',
      incorrect: 'Incorrect.',
      sizeAria: 'Puzzle size',
      layerAria: 'Select layer',
      boardAria: 'Three-dimensional board',
      spacingAria: 'Spacing between layers'
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
    .i18n-switch{
      position:absolute;
      top:-14px;
      right:14px;
      z-index:60;
      display:flex;
      gap:2px;
      padding:3px;
      border:1px solid var(--border);
      border-radius:10px;
      background:#101a2d;
      box-shadow:0 5px 14px rgba(0,0,0,.28)
    }
    .i18n-btn{
      min-width:38px;
      height:28px;
      padding:0 8px;
      border:0;
      border-radius:7px;
      background:transparent;
      color:var(--muted);
      font-size:10px;
      line-height:28px;
      font-weight:900;
      letter-spacing:.05em
    }
    .i18n-btn.active{
      background:var(--accent-soft);
      color:#fff;
      box-shadow:inset 0 0 0 1px rgba(126,148,232,.42)
    }
    @media(max-width:590px){
      .i18n-switch{top:-12px;right:10px}
      .i18n-btn{min-width:36px;height:27px;line-height:27px}
    }
  `;
  document.head.appendChild(style);

  const intro = document.querySelector('.intro');
  let esBtn = null;
  let enBtn = null;

  if (intro) {
    const sw = document.createElement('div');
    sw.className = 'i18n-switch';
    sw.setAttribute('role', 'group');
    sw.setAttribute('aria-label', 'Idioma / Language');

    esBtn = document.createElement('button');
    enBtn = document.createElement('button');

    for (const [button, code] of [[esBtn, 'es'], [enBtn, 'en']]) {
      button.type = 'button';
      button.className = 'i18n-btn';
      button.textContent = code.toUpperCase();
      button.setAttribute('aria-label', code === 'es' ? 'Español' : 'English');
      button.addEventListener('click', () => setLanguage(code));
      sw.appendChild(button);
    }

    intro.appendChild(sw);
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function setButtonText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;

    const textNodes = [...el.childNodes].filter(
      n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
    );

    if (textNodes.length) {
      textNodes[textNodes.length - 1].textContent = ' ' + value;
      return;
    }

    if (!el.children.length) el.textContent = value;
  }

  function translateLayers(L) {
    const buttons = [...document.querySelectorAll('.layer-btn')];
    buttons.forEach((button, i) => {
      const name = button.querySelector('.layer-name');
      const pos = button.querySelector('.layer-pos');
      if (name) name.textContent = `${L.layer} ${i + 1}`;
      if (pos) pos.textContent = i === 0 ? L.top : i === buttons.length - 1 ? L.bottom : '';
    });
  }

  function translateResult(L) {
    const el = document.getElementById('result');
    if (!el) return;
    el.textContent = el.classList.contains('ok')
      ? L.correct
      : el.classList.contains('bad')
        ? L.incorrect
        : L.unchecked;
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
    document.title = lang === 'es'
      ? '3D Queens Challenge — Reinas 3D'
      : '3D Queens Challenge — 3D Queens';

    setText('.intro h1', L.title);

    const goal = document.querySelector('.goal');
    if (goal) goal.innerHTML = L.goal;

    setText('.rules-title', L.rulesTitle);
    document.querySelectorAll('.rules li').forEach((el, i) => {
      if (L.rules[i]) el.textContent = L.rules[i];
    });

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
    if (next !== 'es' && next !== 'en') return;
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

  if (layerRail) {
    observer.observe(layerRail, {childList:true, subtree:true, characterData:true});
  }

  if (result) {
    observer.observe(result, {
      childList:true,
      subtree:true,
      characterData:true,
      attributes:true,
      attributeFilter:['class']
    });
  }

  applyLanguage();
})();
