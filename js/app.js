// 화면 렌더링 및 이벤트 처리
const app = document.getElementById('app');

const state = {
  topic: null, // 선택한 주제 { id, title, emoji, items }
  tournament: null,
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function render(html) {
  app.innerHTML = html;
  window.scrollTo(0, 0);
}

// ---------- 홈: 주제 선택 ----------
function renderHome() {
  state.topic = null;
  state.tournament = null;

  const cards = TOPICS.map(
    (t) => `
      <button class="topic-card" data-topic="${t.id}">
        <span class="topic-emoji">${t.emoji}</span>
        <span class="topic-title">${escapeHtml(t.title)}</span>
        <span class="topic-desc">${escapeHtml(t.desc)}</span>
      </button>`
  ).join('');

  render(`
    <header class="hero">
      <h1>⚖️ 밸런스 게임 월드컵</h1>
      <p>둘 중 하나만 고를 수 있다면? 끝까지 살아남는 선택지를 가려보세요.</p>
    </header>
    <section class="topic-grid">${cards}</section>
  `);

  app.querySelectorAll('[data-topic]').forEach((btn) =>
    btn.addEventListener('click', () => {
      renderSetup(TOPICS.find((t) => t.id === btn.dataset.topic));
    })
  );
}

// ---------- 설정: 라운드 수 선택 ----------
function renderSetup(topic) {
  state.topic = topic;
  const sizes = [8, 16].filter((n) => topic.items.length >= n);

  render(`
    <section class="panel setup">
      <div class="setup-emoji">${topic.emoji}</div>
      <h2>${escapeHtml(topic.title)}</h2>
      <p class="muted">${escapeHtml(topic.desc)}</p>
      <p>몇 강으로 진행할까요?</p>
      <div class="size-buttons">
        ${sizes.map((n) => `<button class="btn primary" data-size="${n}">${n}강</button>`).join('')}
      </div>
      <button class="btn ghost" data-action="home">← 주제 다시 고르기</button>
    </section>
  `);

  app.querySelectorAll('[data-size]').forEach((btn) =>
    btn.addEventListener('click', () => startGame(Number(btn.dataset.size)))
  );
  app.querySelector('[data-action="home"]').addEventListener('click', renderHome);
}

function startGame(size) {
  state.tournament = new Tournament(state.topic.items, size);
  renderMatch();
}

// ---------- 대결 ----------
function choiceCard(item, side) {
  return `
    <button class="choice ${side === 0 ? 'left' : 'right'}" data-side="${side}">
      <span class="choice-emoji">${item.emoji || '❔'}</span>
      <span class="choice-text">${escapeHtml(item.text)}</span>
      <span class="choice-key">${side === 0 ? '← 키' : '→ 키'}</span>
    </button>`;
}

function renderMatch() {
  const t = state.tournament;
  if (t.isFinished) return renderResult();

  const [a, b] = t.pair;
  const matchLabel = t.roundSize === 2 ? '최종 결승전' : `${t.matchIndex + 1} / ${t.matchesInRound}`;

  render(`
    <section class="match">
      <div class="match-head">
        <span class="badge">${state.topic.emoji} ${escapeHtml(state.topic.title)}</span>
        <h2>${t.roundName} <small>${matchLabel}</small></h2>
        <div class="progress"><div class="progress-bar" style="width:${t.progress * 100}%"></div></div>
      </div>
      <div class="versus">
        ${choiceCard(a, 0)}
        <div class="vs">VS</div>
        ${choiceCard(b, 1)}
      </div>
      <div class="match-actions">
        <button class="btn" data-action="undo" ${t.canUndo ? '' : 'disabled'}>↶ 되돌리기</button>
        <button class="btn ghost" data-action="quit">그만하기</button>
      </div>
    </section>
  `);

  app.querySelectorAll('[data-side]').forEach((btn) =>
    btn.addEventListener('click', () => choose(Number(btn.dataset.side)))
  );
  app.querySelector('[data-action="undo"]').addEventListener('click', undo);
  app.querySelector('[data-action="quit"]').addEventListener('click', () => {
    if (confirm('진행 중인 월드컵을 그만할까요?')) renderHome();
  });
}

let choosing = false; // 선택 애니메이션 중 중복 클릭 방지

function choose(side) {
  if (choosing || !state.tournament || state.tournament.isFinished) return;
  choosing = true;
  const cards = app.querySelectorAll('.choice');
  cards[side].classList.add('picked');
  cards[1 - side].classList.add('dropped');
  setTimeout(() => {
    choosing = false;
    state.tournament.pick(side);
    renderMatch();
  }, 450);
}

function undo() {
  if (choosing || !state.tournament?.canUndo) return;
  state.tournament.undo();
  renderMatch();
}

// ---------- 결과 ----------
function itemLabel(item) {
  return `${item.emoji || '❔'} ${escapeHtml(item.text)}`;
}

function renderBracket(t) {
  return t.bracket
    .map(
      (round) => `
      <div class="bracket-round">
        <h4>${round.name}</h4>
        <ul>
          ${round.matches
            .map(
              (m) => `
            <li>
              <span class="${m.winner === m.a ? 'win' : 'lose'}">${itemLabel(m.a)}</span>
              <span class="bracket-vs">vs</span>
              <span class="${m.winner === m.b ? 'win' : 'lose'}">${itemLabel(m.b)}</span>
            </li>`
            )
            .join('')}
        </ul>
      </div>`
    )
    .join('');
}

function renderResult() {
  const t = state.tournament;
  const champ = t.champion;

  render(`
    <section class="result">
      <span class="badge">${state.topic.emoji} ${escapeHtml(state.topic.title)} · ${t.size}강</span>
      <div class="champion">
        <div class="trophy">🏆</div>
        <p class="muted">나의 최종 1위</p>
        <div class="champion-emoji">${champ.emoji || '❔'}</div>
        <h2 class="champion-text">${escapeHtml(champ.text)}</h2>
      </div>
      <div class="podium">
        <div class="podium-item"><span>🥈 준우승</span><strong>${itemLabel(t.runnerUp)}</strong></div>
        ${t.semifinalists
          .map((s) => `<div class="podium-item"><span>🥉 4강</span><strong>${itemLabel(s)}</strong></div>`)
          .join('')}
      </div>
      <div class="result-actions">
        <button class="btn primary" data-action="again">🔁 다시하기</button>
        <button class="btn" data-action="bracket">📋 대진표 보기</button>
        <button class="btn" data-action="home">🏠 홈으로</button>
      </div>
      <div class="bracket" hidden>${renderBracket(t)}</div>
    </section>
  `);

  app.querySelector('[data-action="again"]').addEventListener('click', () => startGame(t.size));
  app.querySelector('[data-action="home"]').addEventListener('click', renderHome);
  app.querySelector('[data-action="bracket"]').addEventListener('click', (e) => {
    const bracket = app.querySelector('.bracket');
    bracket.hidden = !bracket.hidden;
    e.currentTarget.textContent = bracket.hidden ? '📋 대진표 보기' : '📋 대진표 접기';
  });
}

// 키보드: ← / → 선택, Backspace 되돌리기
document.addEventListener('keydown', (e) => {
  if (!app.querySelector('.versus')) return;
  if (e.key === 'ArrowLeft') choose(0);
  else if (e.key === 'ArrowRight') choose(1);
  else if (e.key === 'Backspace') undo();
});

renderHome();
