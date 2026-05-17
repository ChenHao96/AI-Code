import { MoveGenerator } from '../engine/movegen.js';
import { BoardEvaluator } from './evaluator.js';

export class AIPlayer {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.isThinking = false;
    this.thinkingCallback = null;
    this.moveCallback = null;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  onThinking(cb) {
    this.thinkingCallback = cb;
  }

  onMove(cb) {
    this.moveCallback = cb;
  }

  cancel() {
    this.isThinking = false;
  }

  async getMove(boardState, aiColor) {
    this.isThinking = true;
    if (this.thinkingCallback) this.thinkingCallback(true);

    const moves = MoveGenerator.generateMoves(boardState, aiColor);
    if (moves.length === 0) {
      this.isThinking = false;
      if (this.thinkingCallback) this.thinkingCallback(false);
      return null;
    }

    let selected;
    if (this.difficulty === 'easy') {
      selected = this._selectEasy(moves, boardState, aiColor);
    } else if (this.difficulty === 'medium') {
      selected = this._selectMedium(moves, boardState, aiColor);
    } else {
      selected = this._selectHard(moves, boardState, aiColor);
    }

    // 思考延迟（保持不变）
    const delayCfg = {
      easy: [500, 500],
      medium: [800, 1200],
      hard: [1500, 2000]
    }[this.difficulty];
    const [base, range] = delayCfg;
    await new Promise(r => setTimeout(r, base + Math.random() * range));

    this.isThinking = false;
    if (this.thinkingCallback) this.thinkingCallback(false);
    if (this.moveCallback) this.moveCallback(selected);
    return selected;
  }

  /* ──────────────── 初级 ──────────────── */
  /**
   * 单步贪心 + 随机因子
   * 权重：子力 > 位置 > 其他，大随机量模拟失误
   */
  _selectEasy(moves, boardState, aiColor) {
    const NOISE_RANGE = 500; // 随机噪声范围，越大越"笨"

    const scored = moves.map(m => ({
      move: m,
      score: BoardEvaluator.scoreMove(boardState, m, aiColor)
        + (Math.random() - 0.5) * NOISE_RANGE
    }));
    scored.sort((a, b) => b.score - a.score);

    // 偶尔走次优解（10%概率从Top3随机选）
    if (Math.random() < 0.10 && scored.length >= 3) {
      const topN = Math.min(3, scored.length);
      return scored[Math.floor(Math.random() * topN)].move;
    }

    return scored[0].move;
  }

  /* ──────────────── 中级 ──────────────── */
  /**
   * 两步预判 + 均衡权重
   * 子力 = 位置 = 攻防 > 王安全
   */
  _selectMedium(moves, boardState, aiColor) {
    let best = moves[0];
    let bestScore = -Infinity;

    for (const m of moves) {
      const s = BoardEvaluator.scoreMoveWithLookahead(
        boardState, m, aiColor,
        { defensiveWeight: 0.2 }
      );
      if (s > bestScore) {
        bestScore = s;
        best = m;
      }
    }
    return best;
  }

  /* ──────────────── 高级 ──────────────── */
  /**
   * 两步预判 + 高防守权重
   * 王安全 > 攻防 > 位置 > 子力
   * 更保守：优先保护王、稳固防守
   */
  _selectHard(moves, boardState, aiColor) {
    let best = moves[0];
    let bestScore = -Infinity;

    for (const m of moves) {
      const s = BoardEvaluator.scoreMoveWithLookahead(
        boardState, m, aiColor,
        { defensiveWeight: 0.6 }
      );
      if (s > bestScore) {
        bestScore = s;
        best = m;
      }
    }
    return best;
  }
}
