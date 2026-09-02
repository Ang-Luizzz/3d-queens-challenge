(() => {
  const boardLayout = document.querySelector('.board-layout');
  const toolbar = document.querySelector('.camera-tools');
  if (!boardLayout || !toolbar) return;

  const zoomOut = toolbar.querySelector('#zoomOut');
  const zoomIn = toolbar.querySelector('#zoomIn');
  const center = toolbar.querySelector('#centerView');
  const straighten = toolbar.querySelector('#levelView');
  if (!zoomOut || !zoomIn || !center || !straighten) return;

  // The controls used to float over the 3D viewport. Keep the same buttons and
  // listeners, but move the group into normal document flow immediately below
  // the viewport and before the verifier/action bar.
  toolbar.classList.add('camera-tools-inline');
  boardLayout.insertAdjacentElement('afterend', toolbar);

  center.classList.add('camera-action');
  straighten.classList.add('camera-action');

  function copy() {
    return document.documentElement.lang === 'en'
      ? {
          group: 'View controls',
          zoomOut: 'Zoom out',
          zoomIn: 'Zoom in',
          center: 'Center',
          straighten: 'Straighten'
        }
      : {
          group: 'Controles de vista',
          zoomOut: 'Alejar',
          zoomIn: 'Acercar',
          center: 'Centrar',
          straighten: 'Enderezar'
        };
  }

  function renderLabels() {
    const t = copy();
    toolbar.setAttribute('aria-label', t.group);

    zoomOut.setAttribute('aria-label', t.zoomOut);
    zoomOut.title = t.zoomOut;
    zoomIn.setAttribute('aria-label', t.zoomIn);
    zoomIn.title = t.zoomIn;

    center.setAttribute('aria-label', t.center);
    center.title = t.center;
    center.innerHTML = `<span class="camera-action-icon" aria-hidden="true">◎</span><span class="camera-action-label">${t.center}</span>`;

    straighten.setAttribute('aria-label', t.straighten);
    straighten.title = t.straighten;
    straighten.innerHTML = `<span class="camera-action-icon camera-straighten-icon" aria-hidden="true">▱</span><span class="camera-action-label">${t.straighten}</span>`;
  }

  const langObserver = new MutationObserver(renderLabels);
  langObserver.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});

  renderLabels();
})();
