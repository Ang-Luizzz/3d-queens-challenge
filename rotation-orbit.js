(() => {
  const stage = document.getElementById('stage');
  const cube = document.getElementById('cube');
  const camera = document.querySelector('.camera-transform');
  if (!stage || !cube || !camera || !camera.contains(cube)) return;

  // Named views keep their exact orientation on #cube. Manual movement lives in
  // this outer transform. Unlike the free trackball, every one-finger gesture
  // is constrained to two canonical board axes selected from the face that is
  // most visually frontal when that gesture begins.
  const orbit = document.createElement('div');
  orbit.className = 'dynamic-axis-transform';
  camera.insertBefore(orbit, cube);
  orbit.appendChild(cube);

  const style = document.createElement('style');
  style.textContent = `
    .dynamic-axis-transform{
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
  let baseOrientation = IDENTITY();
  let activePointer = null;
  let startX = 0;
  let startY = 0;
  let didRotate = false;
  let suppressClick = false;
  let gestureAxes = null;

  const START_THRESHOLD = 4;
  const H_SENSITIVITY = .38;
  const V_SENSITIVITY = .34;

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

  function cloneQ(q){
    return {x:q.x,y:q.y,z:q.z,w:q.w};
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
    if(next<=-180) next+=360;
    return next;
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
    const x=q.x/s, y=q.y/s, z=q.z/s;
    orbit.style.transform=`rotate3d(${x},${y},${z},${angleRad*180/Math.PI}deg)`;
  }

  function resetOrientation(){
    orientation=IDENTITY();
    baseOrientation=IDENTITY();
    gestureAxes=null;
    applyOrientation();
  }

  function clearNamedView(){
    document.querySelectorAll('#original,#front,#back,#perspective').forEach(btn=>btn.classList.remove('active'));
    stage.classList.remove('view-original','view-front','view-back','view-layers');
  }

  function isCameraControl(target){
    return Boolean(target?.closest?.('.camera-tools'));
  }

  function transformMatrix(el){
    const value=getComputedStyle(el).transform;
    return value && value!=='none' ? new DOMMatrix(value) : new DOMMatrix();
  }

  function transformVector(matrix,x,y,z){
    const p=new DOMPoint(x,y,z,0).matrixTransform(matrix);
    const m=Math.hypot(p.x,p.y,p.z)||1;
    return {x:p.x/m,y:p.y/m,z:p.z/m};
  }

  function scaled(v,s){
    return {x:v.x*s,y:v.y*s,z:v.z*s};
  }

  function projectedLength(v){
    return Math.hypot(v.x,v.y);
  }

  // Determine which canonical face (XY, XZ or YZ) is most frontal to the
  // viewer. Its normal is whichever transformed local axis points most strongly
  // toward/away from screen Z. Then map that face's two axes to the directions
  // that currently look most vertical and horizontal on screen.
  function visibleFaceFrame(){
    try{
      const total=transformMatrix(orbit).multiply(transformMatrix(cube));
      const axes={
        x:transformVector(total,1,0,0),
        y:transformVector(total,0,1,0),
        z:transformVector(total,0,0,1)
      };

      const normalKey=['x','y','z'].sort((a,b)=>Math.abs(axes[b].z)-Math.abs(axes[a].z))[0];
      const planeKeys=['x','y','z'].filter(k=>k!==normalKey);
      let a=axes[planeKeys[0]];
      let b=axes[planeKeys[1]];

      // Prefer the in-plane direction whose projection is visually more
      // vertical as the axis for horizontal drags. The other becomes the
      // horizontal reference for vertical drags.
      const aLen=Math.max(.0001,projectedLength(a));
      const bLen=Math.max(.0001,projectedLength(b));
      const aVertical=Math.abs(a.y)/aLen;
      const bVertical=Math.abs(b.y)/bLen;
      let verticalAxis=aVertical>=bVertical?a:b;
      let horizontalAxis=aVertical>=bVertical?b:a;

      // Match the original control's sign convention at Front:
      // +vertical axis points downward on screen (local +Y there), while
      // +horizontal axis points right (local +X there).
      if(verticalAxis.y<0) verticalAxis=scaled(verticalAxis,-1);
      if(horizontalAxis.x<0) horizontalAxis=scaled(horizontalAxis,-1);

      return {verticalAxis,horizontalAxis,normalKey,planeKeys,axes};
    }catch(_){
      return {
        verticalAxis:{x:0,y:1,z:0},
        horizontalAxis:{x:1,y:0,z:0},
        normalKey:'z',
        planeKeys:['x','y'],
        axes:{x:{x:1,y:0,z:0},y:{x:0,y:1,z:0},z:{x:0,y:0,z:1}}
      };
    }
  }

  stage.addEventListener('pointerdown',e=>{
    // view-layout's earlier capture listener still owns two-finger pan/pinch.
    // Synthetic events remain available to named presets.
    if(!e.isTrusted || isCameraControl(e.target)) return;
    if(e.pointerType==='mouse' && (e.shiftKey || e.button===1 || e.button!==0)) return;
    if(activePointer!==null) return;

    activePointer=e.pointerId;
    startX=e.clientX;
    startY=e.clientY;
    didRotate=false;
    baseOrientation=cloneQ(orientation);
    gestureAxes=visibleFaceFrame();

    // Stop the old fixed-front one-pointer engine from also rotating #cube.
    // A tap still produces its normal click because we do not preventDefault.
    e.stopPropagation();
  },true);

  stage.addEventListener('pointermove',e=>{
    if(!e.isTrusted || e.pointerId!==activePointer) return;

    const dx=e.clientX-startX;
    const dy=e.clientY-startY;
    if(!didRotate && Math.hypot(dx,dy)<=START_THRESHOLD) return;
    if(!didRotate){
      didRotate=true;
      try{stage.setPointerCapture(e.pointerId);}catch(_){}
    }
    if(!gestureAxes) gestureAxes=visibleFaceFrame();

    // The axes are selected once at gesture start and remain fixed for the
    // entire drag, just like the original control kept baseX/baseY fixed. On
    // the next gesture they are recalculated from the new visible orientation.
    const yaw=fromAxisAngle(
      gestureAxes.verticalAxis.x,
      gestureAxes.verticalAxis.y,
      gestureAxes.verticalAxis.z,
      dx*H_SENSITIVITY
    );
    const pitch=fromAxisAngle(
      gestureAxes.horizontalAxis.x,
      gestureAxes.horizontalAxis.y,
      gestureAxes.horizontalAxis.z,
      -dy*V_SENSITIVITY
    );

    orientation=normalize(multiply(pitch,multiply(yaw,baseOrientation)));
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
    gestureAxes=null;
  }

  document.addEventListener('pointerup',finishPointer,true);
  document.addEventListener('pointercancel',finishPointer,true);

  stage.addEventListener('click',e=>{
    if(!e.isTrusted || !suppressClick) return;
    suppressClick=false;
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);

  // Two-finger twist remains deliberate roll. It is separate from one-finger
  // navigation, and its result is automatically taken into account when the
  // next one-finger gesture chooses its visible-face axes.
  document.addEventListener('queens:twist',e=>{
    const degrees=Number(e.detail?.degrees);
    if(!Number.isFinite(degrees) || Math.abs(degrees)<.001) return;
    const delta=fromAxisAngle(0,0,1,degrees);
    orientation=normalize(multiply(delta,orientation));
    applyOrientation();
    clearNamedView();
  });

  // "0°" now means Straighten the face currently most frontal to the viewer.
  // Find the nearest cardinal screen orientation (0/90/180/270) for either
  // edge of that face, and apply only the smallest screen-Z correction. It does
  // not choose a new camera side and does not return to a preset.
  function straightenVisibleFace(){
    const frame=visibleFaceFrame();
    const candidates=frame.planeKeys
      .map(k=>frame.axes[k])
      .filter(v=>projectedLength(v)>.08)
      .map(v=>{
        const angle=Math.atan2(v.y,v.x)*180/Math.PI;
        const target=Math.round(angle/90)*90;
        return normalizeDegrees(target-angle);
      });

    if(!candidates.length) return;
    const correction=candidates.sort((a,b)=>Math.abs(a)-Math.abs(b))[0];
    if(Math.abs(correction)<.05) return;

    const delta=fromAxisAngle(0,0,1,correction);
    orientation=normalize(multiply(delta,orientation));
    applyOrientation();
    clearNamedView();
  }

  document.addEventListener('queens:levelview',straightenVisibleFace);

  // Presets remain canonical escape points. They reset only the manual layer;
  // the existing view engine then places #cube at its exact approved angles.
  document.addEventListener('click',e=>{
    const target=e.target instanceof Element?e.target:null;
    if(!target) return;
    if(target.closest('#original,#front,#back,#perspective,.size-btn[data-n],#customApply')) resetOrientation();
  },true);
  document.addEventListener('queens:sizechange',resetOrientation);

  resetOrientation();
})();
