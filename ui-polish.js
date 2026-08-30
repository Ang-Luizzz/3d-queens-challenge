(() => {
  const stage = document.getElementById('stage');
  const cube = document.getElementById('cube');
  const originalBtn = document.getElementById('original');
  const zoomOutBtn = document.getElementById('zoomOut');
  if (!stage || !cube || !originalBtn) return;

  // Keep this patch deliberately narrow: repair only the convention queen,
  // strengthen the visual-guide entry point, preserve the approved diagonal
  // camera preset, and polish the size selector without changing puzzle rules.
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

    /* Size selector: title gets its own row and every size option keeps the
       same column width instead of the last row stretching unpredictably. */
    .size-strip{
      display:grid!important;
      grid-template-columns:repeat(5,minmax(0,1fr));
      gap:8px;
      align-items:stretch!important;
    }
    .size-strip>.size-label{
      grid-column:1/-1;
      margin:0 0 1px!important;
    }
    .size-strip>.size-btn{
      width:100%;
      min-width:0!important;
    }
    .size-strip>.custom-size-panel{
      grid-column:1/-1;
      width:100%;
    }
    .custom-dim input[aria-invalid="true"]{
      border-color:#f43f5e!important;
      box-shadow:0 0 0 2px rgba(244,63,94,.14)!important;
    }
    .custom-range-note.range-error{
      color:#ff9dad!important;
      font-weight:850!important;
    }
    @media(max-width:760px){
      .size-strip{grid-template-columns:repeat(3,minmax(0,1fr))}
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

  // The size engine intentionally owns the puzzle state. We intercept only the
  // custom form's validation before its original listeners run: invalid values
  // remain visible, nothing is silently rounded/clamped, and the puzzle is not
  // changed until all three axes contain integers from 3 through 6.
  const customPanel = document.querySelector('.custom-size-panel');
  const customApply = customPanel?.querySelector('#customApply');
  const customNote = customPanel?.querySelector('.custom-range-note');
  const customInputs = customPanel ? [...customPanel.querySelectorAll('.custom-dim input')] : [];

  function customText(error = false) {
    const en = document.documentElement.lang === 'en';
    if (error) return en
      ? 'Cannot apply. Each value must be a whole number from 3 to 6.'
      : 'No se puede aplicar. Cada valor debe ser un número entero entre 3 y 6.';
    return en ? 'Allowed range: 3–6 on each axis' : 'Rango permitido: 3–6 en cada eje';
  }

  function isValidDimension(input) {
    const raw = String(input.value).trim();
    if (!raw) return false;
    const value = Number(raw);
    return Number.isInteger(value) && value >= 3 && value <= 6;
  }

  function paintCustomValidation(showError = false) {
    if (!customNote || customInputs.length !== 3) return true;
    const invalid = customInputs.filter(input => !isValidDimension(input));
    customInputs.forEach(input => input.setAttribute('aria-invalid', String(invalid.includes(input))));
    const hasError = invalid.length > 0;
    customNote.classList.toggle('range-error', showError && hasError);
    customNote.textContent = showError && hasError ? customText(true) : customText(false);
    return !hasError;
  }

  if (customPanel && customApply && customInputs.length === 3) {
    // Prevent size-engine.js's old change handler from silently snapping values
    // to the nearest limit. Capture phase on the parent runs before target phase.
    customPanel.addEventListener('change', e => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target?.matches('.custom-dim input')) return;
      e.stopImmediatePropagation();
      paintCustomValidation(false);
    }, true);

    customPanel.addEventListener('input', e => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target?.matches('.custom-dim input')) return;
      paintCustomValidation(false);
    }, true);

    customPanel.addEventListener('click', e => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target?.closest('#customApply')) return;
      if (paintCustomValidation(true)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      customInputs.find(input => !isValidDimension(input))?.focus();
    }, true);

    const languageObserver = new MutationObserver(() => {
      const hasInvalid = customInputs.some(input => input.getAttribute('aria-invalid') === 'true');
      paintCustomValidation(hasInvalid);
    });
    languageObserver.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
    paintCustomValidation(false);
  }

  scheduleOriginalPolish(80);
})();