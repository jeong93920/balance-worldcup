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
  render(`<p class="panel">${state.tournament.roundName} 시작! (대결 화면 준비 중)</p>`);
}

renderHome();
