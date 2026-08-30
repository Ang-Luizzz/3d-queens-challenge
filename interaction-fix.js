(() => {
  const stage = document.getElementById('stage');
  const cube = document.getElementById('cube');
  if (!stage || !cube) return;

  const activeTouches = new Set();
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let moved = false;
  let multiTouch = false;
  let suppressNativeUntil = 0;

  function activeLayerIndex() {
    const active = cube.querySelector('.plane.active');
    return active ? Number(active.dataset.z) : -1;
  }

  function activeCellAtPoint(clientX, clientY) {
    const inactivePlanes = [...cube.querySelectorAll('.plane.inactive')];
    const previousVisibility = inactivePlanes.map(p => p.style.visibility);

    inactivePlanes.forEach(p => { p.style.visibility = 'hidden'; });
    const hit = document.elementFromPoint(clientX, clientY);
    inactivePlanes.forEach((p, i) => { p.style.visibility = previousVisibility[i]; });

    const cell = hit?.closest?.('.cell');
    if (!cell || !cube.contains(cell)) return null;
    if (Number(cell.dataset.z) !== activeLayerIndex()) return null;
    return cell;
  }

  stage.addEventListener('pointerdown', e => {
    // Synthetic events are used internally to drive view presets; never treat
    // them as placement taps.
    if (!e.isTrusted) return;

    if (e.pointerType === 'touch') {
      activeTouches.add(e.pointerId);
      if (activeTouches.size > 1) {
        multiTouch = true;
        pointerId = null;
        return;
      }
    }

    if (e.pointerType === 'mouse' && (e.shiftKey || e.button === 1)) return;

    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    moved = false;
  }, true);

  stage.addEventListener('pointermove', e => {
    if (!e.isTrusted || multiTouch || e.pointerId !== pointerId) return;
    if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) {
      moved = true;
    }
  }, true);

  stage.addEventListener('pointerup', e => {
    if (!e.isTrusted) return;

    const wasMulti = multiTouch;
    if (e.pointerType === 'touch') {
      activeTouches.delete(e.pointerId);
      if (activeTouches.size === 0) {
        // Keep the multi-touch guard through this event, then clear it.
        queueMicrotask(() => { multiTouch = false; });
      }
    }

    if (wasMulti || e.pointerId !== pointerId) {
      if (e.pointerId === pointerId) pointerId = null;
      return;
    }

    const wasMoved = moved;
    pointerId = null;
    moved = false;
    if (wasMoved) return;

    const cell = activeCellAtPoint(e.clientX, e.clientY);
    if (!cell) return;

    suppressNativeUntil = performance.now() + 250;
    cell.click();
  }, true);

  stage.addEventListener('pointercancel', e => {
    if (e.pointerType === 'touch') activeTouches.delete(e.pointerId);
    pointerId = null;
    moved = false;
    if (activeTouches.size === 0) multiTouch = false;
  }, true);

  stage.addEventListener('click', e => {
    if (e.isTrusted && performance.now() < suppressNativeUntil) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
})();
