(() => {
  const sizeStrip = document.querySelector('.size-strip');
  const assist = document.querySelector('.assist-control');
  const topControls = document.querySelector('.top-controls');
  if (!sizeStrip || !assist || !topControls) return;

  let row = document.querySelector('.assist-row');
  if (!row) {
    row = document.createElement('section');
    row.className = 'assist-row';
    sizeStrip.insertAdjacentElement('afterend', row);
  }

  row.appendChild(assist);
  assist.classList.remove('control-block');

  const style = document.createElement('style');
  style.textContent = `
    .assist-row{
      margin-top:8px;
      display:flex;
      align-items:center;
      min-width:0;
    }
    .assist-row .assist-control{
      width:100%;
      min-width:0;
      padding:9px 11px;
      border:1px solid var(--border);
      border-radius:13px;
      background:rgba(255,255,255,.018);
    }
    .assist-row .control-title{margin-bottom:7px}
    .assist-row .assist-buttons{gap:7px}
    @media(max-width:590px){
      .assist-row{margin-top:7px}
      .assist-row .assist-control{padding:8px 9px}
      .assist-row .assist-buttons{display:grid;grid-template-columns:1fr 1fr}
      .assist-row .assist-btn{min-width:0;padding:8px 7px;font-size:11px}
    }
  `;
  document.head.appendChild(style);
})();
