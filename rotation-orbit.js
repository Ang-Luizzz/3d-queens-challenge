(() => {
  const stage = document.getElementById('stage');
  const cube = document.getElementById('cube');
  const camera = document.querySelector('.camera-transform');
  const cameraTools = stage?.querySelector('.camera-tools');
  const levelBtn = stage?.querySelector('#levelView');
  if (!stage || !cube || !camera || !camera.contains(cube)) return;

  // Keep the stable original one-pointer rotation on #cube. This outer frame
  // does only one job: rotate the coordinate frame around screen Z. After the
  // frame is turned, the original X/Y drag engine keeps behaving exactly as it
  // always did, but those axes are now presented from a new orientation.
  const axisFrame = document.createElement('div');
  axisFrame.className = 'axis-frame-transform';
  camera.insertBefore(axisFrame, cube);
  axisFrame.appendChild(cube);

  const style = document.createElement('style');
  style.textContent = `
    .axis-frame-transform{
      width:100%;
      height:100%;
      position:relative;
      display:grid;
      place-items:center;
      transform-style:preserve-3d;
      transform-origin:center center;
      will-change:transform;
    }
    .camera-axis-btn{
      font-size:17px!important;
      letter-spacing:-1px;
    }
  `;
  document.head.appendChild(style);

  let frameAngle = 0;

  function normalizeDegrees(value){
    let next = value % 360;
    if(next > 180) next -= 360;
    if(next <= -180) next += 360;
    return next;
  }

  function applyFrame(){
    frameAngle = normalizeDegrees(frameAngle);
    axisFrame.style.transform = Math.abs(frameAngle) < .001
      ? 'none'
      : `rotateZ(${frameAngle}deg)`;
  }

  function clearNamedView(){
    document.querySelectorAll('#original,#front,#back,#perspective').forEach(btn => btn.classList.remove('active'));
    stage.classList.remove('view-original','view-front','view-back','view-layers');
  }

  function setFrameAngle(next, clearView = true){
    frameAngle = normalizeDegrees(next);
    applyFrame();
    if(clearView && Math.abs(frameAngle) > .001) clearNamedView();
  }

  function resetFrame(){
    frameAngle = 0;
    applyFrame();
  }

  // Two-finger pan/pinch/twist is already resolved by view-layout.js. Only a
  // deliberate twist beyond its dead zone emits this event, so ordinary pinch
  // and pan jitter do not rotate the axes.
  document.addEventListener('queens:twist', e => {
    const degrees = Number(e.detail?.degrees);
    if(!Number.isFinite(degrees) || Math.abs(degrees) < .001) return;
    setFrameAngle(frameAngle + degrees);
  });

  // Level now has a simple, deterministic meaning: restore the original axis
  // frame without changing the original engine's current X/Y orientation.
  document.addEventListener('queens:levelview', () => {
    if(Math.abs(frameAngle) < .001) return;
    resetFrame();
    clearNamedView();
  });

  // Precise ±90° axis changes are useful on desktop and when the desired view
  // is hard to hit with a touch twist. They rotate the control frame, not the
  // puzzle state and not the original X/Y angles.
  let axisLeftBtn = null;
  let axisRightBtn = null;
  if(cameraTools){
    axisLeftBtn = document.createElement('button');
    axisLeftBtn.type = 'button';
    axisLeftBtn.id = 'axisLeft';
    axisLeftBtn.className = 'camera-btn camera-axis-btn';
    axisLeftBtn.textContent = '↺';

    axisRightBtn = document.createElement('button');
    axisRightBtn.type = 'button';
    axisRightBtn.id = 'axisRight';
    axisRightBtn.className = 'camera-btn camera-axis-btn';
    axisRightBtn.textContent = '↻';

    if(levelBtn){
      cameraTools.insertBefore(axisLeftBtn, levelBtn);
      cameraTools.insertBefore(axisRightBtn, levelBtn);
    }else{
      cameraTools.append(axisLeftBtn, axisRightBtn);
    }

    axisLeftBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      setFrameAngle(frameAngle - 90);
    });
    axisRightBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      setFrameAngle(frameAngle + 90);
    });
  }

  function updateLabels(){
    const en = document.documentElement.lang === 'en';
    if(axisLeftBtn){
      const text = en ? 'Rotate axes 90° left' : 'Girar ejes 90° a la izquierda';
      axisLeftBtn.setAttribute('aria-label', text);
      axisLeftBtn.title = text;
    }
    if(axisRightBtn){
      const text = en ? 'Rotate axes 90° right' : 'Girar ejes 90° a la derecha';
      axisRightBtn.setAttribute('aria-label', text);
      axisRightBtn.title = text;
    }
  }

  const langObserver = new MutationObserver(updateLabels);
  langObserver.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});

  // Named presets and puzzle-size changes define an exact canonical frame, so
  // any deliberate axis rotation is cleared when one of those is selected.
  document.addEventListener('click', e => {
    const target = e.target instanceof Element ? e.target : null;
    if(!target) return;
    if(target.closest('#original,#front,#back,#perspective,.size-btn[data-n],#customApply')) resetFrame();
  }, true);
  document.addEventListener('queens:sizechange', resetFrame);

  updateLabels();
  resetFrame();
})();
