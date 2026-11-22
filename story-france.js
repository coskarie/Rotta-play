/* A short, self-contained opening; assets are loaded only after choosing France. */
(() => {
  'use strict';
  const assets = {
    background: 'assets/story/france-v1/home-exterior.png',
    character: 'assets/story/france-v1/colette.png'
  };
  const lines = [
    {speaker: '', text: '평화로운 나날이 지속되었다.', character: false},
    {speaker: '콜레트', text: '또 바다를 보고 있었어? 아침부터 네가 안 보여서 찾았잖아.', character: true},
    {speaker: '나', text: '언젠가는 내 무역선을 갖고 싶어. 저 수평선 너머의 항구들을 돌아다니는 거야.', character: true},
    {speaker: '콜레트', text: '그 말, 어릴 때부터 했지. 그렇다면 마르세유에 가 보는 건 어때?', character: true},
    {speaker: '나', text: '맞아. 항구에서 일부터 배워 볼게. 내 배를 갖는 첫걸음이 될 테니까.', character: true},
    {speaker: '콜레트', text: '좋아. 네 배가 생기면, 가장 먼저 나를 태워 주기야.', character: true},
    {speaker: '', text: '작은 꿈 하나를 품고, 나는 마르세유로 향하기로 했다.', character: false}
  ];
  let root, background, character, speaker, line, next, panel;
  let active = false, ready = false, closing = false, index = 0;
  let finish, previousFocus, locked = [], closeTimer = 0, lineAnimation;
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
    root.innerHTML = `<img class="france-story-background" alt="평화로운 프랑스 해안 마을의 작은 집" draggable="false">
      <div class="france-story-stage" aria-hidden="true"><img class="france-story-character" alt="" draggable="false"></div>
      <div class="france-story-dialogue" role="group" aria-label="대화">
        <div class="france-story-copy" aria-live="polite" aria-atomic="true"><p class="france-story-speaker"></p><p class="france-story-line"></p></div>
        <button class="france-story-next" type="button" aria-label="다음 대화" title="다음 대화"><svg viewBox="0 0 16 12" aria-hidden="true"><path d="M2 3h12L8 10Z" fill="currentColor"/></svg></button>
        <span class="france-story-hint" aria-hidden="true">클릭 또는 Enter · Space로 다음 대화</span>
      </div>`;
    document.body.appendChild(root);
    background = root.querySelector('.france-story-background');
    character = root.querySelector('.france-story-character');
    speaker = root.querySelector('.france-story-speaker');
    line = root.querySelector('.france-story-line');
    next = root.querySelector('.france-story-next');
    panel = root.querySelector('.france-story-dialogue');
    next.onclick = advance;
    panel.onclick = event => { if (!event.target.closest('button')) advance(); };
    root.addEventListener('transitionend', event => {
      if (closing && event.target === root && event.propertyName === 'opacity') complete();
    });
  }

  function render() {
    const entry = lines[index];
    root.dataset.line = String(index);
    root.classList.toggle('has-character', entry.character);
    root.classList.toggle('is-narration', !entry.speaker);
    speaker.textContent = entry.speaker;
    line.textContent = entry.text;
    next.setAttribute('aria-label', index === lines.length - 1 ? '마르세유 항구로' : '다음 대화');
    next.title = index === lines.length - 1 ? '마르세유 항구로' : '다음 대화';
    lineAnimation?.cancel();
    if (!reducedMotion()) lineAnimation = line.animate?.([{opacity: 0}, {opacity: 1}], {duration: 180});
  }

  async function start({onFinish = () => {}} = {}) {
    if (active) return false;
    mount();
    active = true; ready = false; closing = false; index = 0; finish = onFinish;
    previousFocus = document.activeElement;
    locked = [...document.querySelectorAll('#game, .topbar')].map(node => [node, node.inert]);
    for (const [node] of locked) node.inert = true;
    root.classList.remove('is-visible', 'has-character');
    root.hidden = false;
    root.setAttribute('aria-busy', 'true');
    background.src = assets.background;
    character.src = assets.character;
    root.focus({preventScroll: true});
    try {
      await Promise.all([background.decode(), character.decode()]);
    } catch (error) {
      console.warn('[Rotta France story]', error);
      complete();
      return false;
    }
    if (!active) return false;
    render();
    void root.offsetWidth;
    root.classList.add('is-visible');
    root.setAttribute('aria-busy', 'false');
    ready = true;
    next.focus({preventScroll: true});
    return true;
  }

  function advance() {
    if (!active || !ready || closing) return;
    if (index < lines.length - 1) { index++; render(); return; }
    closing = true; ready = false;
    root.classList.remove('is-visible', 'has-character');
    if (reducedMotion()) complete();
    else closeTimer = setTimeout(complete, 650);
  }

  function complete() {
    if (!active) return;
    clearTimeout(closeTimer); closeTimer = 0;
    lineAnimation?.cancel(); lineAnimation = undefined;
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
  window.ROTTA_FRANCE_STORY = {start, handleKey, get active() { return active; }};
})();
