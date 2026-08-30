(() => {
  const style = document.createElement('style');
  style.textContent = `
    .custom-size-toggle{
      padding-left:8px!important;
      padding-right:8px!important;
      font-size:11px!important;
      letter-spacing:-.015em;
      white-space:nowrap;
    }
    .custom-size-toggle small{
      letter-spacing:0;
    }
    @media(max-width:430px){
      .custom-size-toggle{font-size:10px!important;padding-left:6px!important;padding-right:6px!important}
    }
  `;
  document.head.appendChild(style);

  function isEnglish(){
    return document.documentElement.lang === 'en';
  }

  function setControlTitle(controlSelector, value){
    const control = document.querySelector(controlSelector);
    const block = control?.closest('.control-block');
    const title = block?.querySelector('.control-title');
    if (title && title.textContent !== value) title.textContent = value;
  }

  function applyCorrectLabels(){
    const en = isEnglish();
    setControlTitle('#original', en ? 'View' : 'Vista');
    setControlTitle('#separation', en ? 'Layer spacing' : 'Separación de capas');
    setControlTitle('#showAttacked', en ? 'Aids' : 'Ayudas');

    const original = document.getElementById('original');
    if (original && original.textContent.trim() !== 'Diagonal') original.textContent = 'Diagonal';
  }

  const observer = new MutationObserver(() => queueMicrotask(applyCorrectLabels));
  observer.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});

  document.addEventListener('click', () => queueMicrotask(applyCorrectLabels));
  queueMicrotask(applyCorrectLabels);
})();
