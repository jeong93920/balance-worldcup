// 토너먼트 로직
// 선택지 배열을 받아 무작위로 섞은 뒤 2개씩 대결시키고, 승자만 다음 라운드로 올린다.

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function roundName(size) {
  return size === 2 ? '결승' : `${size}강`;
}

class Tournament {
  constructor(items, size) {
    if (items.length < size) throw new Error(`선택지가 ${size}개 이상 필요합니다.`);
    this.size = size;
    this.current = shuffle(items).slice(0, size); // 이번 라운드 참가자
    this.next = []; // 다음 라운드 진출자
    this.matchIndex = 0; // 이번 라운드에서 몇 번째 경기인지
    this.records = []; // 대진표 기록: { round, a, b, winner }
    this.history = []; // 되돌리기용 스냅샷
  }

  get roundSize() {
    return this.current.length;
  }

  get roundName() {
    return roundName(this.roundSize);
  }

  get matchesInRound() {
    return this.roundSize / 2;
  }

  get isFinished() {
    return this.current.length === 1;
  }

  get pair() {
    const i = this.matchIndex * 2;
    return [this.current[i], this.current[i + 1]];
  }

  // 전체 경기 수(size - 1) 대비 진행률 0~1
  get progress() {
    return this.records.length / (this.size - 1);
  }

  get canUndo() {
    return this.history.length > 0;
  }

  // side: 0(왼쪽) 또는 1(오른쪽)
  pick(side) {
    if (this.isFinished) return;
    this.history.push({
      current: this.current,
      next: [...this.next],
      matchIndex: this.matchIndex,
    });

    const [a, b] = this.pair;
    const winner = side === 0 ? a : b;
    this.records.push({ round: this.roundSize, a, b, winner });
    this.next.push(winner);
    this.matchIndex++;

    if (this.matchIndex === this.matchesInRound) {
      this.current = this.next;
      this.next = [];
      this.matchIndex = 0;
    }
  }

  undo() {
    const snapshot = this.history.pop();
    if (!snapshot) return;
    this.current = snapshot.current;
    this.next = snapshot.next;
    this.matchIndex = snapshot.matchIndex;
    this.records.pop();
  }

  get champion() {
    return this.isFinished ? this.current[0] : null;
  }

  get runnerUp() {
    const final = this.records.find((r) => r.round === 2);
    if (!final) return null;
    return final.winner === final.a ? final.b : final.a;
  }

  // 4강에서 탈락한 두 선택지
  get semifinalists() {
    return this.records
      .filter((r) => r.round === 4)
      .map((r) => (r.winner === r.a ? r.b : r.a));
  }

  // 라운드별로 묶은 대진표 [{ round, name, matches: [...] }]
  get bracket() {
    const rounds = [];
    for (let size = this.size; size >= 2; size /= 2) {
      const matches = this.records.filter((r) => r.round === size);
      if (matches.length) rounds.push({ round: size, name: roundName(size), matches });
    }
    return rounds;
  }
}

if (typeof module !== 'undefined') module.exports = { Tournament, shuffle, roundName };
