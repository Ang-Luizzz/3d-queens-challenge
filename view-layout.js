(() => {
  const stage = document.getElementById('stage');
  const scene = document.querySelector('.scene');
  const cube = document.getElementById('cube');
  const perspectiveBtn = document.getElementById('perspective');
  const frontBtn = document.getElementById('front');
  const originalBtn = document.getElementById('original');
  const separation = document.getElementById('separation');
  const boardLayout = document.querySelector('.board-layout');
  const layerRail = document.getElementById('layerRail');
  const actionbar = document.querySelector('.actionbar');
  const sizeButtons = [...document.querySelectorAll('.size-btn')];

  if (!stage || !scene || !cube || !perspectiveBtn || !frontBtn || !originalBtn || !boardLayout) return;

  const gameCard = boardLayout.parentElement;
  const segmented = perspectiveBtn.parentElement;

  // Put layer selection above the viewport and verification below it.
  if (layerRail && gameCard) {
    layerRail.classList.add('layer-rail-horizontal');
    gameCard.insertBefore(layerRail, boardLayout);
  }
  if (actionbar) {
    actionbar.classList.remove('actionbar-top');
    boardLayout.insertAdjacentElement('afterend', actionbar);
  }

  // Add the reverse/front-opposite view.
  let backBtn = document.getElementById('back');
  if (!backBtn) {
    backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.id = 'back';
    backBtn.className = 'ctrl-btn';
  }

  if (segmented) {
    segmented.append(originalBtn, frontBtn, backBtn, perspectiveBtn);
  }

  // Camera wrapper: cube rotation remains owned by the original game, while
  // this wrapper handles pan and zoom independently.
  let camera = scene.querySelector('.camera-transform');
  if (!camera) {
    camera = document.createElement('div');
    camera.className = 'camera-transform';
    cube.parentNode.insertBefore(camera, cube);
    camera.appendChild(cube);
  }

  const cameraTools = document.createElement('div');
  cameraTools.className = 'camera-tools';
  cameraTools.setAttribute('role', 'group');
  cameraTools.innerHTML = `
    <button type="button" id="zoomOut" class="camera-btn" aria-label="Alejar" title="Alejar">−</button>
    <button type="button" id="zoomIn" class="camera-btn" aria-label="Acercar" title="Acercar">+</button>
    <button type="button" id="centerView" class="camera-btn camera-center" aria-label="Centrar" title="Centrar">◎</button>
    <button type="button" id="levelView" class="camera-btn camera-level" aria-label="Nivelar" title="Nivelar">0°</button>
  `;
  stage.appendChild(cameraTools);

  const zoomOutBtn = cameraTools.querySelector('#zoomOut');
  const zoomInBtn = cameraTools.querySelector('#zoomIn');
  const centerBtn = cameraTools.querySelector('#centerView');
  const levelBtn = cameraTools.querySelector('#levelView');

  let internalDrive = false;
  let manualStart = null;
  let panX = 0;
  let panY = 0;
  let zoom = 1;

  const ORIGINAL_BASE_X = -56;
  const ORIGINAL_BASE_Y = 32;
  const MIN_ZOOM = .72;
  const MAX_ZOOM = 1.6;
  const TWIST_START_DEGREES = 4;

  function puzzleSize() {
    return cube.querySelectorAll('.plane').length || 3;
  }

  function labels() {
    return document.documentElement.lang === 'en'
      ? { layers: 'Layers', back: 'Back', zoomOut: 'Zoom out', zoomIn: 'Zoom in', center: 'Center', level: 'Level' }
      : { layers: 'Capas', back: 'Atrás', zoomOut: 'Alejar', zoomIn: 'Acercar', center: 'Centrar', level: 'Nivelar' };
  }

  function fixLabels() {
    const t = labels();
    if (perspectiveBtn.textContent.trim() !== t.layers) perspectiveBtn.textContent = t.layers;
    if (backBtn.textContent.trim() !== t.back) backBtn.textContent = t.back;
    zoomOutBtn.setAttribute('aria-label', t.zoomOut);
    zoomOutBtn.title = t.zoomOut;
    zoomInBtn.setAttribute('aria-label', t.zoomIn);
    zoomInBtn.title = t.zoomIn;
    centerBtn.setAttribute('aria-label', t.center);
    centerBtn.title = t.center;
    levelBtn.setAttribute('aria-label', t.level);
    levelBtn.title = t.level;
  }

  function movementBounds() {
    const r = stage.getBoundingClientRect();
    const extra = Math.max(0, zoom - 1) * 70;
    return {
      x: Math.min(165, r.width * .29) + extra,
      y: Math.min(135, r.height * .22) + extra
    };
  }

  function applyCamera() {
    const b = movementBounds();
    panX = Math.max(-b.x, Math.min(b.x, panX));
    panY = Math.max(-b.y, Math.min(b.y, panY));
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    camera.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
  }

  function setZoom(next, anchorX = null, anchorY = null) {
    const old = zoom;
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    if (anchorX !== null && anchorY !== null && old !== zoom) {
      const rect = stage.getBoundingClientRect();
      const ax = anchorX - (rect.left + rect.width / 2);
      const ay = anchorY - (rect.top + rect.height / 2);
      const ratio = zoom / old;
      panX = ax - (ax - panX) * ratio;
      panY = ay - (ay - panY) * ratio;
    }
    applyCamera();
  }

  function centerCamera(resetZoom = false) {
    panX = 0;
    panY = 0;
    if (resetZoom) zoom = 1;
    applyCamera();
  }

  zoomOutBtn.addEventListener('click', () => setZoom(zoom - .12));
  zoomInBtn.addEventListener('click', () => setZoom(zoom + .12));
  centerBtn.addEventListener('click', () => centerCamera(false));
  levelBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('queens:levelview'));
  });

  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : .9;
    setZoom(zoom * factor, e.clientX, e.clientY);
  }, { passive: false });

  // Mouse/trackpad pan: Shift + drag. Touch: two-finger pan + pinch zoom + twist.
  const touchPoints = new Map();
  let multiGesture = false;
  let multiStart = null;
  let mousePan = null;

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function touchAngle(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
  }
  function normalizeAngle(value) {
    let next = value % 360;
    if (next > 180) next -= 360;
    if (next < -180) next += 360;
    return next;
  }

  stage.addEventListener('pointerdown', e => {
    if (internalDrive) return;

    if (e.pointerType === 'touch') {
      touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchPoints.size === 2) {
        const [a, b] = [...touchPoints.values()];
        const angle = touchAngle(a, b);
        multiGesture = true;
        manualStart = null;
        multiStart = {
          mid: midpoint(a, b),
          dist: Math.max(1, distance(a, b)),
          angle,
          lastAngle: angle,
          twisting: false,
          panX,
          panY,
          zoom
        };
        e.preventDefault();
        e.stopImmediatePropagation();
      } else if (multiGesture) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      return;
    }

    if (e.pointerType === 'mouse' && (e.shiftKey || e.button === 1)) {
      mousePan = { id: e.pointerId, x: e.clientX, y: e.clientY, panX, panY };
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  stage.addEventListener('pointermove', e => {
    if (internalDrive) return;

    if (e.pointerType === 'touch' && touchPoints.has(e.pointerId)) {
      touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (multiGesture && touchPoints.size >= 2) {
        const [a, b] = [...touchPoints.values()].slice(0, 2);
        const mid = midpoint(a, b);
        const dist = Math.max(1, distance(a, b));
        const angle = touchAngle(a, b);

        zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, multiStart.zoom * (dist / multiStart.dist)));
        panX = multiStart.panX + (mid.x - multiStart.mid.x);
        panY = multiStart.panY + (mid.y - multiStart.mid.y);
        applyCamera();

        const totalTwist = normalizeAngle(angle - multiStart.angle);
        if (!multiStart.twisting && Math.abs(totalTwist) >= TWIST_START_DEGREES) {
          multiStart.twisting = true;
          multiStart.lastAngle = angle;
        } else if (multiStart.twisting) {
          const delta = normalizeAngle(angle - multiStart.lastAngle);
          multiStart.lastAngle = angle;
          if (Math.abs(delta) > .01) {
            document.dispatchEvent(new CustomEvent('queens:twist', {detail:{degrees:delta}}));
          }
        }

        e.preventDefault();
        e.stopImmediatePropagation();
      } else if (multiGesture) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      return;
    }

    if (mousePan && e.pointerId === mousePan.id) {
      panX = mousePan.panX + (e.clientX - mousePan.x);
      panY = mousePan.panY + (e.clientY - mousePan.y);
      applyCamera();
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  function endPointer(e) {
    if (e.pointerType === 'touch') {
      const wasMulti = multiGesture;
      touchPoints.delete(e.pointerId);
      if (wasMulti) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      if (touchPoints.size === 0) {
        multiGesture = false;
        multiStart = null;
      }
    }
    if (mousePan && e.pointerId === mousePan.id) {
      mousePan = null;
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  stage.addEventListener('pointerup', endPointer, true);
  stage.addEventListener('pointercancel', endPointer, true);

  function setDepth(kind) {
    if (!separation) return;
    const n = puzzleSize();
    const table = {
      original: {3:110, 4:98, 5:90},
      front:    {3:92,  4:78, 5:66},
      back:     {3:92,  4:78, 5:66},
      layers:   {3:96,  4:96, 5:96}
    };
    const value = table[kind]?.[n];
    if (!value) return;
    separation.value = String(value);
    separation.dispatchEvent(new Event('input', {bubbles:true}));
  }

  function updateStageHeight() {
    const n = puzzleSize();
    const mobile = window.matchMedia('(max-width:590px)').matches;
    const table = mobile
      ? {3:470, 4:515, 5:560}
      : {3:550, 4:590, 5:630};
    stage.style.minHeight = `${table[n] || table[3]}px`;
  }

  // The original game keeps rotation in a closure. Drive its own pointer logic
  // so manual rotation continues naturally from each preset.
  function driveRotation(targetX, targetY) {
    internalDrive = true;
    perspectiveBtn.click();

    const oldSetCapture = stage.setPointerCapture;
    const oldReleaseCapture = stage.releasePointerCapture;
    try {
      stage.setPointerCapture = () => {};
      stage.releasePointerCapture = () => {};

      const pointerId = 99991;
      const x0 = 120;
      const y0 = 120;
      const dx = (targetY - ORIGINAL_BASE_Y) / 0.38;
      const dy = (ORIGINAL_BASE_X - targetX) / 0.34;

      stage.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles:true, pointerId, clientX:x0, clientY:y0, pointerType:'mouse'
      }));
      stage.dispatchEvent(new PointerEvent('pointermove', {
        bubbles:true, pointerId, clientX:x0 + dx, clientY:y0 + dy, pointerType:'mouse'
      }));
      stage.dispatchEvent(new PointerEvent('pointerup', {
        bubbles:true, pointerId, clientX:x0 + dx, clientY:y0 + dy, pointerType:'mouse'
      }));
    } catch (_) {
      cube.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg)`;
    } finally {
      try { stage.setPointerCapture = oldSetCapture; } catch (_) {}
      try { stage.releasePointerCapture = oldReleaseCapture; } catch (_) {}
      internalDrive = false;
    }
  }

  function allViewButtons() {
    return [originalBtn, frontBtn, backBtn, perspectiveBtn];
  }

  function markPreset(kind) {
    allViewButtons().forEach(b => b.classList.remove('active'));
    originalBtn.classList.toggle('active', kind === 'original');
    frontBtn.classList.toggle('active', kind === 'front');
    backBtn.classList.toggle('active', kind === 'back');
    perspectiveBtn.classList.toggle('active', kind === 'layers');

    stage.classList.remove('view-original','view-front','view-back','view-layers');
    stage.classList.add(`view-${kind}`);
  }

  function applyPreset(kind) {
    setDepth(kind);
    panX = 0;
    panY = 0;
    if (kind === 'original') zoom = 1;
    applyCamera();

    if (kind === 'original') {
      // Diagonal card stack toward the chosen opposite side.
      driveRotation(-42, 38);
    } else if (kind === 'front') {
      driveRotation(0, 0);
    } else if (kind === 'back') {
      driveRotation(0, 180);
    } else {
      // Front view tilted upward only; Layer 1 appears at the top.
      driveRotation(60, 0);
    }

    markPreset(kind);
    fixLabels();
  }

  function intercept(button, kind) {
    button.addEventListener('click', e => {
      if (internalDrive) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      applyPreset(kind);
    }, true);
  }

  intercept(originalBtn, 'original');
  intercept(frontBtn, 'front');
  intercept(backBtn, 'back');
  intercept(perspectiveBtn, 'layers');

  // Manual one-pointer rotation means no named preset is exact anymore.
  stage.addEventListener('pointerdown', e => {
    if (internalDrive || multiGesture || mousePan || e.pointerType !== 'touch' && e.pointerType !== 'mouse') return;
    if (e.pointerType === 'mouse' && (e.shiftKey || e.button === 1)) return;
    manualStart = {x:e.clientX, y:e.clientY};
  }, true);

  stage.addEventListener('pointermove', e => {
    if (internalDrive || multiGesture || mousePan || !manualStart) return;
    if (Math.abs(e.clientX-manualStart.x) > 4 || Math.abs(e.clientY-manualStart.y) > 4) {
      allViewButtons().forEach(b => b.classList.remove('active'));
      stage.classList.remove('view-original','view-front','view-back','view-layers');
    }
  });

  stage.addEventListener('pointerup', () => { manualStart = null; }, true);
  stage.addEventListener('pointercancel', () => { manualStart = null; }, true);

  sizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(() => {
        updateStageHeight();
        applyPreset('original');
      }, 0);
    });
  });

  const labelObserver = new MutationObserver(fixLabels);
  labelObserver.observe(perspectiveBtn, {childList:true, characterData:true, subtree:true});
  const langObserver = new MutationObserver(fixLabels);
  langObserver.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});

  window.addEventListener('resize', () => {
    updateStageHeight();
    applyCamera();
  });

  fixLabels();
  updateStageHeight();
  applyCamera();
  setTimeout(() => applyPreset('original'), 0);
})();