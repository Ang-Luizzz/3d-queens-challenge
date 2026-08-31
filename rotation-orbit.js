(() => {
  const stage = document.getElementById('stage');
  const cube = document.getElementById('cube');
  const camera = document.querySelector('.camera-transform');
  if (!stage || !cube || !camera || !camera.contains(cube)) return;

  // Named views keep their approved base orientation on #cube. Manual user
  // rotation lives in this outer layer and is composed around the BOARD'S
  // current local axes. This is intentionally different from a turntable:
  // after turning the board 90 degrees, an upward drag rotates around the
  // board's newly oriented local horizontal axis rather than the original one.
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

  const IDENTITY = () => ({x:0,y:0,z:0,w:1});
  let orientation = IDENTITY();
  let activePointer = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let didRotate = false;
  let suppressClick = false;
  let gestureAxis = 'pending';

  const START_THRESHOLD = 6;
  const SENSITIVITY = .30;

  function multiply(a,b){
    return {
      w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z,
      x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,
      y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,
      z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w
    };
  }

  function normalize(q){
    const m=Math.hypot(q.x,q.y,q.z,q.w)||1;
    return {x:q.x/m,y:q.y/m,z:q.z/m,w:q.w/m};
  }

  function fromAxisAngle(x,y,z,degrees){
    const mag=Math.hypot(x,y,z)||1;
    const half=degrees*Math.PI/360;
    const s=Math.sin(half)/mag;
    return {x:x*s,y:y*s,z:z*s,w:Math.cos(half)};
  }

  function applyOrientation(){
    const q=normalize(orientation);
    orientation=q;
    const w=Math.max(-1,Math.min(1,q.w));
    const angleRad=2*Math.acos(w);
    const s=Math.sqrt(Math.max(0,1-w*w));

    if(s<1e-7 || Math.abs(angleRad)<1e-7){
      orbit.style.transform='none';
      return;
    }

    const x=q.x/s;
    const y=q.y/s;
    const z=q.z/s;
    const angle=angleRad*180/Math.PI;
    orbit.style.transform=`rotate3d(${x},${y},${z},${angle}deg)`;
  }

  function resetOrbit(){
    orientation=IDENTITY();
    gestureAxis='pending';
    applyOrientation();
  }

  function isCameraControl(target){
    return Boolean(target?.closest?.('.camera-tools'));
  }

  function chooseGestureAxis(totalX,totalY){
    // Every drag owns exactly one axis. This removes the tiny unwanted second
    // rotation that used to accumulate when a finger was not perfectly straight.
    return Math.abs(totalX) >= Math.abs(totalY) ? 'localY' : 'localX';
  }

  stage.addEventListener('pointerdown',e=>{
    // Synthetic events remain available to the existing preset system.
    if(!e.isTrusted || isCameraControl(e.target)) return;
    if(e.pointerType==='mouse' && (e.shiftKey || e.button===1 || e.button!==0)) return;
    if(activePointer!==null) return;

    activePointer=e.pointerId;
    startX=lastX=e.clientX;
    startY=lastY=e.clientY;
    didRotate=false;
    gestureAxis='pending';

    // view-layout's earlier capture listener has already seen the pointer (so
    // two-finger pan/zoom still works). Stop the old Euler drag engine beneath
    // this layer from also rotating the cube.
    e.stopImmediatePropagation();
  },true);

  stage.addEventListener('pointermove',e=>{
    if(!e.isTrusted || e.pointerId!==activePointer) return;

    const totalX=e.clientX-startX;
    const totalY=e.clientY-startY;
    if(!didRotate && Math.hypot(totalX,totalY)<=START_THRESHOLD) return;

    if(!didRotate){
      didRotate=true;
      gestureAxis=chooseGestureAxis(totalX,totalY);
      try{stage.setPointerCapture(e.pointerId);}catch(_){}
    }

    const dx=e.clientX-lastX;
    const dy=e.clientY-lastY;
    lastX=e.clientX;
    lastY=e.clientY;

    let delta=null;
    if(gestureAxis==='localY' && dx!==0){
      // Horizontal drag: rotate around the board's CURRENT local vertical axis.
      delta=fromAxisAngle(0,1,0,dx*SENSITIVITY);
    }else if(gestureAxis==='localX' && dy!==0){
      // Vertical drag: rotate around the board's CURRENT local horizontal axis.
      // After a 90° horizontal turn this axis points in a different world/screen
      // direction, which is what allows the layers to be turned from side-by-side
      // into a vertical stack.
      delta=fromAxisAngle(1,0,0,-dy*SENSITIVITY);
    }

    if(delta){
      // Post-multiply: delta is expressed in the object's LOCAL coordinates.
      // Pre-multiplying here would make the axes screen/world-relative instead.
      orientation=normalize(multiply(orientation,delta));
      applyOrientation();
    }

    document.querySelectorAll('#original,#front,#back,#perspective').forEach(btn=>btn.classList.remove('active'));
    stage.classList.remove('view-original','view-front','view-back','view-layers');
    e.preventDefault();
    e.stopImmediatePropagation();
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
    gestureAxis='pending';
  }

  document.addEventListener('pointerup',finishPointer,true);
  document.addEventListener('pointercancel',finishPointer,true);

  stage.addEventListener('click',e=>{
    if(!e.isTrusted || !suppressClick) return;
    suppressClick=false;
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);

  // Presets and size changes are exact starting points, so manual local-axis
  // rotation is cleared without changing the preset's own base orientation.
  document.addEventListener('click',e=>{
    const target=e.target instanceof Element?e.target:null;
    if(!target) return;
    if(target.closest('#original,#front,#back,#perspective,.size-btn[data-n],#customApply')) resetOrbit();
  },true);
  document.addEventListener('queens:sizechange',resetOrbit);

  resetOrbit();
})();
