(() => {
  const stage = document.getElementById('stage');
  const cube = document.getElementById('cube');
  const perspectiveBtn = document.getElementById('perspective');
  const frontBtn = document.getElementById('front');
  const originalBtn = document.getElementById('original');
  const separation = document.getElementById('separation');
  const boardLayout = document.querySelector('.board-layout');
  const actionbar = document.querySelector('.actionbar');
  const sizeButtons = [...document.querySelectorAll('.size-btn')];

  if (!stage || !cube || !perspectiveBtn || !frontBtn || !originalBtn) return;

  // Verification belongs before the large 3D viewport so it is always discoverable.
  if (actionbar && boardLayout && actionbar.nextElementSibling !== boardLayout) {
    actionbar.classList.add('actionbar-top');
    boardLayout.parentNode.insertBefore(actionbar, boardLayout);
  }

  // Desired order: Original view · Front · Layers.
  const segmented = perspectiveBtn.parentElement;
  if (segmented) {
    segmented.append(originalBtn, frontBtn, perspectiveBtn);
  }

  let internalDrive = false;
  let manualStart = null;

  const ORIGINAL_BASE_X = -56;
  const ORIGINAL_BASE_Y = 32;

  function puzzleSize() {
    return cube.querySelectorAll('.plane').length || 3;
  }

  function labels() {
    return document.documentElement.lang === 'en'
      ? { layers: 'Layers' }
      : { layers: 'Capas' };
  }

  function fixLabels() {
    const t = labels();
    if (perspectiveBtn.textContent.trim() !== t.layers) {
      perspectiveBtn.textContent = t.layers;
    }
  }

  function setDepth(kind) {
    if (!separation) return;
    const n = puzzleSize();
    const table = {
      original: {3:112, 4:100, 5:90},
      front:    {3:92,  4:78,  5:66},
      layers:   {3:108, 4:94,  5:84}
    };
    const value = table[kind]?.[n];
    if (!value) return;
    separation.value = String(value);
    separation.dispatchEvent(new Event('input', {bubbles:true}));
  }

  // The original game keeps rotation in a closure. Drive its own pointer logic
  // so future manual rotation starts from the correct preset instead of jumping.
  function driveRotation(targetX, targetY) {
    internalDrive = true;

    // Reset the hidden game rotation to its known perspective baseline first.
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
      // Fallback: at least preserve the intended visual preset.
      cube.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg) scale(.86)`;
    } finally {
      try { stage.setPointerCapture = oldSetCapture; } catch (_) {}
      try { stage.releasePointerCapture = oldReleaseCapture; } catch (_) {}
      internalDrive = false;
    }
  }

  function markPreset(kind) {
    [originalBtn, frontBtn, perspectiveBtn].forEach(b => b.classList.remove('active'));
    originalBtn.classList.toggle('active', kind === 'original');
    frontBtn.classList.toggle('active', kind === 'front');
    perspectiveBtn.classList.toggle('active', kind === 'layers');

    stage.classList.remove('view-original','view-front','view-layers');
    stage.classList.add(`view-${kind}`);
  }

  function applyPreset(kind) {
    setDepth(kind);

    if (kind === 'original') {
      // Side-card composition: depth is visible horizontally and layers read separately.
      driveRotation(-10, -52);
    } else if (kind === 'front') {
      driveRotation(0, 0);
    } else {
      // Stacked sections: clear vertical separation, minimal sideways skew.
      driveRotation(-72, 4);
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
  intercept(perspectiveBtn, 'layers');

  // If the player rotates manually, the named preset is no longer exact.
  stage.addEventListener('pointerdown', e => {
    if (internalDrive) return;
    manualStart = {x:e.clientX, y:e.clientY};
  }, true);

  stage.addEventListener('pointermove', e => {
    if (internalDrive || !manualStart) return;
    if (Math.abs(e.clientX-manualStart.x) > 4 || Math.abs(e.clientY-manualStart.y) > 4) {
      [originalBtn, frontBtn, perspectiveBtn].forEach(b => b.classList.remove('active'));
      stage.classList.remove('view-original','view-front','view-layers');
    }
  });

  stage.addEventListener('pointerup', () => { manualStart = null; }, true);
  stage.addEventListener('pointercancel', () => { manualStart = null; }, true);

  // The game's size change resets to its old perspective; replace it with our original view.
  sizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(() => applyPreset('original'), 0);
    });
  });

  // i18n may rewrite the old Perspective label; keep the new semantic name.
  const labelObserver = new MutationObserver(fixLabels);
  labelObserver.observe(perspectiveBtn, {childList:true, characterData:true, subtree:true});
  const langObserver = new MutationObserver(fixLabels);
  langObserver.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});

  // New default view.
  setTimeout(() => applyPreset('original'), 0);
})();
