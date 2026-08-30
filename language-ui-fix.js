(() => {
  const style = document.createElement('style');
  style.textContent = `
    .custom-size-toggle{
      font-size:15px!important;
      letter-spacing:normal!important;
      padding-left:6px!important;
      padding-right:6px!important;
      white-space:nowrap;
    }
    .custom-size-toggle small{
      letter-spacing:0;
    }
  `;
  document.head.appendChild(style);

  function isEnglish(){
    return document.documentElement.lang === 'en';
  }

  function aidsTitle(){
    return document.querySelector('.assist-control .control-title');
  }

  function applyAidsTitle(){
    const title = aidsTitle();
    if (!title) return;
    const expected = isEnglish() ? 'Aids' : 'Ayudas';
    if (title.textContent !== expected) title.textContent = expected;
  }

  // The aids block is moved out of .top-controls after initial load. Keep its
  // own label tied to the current language rather than DOM position.
  function bindAidsGuard(){
    const title = aidsTitle();
    if (!title || title.dataset.languageGuard === 'true') return;
    title.dataset.languageGuard = 'true';
    const observer = new MutationObserver(() => queueMicrotask(applyAidsTitle));
    observer.observe(title, {childList:true, characterData:true, subtree:true});
  }

  const langObserver = new MutationObserver(() => {
    queueMicrotask(() => {
      applyAidsTitle();
      bindAidsGuard();
    });
  });
  langObserver.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});

  document.addEventListener('click', () => {
    queueMicrotask(() => {
      applyAidsTitle();
      bindAidsGuard();
    });
  });

  queueMicrotask(() => {
    applyAidsTitle();
    bindAidsGuard();
  });
})();
