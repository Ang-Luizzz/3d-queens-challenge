(() => {
  const stage = document.getElementById('stage');
  const cube = document.getElementById('cube');
  const camera = document.querySelector('.camera-transform');
  if (!stage || !cube || !camera || !camera.contains(cube)) return;

  // One-finger manual rotation remains the approved free trackball. Named views
  // keep their approved base orientation; this outer layer stores only manual
  // orientation. Two-finger twist and Level operate on the same orientation.
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
  const SENSITIVITY = .42;

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

  function normalizeDegrees(value){
    let next=value%360;
    if(next>180) next-=360;
    if(next<-180) next+=360;
    return next;
  }

  function applyOrientation(){
    const q=normalize(orientation);
    orientation=q;
    const w=Math.max(-1,Math.min(1,q.w));
    let angle=2*Math.acos(w);
    const s=Math.sqrt(Math.max(0,1-w*w));
    if(s<1e-7 || Math.abs(angle)<1e-7){
      orbit.style.transform='none';
      return;
    }
    const x=q.x/s, y=q.y/s, z=q.z/s;
    angle=angle*180/Math.PI;
    orbit.style.transform=`rotate3d(${x},${y},${z},${angle}deg)`;
  }

  function resetOrbit(){
    orientation=IDENTITY();
    applyOrientation();
  }

  function clearNamedView(){
    document.querySelectorAll('#original,#front,#back,#perspective').forEach(btn=>btn.classList.remove('active'));
    stage.classList.remove('view-original','view-front','view-back','view-layers');
  }

  function isCameraControl(target){
    return Boolean(target?.closest?.('.camera-tools'));
  }

  stage.addEventListener('pointerdown',e=>{
    // Synthetic pointer events are still used internally to establish the
    // approved named presets. Only replace rotation for actual user input.
    if(!e.isTrusted || isCameraControl(e.target)) return;
    if(e.pointerType==='mouse' && (e.shiftKey || e.button===1 || e.button!==0)) return;
    if(activePointer!==null) return;
    activePointer=e.pointerId;
    startX=lastX=e.clientX;
    startY=lastY=e.clientY;
    didRotate=false;
    // Do not prevent default here: a tap must still be able to place a piece.
    e.stopPropagation();
  },true);

  stage.addEventListener('pointermove',e=>{
    if(!e.isTrusted || e.pointerId!==activePointer) return;
    const totalX=e.clientX-startX;
    const totalY=e.clientY-startY;
    if(!didRotate && Math.hypot(totalX,totalY)<=4) return;
    if(!didRotate){
      didRotate=true;
      try{stage.setPointerCapture(e.pointerId);}catch(_){}
    }

    const dx=e.clientX-lastX;
    const dy=e.clientY-lastY;
    lastX=e.clientX;
    lastY=e.clientY;
    if(dx===0 && dy===0) return;

    // Free trackball: axis is perpendicular to the drag vector in the screen
    // plane. Pre-multiplication keeps the incremental axis screen-relative.
    const distance=Math.hypot(dx,dy);
    const delta=fromAxisAngle(-dy,dx,0,distance*SENSITIVITY);
    orientation=normalize(multiply(delta,orientation));
    applyOrientation();
    clearNamedView();

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

  // view-layout owns two-finger pan/pinch. It emits only deliberate twist
  // deltas after a small angular dead zone, so pinch/drag jitter does not roll
  // the board. Twist is a screen-Z rotation and therefore feels like turning a
  // physical card with two fingers.
  document.addEventListener('queens:twist',e=>{
    const degrees=Number(e.detail?.degrees);
    if(!Number.isFinite(degrees) || Math.abs(degrees)<.001) return;
    const delta=fromAxisAngle(0,0,1,degrees);
    orientation=normalize(multiply(delta,orientation));
    applyOrientation();
    clearNamedView();
  });

  function transformMatrix(el){
    const value=getComputedStyle(el).transform;
    return value && value!=='none' ? new DOMMatrix(value) : new DOMMatrix();
  }

  function projectedVector(matrix,x,y,z){
    const p=new DOMPoint(x,y,z,0).matrixTransform(matrix);
    return {x:p.x,y:p.y};
  }

  // Remove only screen-space roll. The viewing direction and tilt stay where
  // they are; Level simply rotates around the axis pointing toward the viewer
  // until a board axis is horizontal/vertical again.
  function levelView(){
    try{
      const total=transformMatrix(orbit).multiply(transformMatrix(cube));
      let v=projectedVector(total,0,-1,0); // board's visual "up" direction
      let target=-90;

      // If local up is almost pointing directly toward/away from the viewer,
      // its screen projection is too small to define roll. Use local right.
      if(Math.hypot(v.x,v.y)<.08){
        v=projectedVector(total,1,0,0);
        target=0;
      }
      if(Math.hypot(v.x,v.y)<.08) return;

      const current=Math.atan2(v.y,v.x)*180/Math.PI;
      const correction=normalizeDegrees(target-current);
      if(Math.abs(correction)<.05) return;

      const delta=fromAxisAngle(0,0,1,correction);
      orientation=normalize(multiply(delta,orientation));
      applyOrientation();
      clearNamedView();
    }catch(_){
      // DOMMatrix is widely available in target browsers; if unavailable,
      // leveling simply does nothing rather than disturbing the camera.
    }
  }

  document.addEventListener('queens:levelview',levelView);

  // A named view or a size change starts from its own approved orientation.
  // Reset only the manual orbit layer; the base cube orientation remains owned
  // by the existing view/size engines.
  document.addEventListener('click',e=>{
    const target=e.target instanceof Element?e.target:null;
    if(!target) return;
    if(target.closest('#original,#front,#back,#perspective,.size-btn[data-n],#customApply')) resetOrbit();
  },true);
  document.addEventListener('queens:sizechange',resetOrbit);

  resetOrbit();
})();