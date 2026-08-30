(() => {
  const stage = document.getElementById('stage');
  const cube = document.getElementById('cube');
  const originalBtn = document.getElementById('original');
  const zoomOutBtn = document.getElementById('zoomOut');
  if (!stage || !cube || !originalBtn) return;

  // Keep this patch deliberately narrow: the manual itself is already approved.
  // Only repair the queen glyph used in the convention strip and make the
  // Visual guide entry point a little easier to notice.
  const style = document.createElement('style');
  style.textContent = `
    .legend-q{
      font-style:normal!important;
      font-family:inherit!important;
      transform:none!important;
      text-indent:0!important;
    }
    .visual-manual-btn{
      display:inline-flex!important;
      align-items:center;
      justify-content:center;
      gap:7px;
    }
    .visual-manual-btn::before{
      content:'📖';
      display:inline-block;
      font-size:15px;
      line-height:1;
      font-style:normal;
      transform:none;
    }
  `;
  document.head.appendChild(style);

  // view-layout.js first applies the established preset (-42deg, 38deg).
  // Immediately after that, nudge it to a gentler angle and use the existing
  // zoom control once so the camera's own internal zoom state stays in sync.
  const FROM_X = -42;
  const FROM_Y = 38;
  const TARGET_X = -30;
  const TARGET_Y = 20;

  function softenOriginalView() {
    const oldSetCapture = stage.setPointerCapture;
    const oldReleaseCapture = stage.releasePointerCapture;

    try {
      stage.setPointerCapture = () => {};
      stage.releasePointerCapture = () => {};

      const pointerId = 99973;
      const x0 = 140;
      const y0 = 140;
      const dx = (TARGET_Y - FROM_Y) / 0.38;
      const dy = (FROM_X - TARGET_X) / 0.34;

      stage.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles:true,
        pointerId,
        clientX:x0,
        clientY:y0,
        pointerType:'mouse'
      }));
      stage.dispatchEvent(new PointerEvent('pointermove', {
        bubbles:true,
        pointerId,
        clientX:x0 + dx,
        clientY:y0 + dy,
        pointerType:'mouse'
      }));
      stage.dispatchEvent(new PointerEvent('pointerup', {
        bubbles:true,
        pointerId,
        clientX:x0 + dx,
        clientY:y0 + dy,
        pointerType:'mouse'
      }));
    } catch (_) {
      cube.style.transform = `rotateX(${TARGET_X}deg) rotateY(${TARGET_Y}deg)`;
    } finally {
      try { stage.setPointerCapture = oldSetCapture; } catch (_) {}
      try { stage.releasePointerCapture = oldReleaseCapture; } catch (_) {}
    }

    // The synthetic drag is intentionally treated as manual movement by the
    // existing view code, so restore the preset indicator afterwards.
    document.querySelectorAll('#original,#front,#back,#perspective').forEach(btn => btn.classList.remove('active'));
    originalBtn.classList.add('active');
    stage.classList.remove('view-front','view-back','view-layers');
    stage.classList.add('view-original');

    // One native camera step: 1.00 -> 0.88. This keeps later +/-/center actions
    // consistent instead of applying a visual-only CSS scale override.
    zoomOutBtn?.click();
  }

  function scheduleOriginalPolish(delay = 24) {
    window.setTimeout(softenOriginalView, delay);
  }

  // Capture sees the click before view-layout.js stops propagation on the
  // button; the delayed adjustment runs after its standard preset finishes.
  document.addEventListener('click', e => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;
    if (target.closest('#original')) scheduleOriginalPolish();
    if (target.closest('.size-btn')) scheduleOriginalPolish(40);
  }, true);

  // view-layout.js also applies Original automatically on first load.
  scheduleOriginalPolish(80);
})();
