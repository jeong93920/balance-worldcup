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

  const topicCard = (t, custom) => `
      <div class="topic-wrap">
        <button class="topic-card" data-topic="${t.id}">
          <span class="topic-emoji">${t.emoji}</span>
          <span class="topic-title">${escapeHtml(t.title)}</span>
          <span class="topic-desc">${escapeHtml(t.desc)}</span>
        </button>
        ${custom ? `<button class="topic-delete" data-delete="${t.id}" aria-label="삭제">✕</button>` : ''}
      </div>`;

  const customTopics = loadCustomTopics();

  render(`
    <header class="hero">
      <h1>⚖️ 밸런스 게임 월드컵</h1>
      <p>둘 중 하나만 고를 수 있다면? 끝까지 살아남는 선택지를 가려보세요.</p>
      <button class="btn records-btn" data-action="records">📊 나의 기록</button>
    </header>
    <section class="topic-grid">
      ${TOPICS.map((t) => topicCard(t, false)).join('')}
      <button class="topic-card create-card" data-action="create">
        <span class="topic-emoji">✏️</span>
        <span class="topic-title">나만의 월드컵 만들기</span>
        <span class="topic-desc">선택지를 직접 입력해요</span>
      </button>
    </section>
    ${
      customTopics.length
        ? `<h3 class="section-title">내가 만든 월드컵</h3>
           <section class="topic-grid">${customTopics.map((t) => topicCard(t, true)).join('')}</section>`
        : ''
    }
  `);

  app.querySelectorAll('[data-topic]').forEach((btn) =>
    btn.addEventListener('click', () => renderSetup(findTopic(btn.dataset.topic)))
  );
  app.querySelectorAll('[data-delete]').forEach((btn) =>
    btn.addEventListener('click', () => {
      if (confirm('이 월드컵을 삭제할까요?')) {
        deleteCustomTopic(btn.dataset.delete);
        renderHome();
      }
    })
  );
  app.querySelector('[data-action="create"]').addEventListener('click', renderCreate);
  app.querySelector('[data-action="records"]').addEventListener('click', renderRecords);
}

// ---------- 만들기: 나만의 월드컵 ----------
// 한 줄에 하나씩 입력. 줄 맨 앞에 이모지를 쓰면 카드 이모지로 사용한다.
function parseItems(text) {
  const emojiPrefix = /^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s*/u;
  const seen = new Set();
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(emojiPrefix);
      return match ? { emoji: match[1], text: line.slice(match[0].length).trim() } : { emoji: '⭐', text: line };
    })
    .filter((item) => item.text && !seen.has(item.text) && seen.add(item.text));
}

function renderCreate() {
  render(`
    <section class="panel create">
      <h2>✏️ 나만의 월드컵 만들기</h2>
      <p class="muted">선택지를 한 줄에 하나씩, 8개 이상 입력하세요. 16개 이상이면 16강도 가능해요.</p>
      <label>제목
        <input id="create-title" maxlength="30" placeholder="예) 우리 과 극한 선택" />
      </label>
      <label>선택지 <span class="count" id="create-count">0개</span>
        <textarea id="create-items" rows="12" placeholder="🍕 평생 피자만 먹기&#10;🏖️ 평생 여름만 계속되기&#10;..."></textarea>
      </label>
      <p class="error" id="create-error" hidden></p>
      <div class="result-actions">
        <button class="btn primary" data-action="save">저장하고 시작</button>
        <button class="btn ghost" data-action="home">취소</button>
      </div>
    </section>
  `);

  const titleInput = app.querySelector('#create-title');
  const itemsInput = app.querySelector('#create-items');
  const count = app.querySelector('#create-count');
  const error = app.querySelector('#create-error');

  itemsInput.addEventListener('input', () => {
    const n = parseItems(itemsInput.value).length;
    count.textContent = `${n}개`;
    count.classList.toggle('ok', n >= 8);
  });

  app.querySelector('[data-action="home"]').addEventListener('click', renderHome);
  app.querySelector('[data-action="save"]').addEventListener('click', () => {
    const title = titleInput.value.trim();
    const items = parseItems(itemsInput.value);
    const problem = !title ? '제목을 입력해주세요.' : items.length < 8 ? `선택지가 ${8 - items.length}개 더 필요해요.` : '';
    error.hidden = !problem;
    error.textContent = problem;
    if (problem) return;

    const topic = { id: `custom-${Date.now()}`, title, emoji: '✏️', desc: `직접 만든 선택지 ${items.length}개`, items };
    saveCustomTopic(topic);
    renderSetup(topic);
  });
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
  if (!t.recorded) {
    addRecord(state.topic, champ);
    t.recorded = true;
  }

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
        <button class="btn" data-action="share">📤 결과 공유</button>
        <button class="btn" data-action="bracket">📋 대진표 보기</button>
        <button class="btn" data-action="home">🏠 홈으로</button>
      </div>
      <div class="bracket" hidden>${renderBracket(t)}</div>
    </section>
  `);

  celebrate(champ.emoji || '🎉');
  app.querySelector('[data-action="again"]').addEventListener('click', () => startGame(t.size));
  app.querySelector('[data-action="home"]').addEventListener('click', renderHome);
  app.querySelector('[data-action="share"]').addEventListener('click', () => shareResult(t));
  app.querySelector('[data-action="bracket"]').addEventListener('click', (e) => {
    const bracket = app.querySelector('.bracket');
    bracket.hidden = !bracket.hidden;
    e.currentTarget.textContent = bracket.hidden ? '📋 대진표 보기' : '📋 대진표 접기';
  });
}

// 우승 이모지와 폭죽이 위에서 떨어지는 연출
function celebrate(emoji) {
  const pieces = [emoji, '🎉', '✨', '🎊'];
  for (let i = 0; i < 28; i++) {
    const el = document.createElement('span');
    el.className = 'confetti';
    el.textContent = pieces[i % pieces.length];
    el.style.left = `${Math.random() * 100}vw`;
    el.style.animationDuration = `${2 + Math.random() * 2}s`;
    el.style.animationDelay = `${Math.random() * 0.8}s`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }
}

function shareResult(t) {
  const text = [
    `⚖️ 밸런스 게임 월드컵 [${state.topic.title} ${t.size}강]`,
    `🏆 1위: ${t.champion.text}`,
    `🥈 2위: ${t.runnerUp.text}`,
    `🥉 4강: ${t.semifinalists.map((s) => s.text).join(', ')}`,
    location.protocol.startsWith('http') ? location.href : '',
  ]
    .filter(Boolean)
    .join('\n');

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(
      () => toast('결과를 복사했어요! 친구에게 붙여넣어 보세요 📋'),
      () => prompt('아래 내용을 복사하세요', text)
    );
  } else {
    prompt('아래 내용을 복사하세요', text);
  }
}

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// ---------- 나의 기록 ----------
function renderRecords() {
  const records = Object.entries(loadRecords());

  const body = records.length
    ? records
        .map(([, r]) => {
          const ranking = Object.entries(r.wins)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5);
          const max = ranking[0][1].count;
          return `
          <div class="record-card">
            <h3>${r.emoji} ${escapeHtml(r.title)} <small>${r.plays}판</small></h3>
            <ol>
              ${ranking
                .map(
                  ([text, w]) => `
                <li>
                  <span class="record-label">${w.emoji || '⭐'} ${escapeHtml(text)}</span>
                  <span class="record-bar"><span style="width:${(w.count / max) * 100}%"></span></span>
                  <span class="record-count">${w.count}회</span>
                </li>`
                )
                .join('')}
            </ol>
          </div>`;
        })
        .join('')
    : '<p class="panel muted">아직 기록이 없어요. 월드컵을 한 판 끝내면 우승 기록이 쌓여요!</p>';

  render(`
    <section class="records">
      <h2>📊 나의 기록</h2>
      <p class="muted">주제별로 내가 1위로 고른 선택지 TOP 5</p>
      ${body}
      <div class="result-actions">
        <button class="btn" data-action="home">🏠 홈으로</button>
        ${records.length ? '<button class="btn ghost" data-action="clear">기록 초기화</button>' : ''}
      </div>
    </section>
  `);

  app.querySelector('[data-action="home"]').addEventListener('click', renderHome);
  app.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
    if (confirm('모든 기록을 지울까요?')) {
      clearRecords();
      renderRecords();
    }
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
