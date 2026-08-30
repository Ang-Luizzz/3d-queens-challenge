(() => {
  const stage = document.getElementById('stage');
  const cube = document.getElementById('cube');
  const originalBtn = document.getElementById('original');
  const zoomOutBtn = document.getElementById('zoomOut');
  if (!stage || !cube || !originalBtn) return;

  // Keep this patch deliberately narrow: repair only the convention queen,
  // strengthen the visual-guide entry point, and preserve the approved
  // diagonal camera preset after any size change.
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
        bubbles:true, pointerId, clientX:x0, clientY:y0, pointerType:'mouse'
      }));
      stage.dispatchEvent(new PointerEvent('pointermove', {
        bubbles:true, pointerId, clientX:x0 + dx, clientY:y0 + dy, pointerType:'mouse'
      }));
      stage.dispatchEvent(new PointerEvent('pointerup', {
        bubbles:true, pointerId, clientX:x0 + dx, clientY:y0 + dy, pointerType:'mouse'
      }));
    } catch (_) {
      cube.style.transform = `rotateX(${TARGET_X}deg) rotateY(${TARGET_Y}deg)`;
    } finally {
      try { stage.setPointerCapture = oldSetCapture; } catch (_) {}
      try { stage.releasePointerCapture = oldReleaseCapture; } catch (_) {}
    }

    document.querySelectorAll('#original,#front,#back,#perspective').forEach(btn => btn.classList.remove('active'));
    originalBtn.classList.add('active');
    stage.classList.remove('view-front','view-back','view-layers');
    stage.classList.add('view-original');
    zoomOutBtn?.click();
  }

  function scheduleOriginalPolish(delay = 24) {
    window.setTimeout(softenOriginalView, delay);
  }

  document.addEventListener('click', e => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;
    if (target.closest('#original')) scheduleOriginalPolish();
    if (target.closest('.size-btn[data-n]')) scheduleOriginalPolish(40);
  }, true);

  // Custom dimensions are applied from a separate button, so send them through
  // the same named view first. Its click is intercepted by view-layout.js; the
  // normal #original listener above then performs the approved final nudge.
  document.addEventListener('queens:sizechange', e => {
    if (!e.detail?.custom) return;
    window.setTimeout(() => originalBtn.click(), 0);
  });

  scheduleOriginalPolish(80);
})();