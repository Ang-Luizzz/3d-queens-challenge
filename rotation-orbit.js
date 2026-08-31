(() => {
  const stage = document.getElementById('stage');
  const cube = document.getElementById('cube');
  const camera = document.querySelector('.camera-transform');
  if (!stage || !cube || !camera || !camera.contains(cube)) return;

  // Manual rotation lives in an outer transform so named views keep their
  // approved base orientation. Unlike the previous free trackball, this layer
  // intentionally has only yaw + pitch: no roll can accumulate.
  const orbit = document.createElement('div');
  orbit.className = 'orbit-transform';
  camera.insertBefore(orbit, cube);
  orbit.appendChild(cube);

  const style = document.createElement('style');
  style.textContent = `
    .orbit-transform{
      width:100%;
      height:100%;
      position:relative;
      display:grid;
      place-items:center;
      transform-style:preserve-3d;
      transform-origin:center center;
      will-change:transform;
    }
  `;
  document.head.appendChild(style);

  let yaw = 0;
  let pitch = 0;
  let activePointer = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let didRotate = false;
  let suppressClick = false;
  let gestureMode = 'pending';

  const START_THRESHOLD = 6;
  const LOCK_RATIO = 1.45;
  const YAW_SENSITIVITY = .30;
  const PITCH_SENSITIVITY = .27;
  const FREE_SENSITIVITY = .25;
  const MAX_PITCH = 68;

  function normalizeYaw(value){
    let next = value % 360;
    if (next > 180) next -= 360;
    if (next < -180) next += 360;
    return next;
  }

  function clampPitch(value){
    return Math.max(-MAX_PITCH, Math.min(MAX_PITCH, value));
  }

  function applyOrientation(){
    // Turntable order: yaw around the stable screen/world vertical axis, then
    // pitch around the horizontal axis. There is deliberately no rotateZ/roll.
    if (Math.abs(yaw) < .0001 && Math.abs(pitch) < .0001) {
      orbit.style.transform = 'none';
      return;
    }
    orbit.style.transform = `rotateY(${yaw}deg) rotateX(${pitch}deg)`;
  }

  function resetOrbit(){
    yaw = 0;
    pitch = 0;
    gestureMode = 'pending';
    applyOrientation();
  }

  function isCameraControl(target){
    return Boolean(target?.closest?.('.camera-tools'));
  }

  function chooseGestureMode(totalX,totalY){
    const ax = Math.abs(totalX);
    const ay = Math.abs(totalY);
    if (ax > ay * LOCK_RATIO) return 'horizontal';
    if (ay > ax * LOCK_RATIO) return 'vertical';
    return 'free';
  }

  stage.addEventListener('pointerdown',e=>{
    // Existing scripts still use synthetic pointer events to establish named
    // presets. Only replace rotation for real user input.
    if(!e.isTrusted || isCameraControl(e.target)) return;
    if(e.pointerType==='mouse' && (e.shiftKey || e.button===1 || e.button!==0)) return;
    if(activePointer!==null) return;

    activePointer=e.pointerId;
    startX=lastX=e.clientX;
    startY=lastY=e.clientY;
    didRotate=false;
    gestureMode='pending';

    // A tap must remain available for placing/removing a piece.
    e.stopPropagation();
  },true);

  stage.addEventListener('pointermove',e=>{
    if(!e.isTrusted || e.pointerId!==activePointer) return;

    const totalX=e.clientX-startX;
    const totalY=e.clientY-startY;
    if(!didRotate && Math.hypot(totalX,totalY)<=START_THRESHOLD) return;

    if(!didRotate){
      didRotate=true;
      gestureMode=chooseGestureMode(totalX,totalY);
      try{stage.setPointerCapture(e.pointerId);}catch(_){}
    }

    const dx=e.clientX-lastX;
    const dy=e.clientY-lastY;
    lastX=e.clientX;
    lastY=e.clientY;
    if(dx===0 && dy===0) return;

    // Intent lock filters the small sideways drift that naturally happens in a
    // mostly vertical/horizontal drag. A genuinely diagonal drag keeps both.
    if(gestureMode==='horizontal'){
      yaw=normalizeYaw(yaw+dx*YAW_SENSITIVITY);
    }else if(gestureMode==='vertical'){
      pitch=clampPitch(pitch-dy*PITCH_SENSITIVITY);
    }else{
      yaw=normalizeYaw(yaw+dx*FREE_SENSITIVITY);
      pitch=clampPitch(pitch-dy*FREE_SENSITIVITY);
    }

    applyOrientation();

    document.querySelectorAll('#original,#front,#back,#perspective').forEach(btn=>btn.classList.remove('active'));
    stage.classList.remove('view-original','view-front','view-back','view-layers');
    e.preventDefault();
    e.stopPropagation();
  },true);

  function finishPointer(e){
    if(e.pointerId!==activePointer) return;
    if(didRotate){
      suppressClick=true;
      window.setTimeout(()=>{suppressClick=false;},180);
    }
    try{stage.releasePointerCapture(e.pointerId);}catch(_){}
    activePointer=null;
    didRotate=false;
    gestureMode='pending';
  }

  // Document capture guarantees cleanup even when the two-finger camera
  // gesture in view-layout stops propagation on the stage itself.
  document.addEventListener('pointerup',finishPointer,true);
  document.addEventListener('pointercancel',finishPointer,true);

  stage.addEventListener('click',e=>{
    if(!e.isTrusted || !suppressClick) return;
    suppressClick=false;
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);

  // Named views and size changes start from their exact approved orientation.
  document.addEventListener('click',e=>{
    const target=e.target instanceof Element?e.target:null;
    if(!target) return;
    if(target.closest('#original,#front,#back,#perspective,.size-btn[data-n],#customApply')) resetOrbit();
  },true);
  document.addEventListener('queens:sizechange',resetOrbit);

  resetOrbit();
})();
