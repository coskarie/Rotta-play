/* French opening; story, image assets and animations are loaded only when needed. */
(() => {
  'use strict';
  const assets = {
    background: 'assets/story/france-v1/hill-harbor-pov-v1.png',
    sky: 'assets/story/france-v1/sky-upward-v1.png',
    seated: 'assets/story/france-v1/hill-seated-v1.png',
    bread: 'assets/story/france-v1/hill-seated-bread-v2.png',
    script: 'assets/story/france-v1/opening-script.json?v=4',
    character: 'assets/story/france-v1/colette.png'
  };
  let lines = [], script, scriptTask;
  function loadScript() {
    return scriptTask ??= fetch(assets.script, {cache: 'force-cache'}).then(async response => {
      if (!response.ok) throw Error('France story: ' + response.status);
      const data = await response.json();
      if (!Array.isArray(data.lines) || !data.lines.length || data.lines.some(entry =>
        typeof entry.text !== 'string' || typeof entry.speaker !== 'string')) throw Error('Invalid France story script');
      return data;
    }).catch(error => { scriptTask = null; throw error; });
  }
  let root, background, villageBackground, seatedBackground, breadBackground, character, speaker, line, accessibleLine, next, panel;
  let active = false, ready = false, closing = false, index = 0;
  let finish, previousFocus, locked = [], closeTimer = 0;
  let writer = 0, writerRun = 0, typing = false, letters = [], cursor = 0;
  let portraitMode = 'hidden', scene = 'sky', bounceAnimation;
  const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function mount() {
    if (root) return;
    root = document.createElement('section');
    root.id = 'franceStory';
    root.className = 'france-story';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', '프랑스 이야기');
    root.tabIndex = -1;
    root.innerHTML = `<img class="france-story-background" alt="나무그늘 아래에서 올려다본 하늘" draggable="false">
      <img class="france-story-background france-story-village" alt="" aria-hidden="true" draggable="false">
      <img class="france-story-background france-story-seated" alt="" aria-hidden="true" draggable="false">
      <img class="france-story-background france-story-bread" alt="" aria-hidden="true" draggable="false">
      <div class="france-story-stage" aria-hidden="true"><img class="france-story-character" alt="" draggable="false"></div>
      <div class="france-story-dialogue" role="group" aria-label="대화">
        <div class="france-story-copy" aria-live="polite" aria-atomic="true"><p class="france-story-speaker"></p><p class="france-story-line" aria-hidden="true"></p><span class="france-story-accessible-line"></span></div>
        <button class="france-story-next" type="button" aria-label="다음 대화" title="다음 대화"><svg viewBox="0 0 16 12" aria-hidden="true"><path d="M2 3h12L8 10Z" fill="currentColor"/></svg></button>
      </div>`;
    document.body.appendChild(root);
    background = root.querySelector('.france-story-background');
    villageBackground = root.querySelector('.france-story-village');
    seatedBackground = root.querySelector('.france-story-seated');
    breadBackground = root.querySelector('.france-story-bread');
    character = root.querySelector('.france-story-character');
    speaker = root.querySelector('.france-story-speaker');
    line = root.querySelector('.france-story-line');
    accessibleLine = root.querySelector('.france-story-accessible-line');
    next = root.querySelector('.france-story-next');
    panel = root.querySelector('.france-story-dialogue');
    next.onclick = advance;
    panel.onclick = event => { if (!event.target.closest('button')) advance(); };
    root.addEventListener('transitionend', event => {
      if (closing && event.target === root && event.propertyName === 'opacity') complete();
    });
  }

  function stopWriter() {
    clearTimeout(writer); writer = 0; writerRun++;
  }

  function updateNextLabel() {
    const label = typing ? '대사 전체 보기' : index === lines.length - 1 ? '마르세유 항구로' : '다음 대화';
    next.setAttribute('aria-label', label);
    next.title = label;
  }

  function finishTyping() {
    stopWriter();
    cursor = letters.length;
    line.textContent = letters.join('');
    typing = false;
    root.dataset.typing = 'false';
    updateNextLabel();
  }

  function stopBounce() {
    bounceAnimation?.cancel(); bounceAnimation = undefined;
  }

  function bounce() {
    if (reducedMotion() || portraitMode === 'hidden') return;
    // Independent translate leaves the existing entrance/exit transform untouched.
    bounceAnimation = character.animate?.([
      {translate: '0 0', offset: 0},
      {translate: '0 -6px', offset: .25},
      {translate: '0 0', offset: .5},
      {translate: '0 -2px', offset: .75},
      {translate: '0 0', offset: 1}
    ], {duration: 720, easing: 'ease-in-out', iterations: 1});
  }

  function render(delay = 0) {
    stopWriter(); stopBounce();
    const entry = lines[index], run = writerRun;
    const emphasized = entry.text.includes('<바운스>');
    const text = entry.text.replaceAll('<바운스>', '');
    scene = entry.scene ?? scene;
    portraitMode = entry.character ?? portraitMode;
    root.dataset.line = String(index);
    root.dataset.scene = scene;
    root.dataset.character = portraitMode;
    background.alt = scene === 'sky' ? '나무그늘 아래에서 올려다본 하늘' : scene === 'bread' ? '언덕에서 양손으로 빵을 잡고 베어 물며 웃는 콜레트' : scene === 'seated' ? '나무그늘 아래 언덕에 나란히 앉아 항구를 바라보는 두 사람' : '언덕의 나무그늘 아래에서 내려다본 마르세유 부둣가';
    if (portraitMode === 'silhouette' && !root.classList.contains('has-character')) {
      // Set black while still invisible, preventing a flash of the real portrait.
      character.style.transition = 'none';
      root.classList.add('is-silhouette');
      void character.offsetWidth;
      character.style.transition = '';
    }
    root.classList.toggle('is-silhouette', portraitMode === 'silhouette');
    root.classList.toggle('has-character', portraitMode !== 'hidden');
    root.classList.toggle('is-narration', !entry.speaker);
    if (emphasized) bounce();
    speaker.textContent = entry.speaker;
    // Announce the complete line once; visual character ticks stay out of live regions.
    accessibleLine.textContent = text;
    letters = Array.from(text); cursor = 0; typing = true;
    line.textContent = '';
    root.dataset.typing = 'true';
    updateNextLabel();
    if (reducedMotion()) { finishTyping(); return; }
    function tick() {
      if (run !== writerRun || !active || closing || !typing) return;
      writer = 0;
      line.textContent = letters.slice(0, ++cursor).join('');
      if (cursor >= letters.length) { finishTyping(); return; }
      writer = setTimeout(tick, 32);
    }
    if (delay) writer = setTimeout(tick, delay);
    else tick();
  }

  async function start({onFinish = () => {}} = {}) {
    if (active) return false;
    mount();
    active = true; ready = false; closing = false; index = 0; finish = onFinish;
    portraitMode = 'hidden'; scene = 'sky';
    previousFocus = document.activeElement;
    locked = [...document.querySelectorAll('#game, .topbar')].map(node => [node, node.inert]);
    for (const [node] of locked) node.inert = true;
    root.classList.remove('is-visible', 'has-character', 'is-silhouette');
    root.dataset.scene = scene;
    root.hidden = false;
    root.setAttribute('aria-busy', 'true');
    background.src = assets.sky;
    villageBackground.src = assets.background;
    seatedBackground.src = assets.seated;
    breadBackground.src = assets.bread;
    character.src = assets.character;
    root.focus({preventScroll: true});
    try {
      const results = await Promise.all([background.decode(), villageBackground.decode(), seatedBackground.decode(), breadBackground.decode(), character.decode(), loadScript()]);
      script = results[5]; lines = script.lines;
    } catch (error) {
      console.warn('[Rotta France story]', error);
      complete();
      return false;
    }
    if (!active) return false;
    render(320);
    void root.offsetWidth;
    root.classList.add('is-visible');
    root.setAttribute('aria-busy', 'false');
    ready = true;
    next.focus({preventScroll: true});
    return true;
  }

  function advance() {
    if (!active || !ready || closing) return;
    if (typing) { finishTyping(); return; }
    if (index < lines.length - 1) { index++; render(); return; }
    closing = true; ready = false; stopBounce();
    root.classList.remove('is-visible', 'has-character');
    if (reducedMotion()) complete();
    else closeTimer = setTimeout(complete, 650);
  }

  function complete() {
    if (!active) return;
    clearTimeout(closeTimer); closeTimer = 0;
    stopWriter(); stopBounce(); typing = false; letters = []; cursor = 0;
    delete root.dataset.typing;
    root.hidden = true;
    root.classList.remove('is-visible', 'has-character');
    root.removeAttribute('aria-busy');
    for (const [node, wasInert] of locked) node.inert = wasInert;
    locked = [];
    active = ready = closing = false;
    const callback = finish; finish = null;
    callback?.();
    if (previousFocus?.isConnected && !previousFocus.closest('[hidden], .hidden')) previousFocus.focus({preventScroll: true});
    else document.getElementById('portView')?.focus({preventScroll: true});
    previousFocus = null;
  }

  function handleKey(event) {
    if (!active) return false;
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return true;
    if (event.key === 'Tab') { event.preventDefault(); next.focus({preventScroll: true}); return true; }
    if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
      if (!event.repeat) advance();
    }
    return true;
  }
  window.ROTTA_FRANCE_STORY = {start, handleKey, get protagonist() { return script?.protagonist; }, get active() { return active; }};
})();
