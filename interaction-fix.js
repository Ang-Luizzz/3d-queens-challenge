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

  function isStageControl(target) {
    return Boolean(target?.closest?.('.camera-tools, .camera-btn, button, input, select, textarea, a, [role="button"]'));
  }

  function activeCellAtPoint(clientX, clientY) {
    const activePlane = cube.querySelector('.plane.active');
    if (!activePlane) return null;

    const boardRect = activePlane.getBoundingClientRect();
    if (!boardRect.width || !boardRect.height) return null;

    const margin = Math.max(10, Math.min(24, Math.min(boardRect.width, boardRect.height) * .06));
    if (
      clientX < boardRect.left - margin || clientX > boardRect.right + margin ||
      clientY < boardRect.top - margin || clientY > boardRect.bottom + margin
    ) return null;

    const cells = [...activePlane.querySelectorAll('.cell')];
    let best = null;
    let bestScore = Infinity;

    for (const cell of cells) {
      const r = cell.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const norm = Math.max(1, r.width * r.width + r.height * r.height);
      const inside = clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
      const score = (dx * dx + dy * dy) / norm - (inside ? 2 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = cell;
      }
    }
    return best;
  }

  stage.addEventListener('pointerdown', e => {
    if (!e.isTrusted || isStageControl(e.target)) {
      pointerId = null;
      moved = false;
      return;
    }

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
    if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) moved = true;
  }, true);

  stage.addEventListener('pointerup', e => {
    if (!e.isTrusted) return;

    if (isStageControl(e.target)) {
      if (e.pointerId === pointerId) pointerId = null;
      moved = false;
      return;
    }

    const wasMulti = multiTouch;
    if (e.pointerType === 'touch') {
      activeTouches.delete(e.pointerId);
      if (activeTouches.size === 0) queueMicrotask(() => { multiTouch = false; });
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
    if (isStageControl(e.target)) return;
    if (e.isTrusted && performance.now() < suppressNativeUntil) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
})();