(() => {
  const sourceStrip = document.querySelector('.size-strip');
  const sourceGame = document.querySelector('.game-card');
  if (!sourceStrip || !sourceGame) return;

  // The original inline game was written for n×n×n only. Replace its live DOM
  // once, before the enhancement scripts initialize, so the old listeners stay
  // attached to detached nodes and this engine can support X×Y×Z safely.
  const sizeStrip = sourceStrip.cloneNode(true);
  const gameCard = sourceGame.cloneNode(true);
  sourceStrip.replaceWith(sizeStrip);
  sourceGame.replaceWith(gameCard);

  const cube = gameCard.querySelector('#cube');
  const stage = gameCard.querySelector('#stage');
  const layerRail = gameCard.querySelector('#layerRail');
  const separation = gameCard.querySelector('#separation');
  const separationValue = gameCard.querySelector('#separationValue');
  const result = gameCard.querySelector('#result');
  const checkBtn = gameCard.querySelector('#check');
  const resetPieces = gameCard.querySelector('#resetPieces');
  const actionbar = gameCard.querySelector('.actionbar');
  const perspectiveBtn = gameCard.querySelector('#perspective');
  const frontBtn = gameCard.querySelector('#front');
  const originalBtn = gameCard.querySelector('#original');
  const showAttackedBtn = gameCard.querySelector('#showAttacked');
  const showConflictsBtn = gameCard.querySelector('#showConflicts');
  if (!cube || !stage || !layerRail || !separation || !result || !checkBtn) return;

  const maxima = {
    '3x3x3':4,  '3x3x4':5,  '3x3x5':6,  '3x3x6':8,
    '3x4x4':6,  '3x4x5':7,  '3x4x6':9,
    '3x5x5':9,  '3x5x6':11, '3x6x6':12,
    '4x4x4':7,  '4x4x5':9,  '4x4x6':11,
    '4x5x5':12, '4x5x6':14, '4x6x6':15,
    '5x5x5':13, '5x5x6':15, '5x6x6':18,
    '6x6x6':21
  };

  const layerColors = ['#38bdf8','#8b5cf6','#f59e0b','#14b8a6','#f43f5e','#65a30d'];
  let dims = {x:3,y:3,z:3};
  let customMode = false;
  let activeLayer = 0;
  let queens = new Set();
  let undoStack = [];
  let depth = 92;
  let showAttacked = false;
  let showConflicts = false;

  const ORIGINAL_X = -56;
  const ORIGINAL_Y = 32;
  let rotX = ORIGINAL_X;
  let rotY = ORIGINAL_Y;
  let dragging = false;
  let dragged = false;
  let startX = 0;
  let startY = 0;
  let baseX = rotX;
  let baseY = rotY;

  const style = document.createElement('style');
  style.textContent = `
    .custom-size-toggle{min-width:124px}
    .custom-size-panel{display:none;flex:1 0 100%;align-items:end;gap:8px;padding:10px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.018)}
    .custom-size-panel.open{display:flex}
    .custom-dim{display:grid;gap:4px;min-width:66px}
    .custom-dim span{font-size:9px;font-weight:900;letter-spacing:.08em;color:var(--muted)}
    .custom-dim input{width:66px;height:42px;border:1px solid var(--border);border-radius:10px;background:#0d1728;color:var(--text);text-align:center;font-weight:900;outline:none}
    .custom-dim input:focus{border-color:#8197ed;box-shadow:0 0 0 2px rgba(109,140,255,.15)}
    .custom-apply{min-height:42px;padding:8px 14px;border:1px solid #687fe4;border-radius:10px;background:linear-gradient(135deg,#416be0,#7357db);color:#fff;font-weight:900}
    .custom-range-note{align-self:center;margin-left:auto;color:var(--muted);font-size:9px;font-weight:750}
    .actionbar.has-undo{grid-template-columns:auto auto minmax(140px,1fr) auto}
    #undoPiece:disabled{opacity:.38;cursor:default}
    @media(max-width:590px){
      .custom-size-panel{flex-wrap:wrap;align-items:end}
      .custom-dim{flex:1;min-width:58px}.custom-dim input{width:100%}
      .custom-apply{flex:1;min-width:92px}.custom-range-note{flex:1 0 100%;margin-left:0}
      .actionbar.has-undo{grid-template-columns:repeat(3,minmax(0,1fr))}
      .actionbar.has-undo .result{grid-column:1/-1;grid-row:1}
      .actionbar.has-undo .action-btn{grid-row:2;min-width:0;padding-left:8px;padding-right:8px}
    }
  `;
  document.head.appendChild(style);

  let undoBtn = gameCard.querySelector('#undoPiece');
  if (!undoBtn && actionbar && resetPieces) {
    undoBtn = document.createElement('button');
    undoBtn.id = 'undoPiece';
    undoBtn.type = 'button';
    undoBtn.className = 'action-btn';
    actionbar.insertBefore(undoBtn, resetPieces);
    actionbar.classList.add('has-undo');
  }

  // Fixed 6×6×6 sits beside the existing fixed sizes.
  let sixBtn = sizeStrip.querySelector('.size-btn[data-n="6"]');
  if (!sixBtn) {
    sixBtn = document.createElement('button');
    sixBtn.type = 'button';
    sixBtn.className = 'size-btn';
    sixBtn.dataset.n = '6';
    sixBtn.innerHTML = '6×6×6<small>216 casillas</small>';
    sizeStrip.appendChild(sixBtn);
  }

  const customBtn = document.createElement('button');
  customBtn.type = 'button';
  customBtn.className = 'size-btn custom-size-toggle';
  customBtn.setAttribute('aria-expanded','false');
  sizeStrip.appendChild(customBtn);

  const customPanel = document.createElement('div');
  customPanel.className = 'custom-size-panel';
  customPanel.innerHTML = `
    <label class="custom-dim"><span>X</span><input id="customX" inputmode="numeric" type="number" min="3" max="6" step="1" value="3"></label>
    <label class="custom-dim"><span>Y</span><input id="customY" inputmode="numeric" type="number" min="3" max="6" step="1" value="3"></label>
    <label class="custom-dim"><span>Z</span><input id="customZ" inputmode="numeric" type="number" min="3" max="6" step="1" value="3"></label>
    <button id="customApply" class="custom-apply" type="button"></button>
    <span class="custom-range-note"></span>
  `;
  sizeStrip.appendChild(customPanel);

  const customX = customPanel.querySelector('#customX');
  const customY = customPanel.querySelector('#customY');
  const customZ = customPanel.querySelector('#customZ');
  const customApply = customPanel.querySelector('#customApply');
  const customNote = customPanel.querySelector('.custom-range-note');
  const fixedButtons = [...sizeStrip.querySelectorAll('.size-btn[data-n]')];

  function lang(){ return document.documentElement.lang === 'en' ? 'en' : 'es'; }
  function words(){
    return lang() === 'en'
      ? {custom:'Custom', customSub:'X × Y × Z', apply:'Apply', note:'3–6 on each axis', cells:'squares', unchecked:'Not checked', layer:'Layer', top:'Top', bottom:'Bottom', diagonal:'Diagonal', undo:'Undo'}
      : {custom:'Personalizado', customSub:'X × Y × Z', apply:'Aplicar', note:'3–6 en cada eje', cells:'casillas', unchecked:'Sin verificar', layer:'Capa', top:'Arriba', bottom:'Abajo', diagonal:'Diagonal', undo:'Deshacer'};
  }

  function updateUndoState(){
    if (!undoBtn) return;
    undoBtn.disabled = undoStack.length === 0;
    undoBtn.setAttribute('aria-disabled', String(undoBtn.disabled));
  }

  function pushUndoState(){
    undoStack.push(new Set(queens));
    if (undoStack.length > 200) undoStack.shift();
    updateUndoState();
  }

  function updateTexts(){
    const t = words();
    customBtn.innerHTML = `${t.custom}<small>${t.customSub}</small>`;
    customApply.textContent = t.apply;
    customNote.textContent = t.note;
    if (undoBtn) undoBtn.textContent = t.undo;
    fixedButtons.forEach(btn => {
      const n = Number(btn.dataset.n);
      const small = btn.querySelector('small');
      if (small) small.textContent = `${n*n*n} ${t.cells}`;
    });
    if (originalBtn) originalBtn.textContent = t.diagonal;
    renderLayerRail();
    if (!result.classList.contains('ok') && !result.classList.contains('bad')) result.textContent = t.unchecked;
  }

  const key = (x,y,z) => `${x},${y},${z}`;
  const maxKey = () => [dims.x,dims.y,dims.z].sort((a,b)=>a-b).join('x');

  function resetResult(){
    result.className = 'result';
    result.textContent = words().unchecked;
  }

  function queenList(){
    return [...queens].map(s => {
      const [x,y,z] = s.split(',').map(Number);
      return {x,y,z,key:s};
    });
  }

  function attacks(a,b){
    const nonzero = [Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.z-b.z)].filter(v => v !== 0);
    return nonzero.length > 0 && nonzero.every(v => v === nonzero[0]);
  }

  function conflictSet(){
    const list = queenList();
    const set = new Set();
    for(let i=0;i<list.length;i++) for(let j=i+1;j<list.length;j++) {
      if(attacks(list[i],list[j])) { set.add(list[i].key); set.add(list[j].key); }
    }
    return set;
  }

  function isAttackedSquare(x,y,z){
    const target = {x,y,z};
    for(const q of queenList()){
      if(q.x===x && q.y===y && q.z===z) continue;
      if(attacks(q,target)) return true;
    }
    return false;
  }

  function isNonAttacking(list){
    for(let i=0;i<list.length;i++) for(let j=i+1;j<list.length;j++) if(attacks(list[i],list[j])) return false;
    return true;
  }

  function defaultDepth(){
    return ({3:92,4:78,5:66,6:58})[dims.z] || 72;
  }

  function currentScale(){
    const spread = (dims.z-1)*depth;
    const maxSide = Math.max(dims.x,dims.y);
    const sizePenalty = maxSide>=6 ? .80 : maxSide===5 ? .86 : maxSide===4 ? .93 : 1;
    const spreadPenalty = spread>520 ? .76 : spread>420 ? .82 : spread>330 ? .88 : spread>250 ? .94 : 1;
    return sizePenalty*spreadPenalty;
  }

  function updateBoardGeometry(){
    const maxSide = Math.max(dims.x,dims.y);
    cube.style.width = `calc(var(--plane-size) * ${dims.x/maxSide})`;
    cube.style.height = `calc(var(--plane-size) * ${dims.y/maxSide})`;
  }

  function updateCubeTransform(){
    cube.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${currentScale()})`;
  }

  function setPreset(name){
    if(name==='perspective') { rotX=ORIGINAL_X; rotY=ORIGINAL_Y; }
    else if(name==='front') { rotX=0; rotY=0; }
    perspectiveBtn?.classList.toggle('active', name==='perspective');
    frontBtn?.classList.toggle('active', name==='front');
    updateCubeTransform();
  }

  function resetView(){ setPreset('perspective'); }
  function clearViewSelection(){ perspectiveBtn?.classList.remove('active'); frontBtn?.classList.remove('active'); }
  function planeTranslate(z){ return ((dims.z-1)/2-z)*depth; }

  function layerPositionText(z){
    const t=words();
    if(z===0) return t.top;
    if(z===dims.z-1) return t.bottom;
    return '';
  }

  function renderLayerRail(){
    layerRail.querySelectorAll('.layer-btn').forEach(el=>el.remove());
    const t=words();
    for(let z=0;z<dims.z;z++){
      const b=document.createElement('button');
      b.type='button';
      b.className='layer-btn'+(z===activeLayer?' active':'');
      b.style.setProperty('--layer-color',layerColors[z%layerColors.length]);
      b.innerHTML=`<span class="layer-line"><span class="layer-dot"></span><span class="layer-name">${t.layer} ${z+1}</span></span><span class="layer-pos">${layerPositionText(z)}</span>`;
      b.addEventListener('click',()=>{ activeLayer=z; resetResult(); render(); });
      layerRail.appendChild(b);
    }
  }

  function render(){
    cube.innerHTML='';
    updateBoardGeometry();
    const conflicts=showConflicts?conflictSet():new Set();
    for(let z=0;z<dims.z;z++){
      const plane=document.createElement('div');
      plane.className='plane '+(z===activeLayer?'active':'inactive');
      plane.style.gridTemplateColumns=`repeat(${dims.x},1fr)`;
      plane.style.gridTemplateRows=`repeat(${dims.y},1fr)`;
      plane.style.transform=`translateZ(${planeTranslate(z)}px)`;
      plane.style.setProperty('--layer-color',layerColors[z%layerColors.length]);
      plane.dataset.z=z;
      for(let y=0;y<dims.y;y++) for(let x=0;x<dims.x;x++){
        const cell=document.createElement('button');
        cell.type='button';
        cell.className='cell '+(((x+y)%2===0)?'light':'dark');
        cell.dataset.x=x; cell.dataset.y=y; cell.dataset.z=z;
        const k=key(x,y,z);
        const occupied=queens.has(k);
        if(showAttacked&&!occupied&&isAttackedSquare(x,y,z)) cell.classList.add('attacked');
        if(showConflicts&&occupied&&conflicts.has(k)) cell.classList.add('conflict');
        if(occupied){
          const q=document.createElement('span'); q.className='queen'; q.textContent='♛'; cell.appendChild(q);
        }
        plane.appendChild(cell);
      }
      cube.appendChild(plane);
    }
    renderLayerRail();
    separationValue.textContent=depth+' px';
    showAttackedBtn?.setAttribute('aria-pressed',String(showAttacked));
    showConflictsBtn?.setAttribute('aria-pressed',String(showConflicts));
    updateCubeTransform();
    updateUndoState();
  }

  cube.addEventListener('click',e=>{
    if(dragged){ dragged=false; return; }
    const cell=e.target.closest('.cell');
    if(!cell) return;
    const z=Number(cell.dataset.z);
    if(z!==activeLayer) return;
    const x=Number(cell.dataset.x), y=Number(cell.dataset.y), k=key(x,y,z);
    pushUndoState();
    if(queens.has(k)) queens.delete(k); else queens.add(k);
    resetResult(); render();
  });

  stage.addEventListener('pointerdown',e=>{
    dragging=true; dragged=false; startX=e.clientX; startY=e.clientY; baseX=rotX; baseY=rotY;
    try{stage.setPointerCapture(e.pointerId);}catch(_){}
  });
  stage.addEventListener('pointermove',e=>{
    if(!dragging) return;
    const dx=e.clientX-startX, dy=e.clientY-startY;
    if(Math.abs(dx)>3||Math.abs(dy)>3) dragged=true;
    rotY=baseY+dx*.38; rotX=baseX-dy*.34;
    if(rotY>180) rotY-=360; if(rotY<-180) rotY+=360;
    if(rotX>180) rotX-=360; if(rotX<-180) rotX+=360;
    clearViewSelection(); updateCubeTransform();
  });
  function endDrag(e){
    if(!dragging) return; dragging=false;
    try{stage.releasePointerCapture(e.pointerId);}catch(_){}
    setTimeout(()=>{dragged=false;},40);
  }
  stage.addEventListener('pointerup',endDrag); stage.addEventListener('pointercancel',endDrag);

  perspectiveBtn?.addEventListener('click',()=>setPreset('perspective'));
  frontBtn?.addEventListener('click',()=>setPreset('front'));
  originalBtn?.addEventListener('click',resetView);
  separation.addEventListener('input',()=>{ depth=Number(separation.value); render(); });
  showAttackedBtn?.addEventListener('click',()=>{ showAttacked=!showAttacked; render(); });
  showConflictsBtn?.addEventListener('click',()=>{ showConflicts=!showConflicts; render(); });

  function markSizeButtons(){
    fixedButtons.forEach(b=>{
      const n=Number(b.dataset.n);
      b.classList.toggle('active',!customMode&&dims.x===n&&dims.y===n&&dims.z===n);
    });
    customBtn.classList.toggle('active',customMode);
  }

  function updateStageForSize(){
    const complexity=Math.max(dims.x,dims.y,dims.z);
    const mobile=window.matchMedia('(max-width:590px)').matches;
    const h=mobile?({3:470,4:515,5:560,6:600}[complexity]):({3:550,4:590,5:630,6:680}[complexity]);
    if(h) stage.style.minHeight=`${h}px`;
  }

  function setDimensions(next,fromCustom){
    dims={x:next.x,y:next.y,z:next.z};
    customMode=fromCustom;
    queens=new Set(); undoStack=[]; activeLayer=0; depth=defaultDepth();
    separation.value=String(depth);
    markSizeButtons(); resetResult(); resetView(); render(); updateStageForSize();
    document.dispatchEvent(new CustomEvent('queens:sizechange',{detail:{...dims,custom:customMode}}));
    setTimeout(updateStageForSize,70);
  }

  fixedButtons.forEach(b=>b.addEventListener('click',()=>{
    const n=Number(b.dataset.n); if(!Number.isInteger(n)) return;
    customPanel.classList.remove('open'); customBtn.setAttribute('aria-expanded','false');
    setDimensions({x:n,y:n,z:n},false);
  }));

  customBtn.addEventListener('click',e=>{
    e.stopImmediatePropagation();
    const opening=!customPanel.classList.contains('open');
    customPanel.classList.toggle('open',opening);
    customBtn.setAttribute('aria-expanded',String(opening));
    if(opening){ customX.value=dims.x; customY.value=dims.y; customZ.value=dims.z; customX.focus(); }
  });

  function validDim(input){
    const v=Math.round(Number(input.value));
    const safe=Math.max(3,Math.min(6,Number.isFinite(v)?v:3));
    input.value=String(safe); return safe;
  }
  [customX,customY,customZ].forEach(input=>input.addEventListener('change',()=>validDim(input)));

  customApply.addEventListener('click',()=>{
    const next={x:validDim(customX),y:validDim(customY),z:validDim(customZ)};
    setDimensions(next,true);
    customPanel.classList.remove('open'); customBtn.setAttribute('aria-expanded','false');
  });

  undoBtn?.addEventListener('click',()=>{
    const previous=undoStack.pop();
    if(!previous) return;
    queens=new Set(previous);
    resetResult(); render();
  });

  resetPieces?.addEventListener('click',()=>{
    if(queens.size>0) pushUndoState();
    queens.clear(); resetResult(); render();
  });
  checkBtn.addEventListener('click',()=>{
    const list=queenList();
    const target=maxima[maxKey()];
    const correct=Number.isInteger(target)&&list.length===target&&isNonAttacking(list);
    if(correct){ result.className='result ok'; result.textContent=lang()==='en'?'Correct.':'Correcto.'; }
    else { result.className='result bad'; result.textContent=lang()==='en'?'Incorrect.':'Incorrecto.'; }
  });

  const langObserver=new MutationObserver(()=>queueMicrotask(updateTexts));
  langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('resize',()=>setTimeout(updateStageForSize,0));

  markSizeButtons();
  updateTexts();
  render();
  resetView();
  updateStageForSize();
  updateUndoState();
  setTimeout(updateTexts,0);
})();