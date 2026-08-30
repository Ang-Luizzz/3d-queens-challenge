(() => {
  const stage = document.getElementById('stage');
  const cube = document.getElementById('cube');
  if (!stage || !cube) return;

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let moved = false;
  let suppressNativeUntil = 0;

  function activeLayerIndex() {
    const active = cube.querySelector('.plane.active');
    return active ? Number(active.dataset.z) : -1;
  }

  function activeCellAtPoint(clientX, clientY) {
    const inactivePlanes = [...cube.querySelectorAll('.plane.inactive')];
    const previousVisibility = inactivePlanes.map(p => p.style.visibility);

    // Temporarily remove the ghost layers only for hit-testing. They stay
    // visually present to the player; this makes taps reach the active layer.
    inactivePlanes.forEach(p => { p.style.visibility = 'hidden'; });
    const hit = document.elementFromPoint(clientX, clientY);
    inactivePlanes.forEach((p, i) => { p.style.visibility = previousVisibility[i]; });

    const cell = hit?.closest?.('.cell');
    if (!cell || !cube.contains(cell)) return null;
    if (Number(cell.dataset.z) !== activeLayerIndex()) return null;
    return cell;
  }

  stage.addEventListener('pointerdown', e => {
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    moved = false;
  }, true);

  stage.addEventListener('pointermove', e => {
    if (e.pointerId !== pointerId) return;
    if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) {
      moved = true;
    }
  }, true);

  stage.addEventListener('pointerup', e => {
    if (e.pointerId !== pointerId) return;
    const wasMoved = moved;
    pointerId = null;
    moved = false;
    if (wasMoved) return;

    const cell = activeCellAtPoint(e.clientX, e.clientY);
    if (!cell) return;

    // Trigger the game's existing placement logic. A following browser-native
    // click is suppressed so one tap can never toggle the same queen twice.
    suppressNativeUntil = performance.now() + 250;
    cell.click();
  }, true);

  stage.addEventListener('pointercancel', () => {
    pointerId = null;
    moved = false;
  }, true);

  stage.addEventListener('click', e => {
    if (e.isTrusted && performance.now() < suppressNativeUntil) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
})();
