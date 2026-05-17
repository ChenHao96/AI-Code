import {
  PIECE_VALUE, PIECE_TYPE, POSITION_VALUE, COLOR,
  oppositeColor, BOARD_ROWS, BOARD_COLS, MOBILITY_VALUE
} from '../engine/constants.js';
import { MoveGenerator } from '../engine/movegen.js';

/* ──────────────── 基础辅助函数 ──────────────── */

function inBounds(row, col) {
  return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
}

function isInPalace(row, col, color) {
  if (color === COLOR.RED) return row >= 7 && row <= 9 && col >= 3 && col <= 5;
  return row >= 0 && row <= 2 && col >= 3 && col <= 5;
}

function hasCrossedRiver(row, color) {
  return color === COLOR.RED ? row <= 4 : row >= 5;
}

function countBetween(board, r1, c1, r2, c2) {
  let count = 0;
  if (r1 === r2) {
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    for (let c = minC + 1; c < maxC; c++) {
      if (board[r1][c] !== null) count++;
    }
  } else if (c1 === c2) {
    const minR = Math.min(r1, r2);
    const maxR = Math.max(r1, r2);
    for (let r = minR + 1; r < maxR; r++) {
      if (board[r][c1] !== null) count++;
    }
  }
  return count;
}

function getMaterialValue(piece, row) {
  if (piece.type === PIECE_TYPE.PAWN && hasCrossedRiver(row, piece.color)) {
    return PIECE_VALUE[PIECE_TYPE.PAWN] + 100;
  }
  return PIECE_VALUE[piece.type];
}

function getPosValue(piece, row, col) {
  const table = POSITION_VALUE[piece.type];
  if (!table) return 0;
  if (piece.color === COLOR.RED) {
    return table[row][col];
  }
  return table[9 - row][8 - col];
}

/* ──────────────── 攻击检测 ──────────────── */

function canAttack(board, piece, fromR, fromC, toR, toC) {
  switch (piece.type) {
    case PIECE_TYPE.ROOK:
      return (fromR === toR || fromC === toC)
        && countBetween(board, fromR, fromC, toR, toC) === 0;

    case PIECE_TYPE.KNIGHT: {
      const dr = Math.abs(fromR - toR);
      const dc = Math.abs(fromC - toC);
      if (!((dr === 2 && dc === 1) || (dr === 1 && dc === 2))) return false;
      const legR = dr === 2 ? fromR + (toR > fromR ? 1 : -1) : fromR;
      const legC = dc === 2 ? fromC + (toC > fromC ? 1 : -1) : fromC;
      return board[legR][legC] === null;
    }

    case PIECE_TYPE.CANNON:
      return (fromR === toR || fromC === toC)
        && countBetween(board, fromR, fromC, toR, toC) === 1;

    case PIECE_TYPE.PAWN: {
      const forward = piece.color === COLOR.RED ? -1 : 1;
      if (fromC === toC && toR === fromR + forward) return true;
      if (hasCrossedRiver(fromR, piece.color)
        && fromR === toR
        && Math.abs(fromC - toC) === 1) return true;
      return false;
    }

    case PIECE_TYPE.ADVISOR:
      return Math.abs(fromR - toR) === 1
        && Math.abs(fromC - toC) === 1
        && isInPalace(toR, toC, piece.color);

    case PIECE_TYPE.ELEPHANT: {
      if (Math.abs(fromR - toR) !== 2 || Math.abs(fromC - toC) !== 2) return false;
      if (piece.color === COLOR.RED && toR < 5) return false;
      if (piece.color === COLOR.BLACK && toR > 4) return false;
      const eyeR = fromR + (toR > fromR ? 1 : -1);
      const eyeC = fromC + (toC > fromC ? 1 : -1);
      return board[eyeR][eyeC] === null;
    }

    case PIECE_TYPE.KING:
      return fromC === toC
        && countBetween(board, fromR, fromC, toR, toC) === 0;

    default:
      return false;
  }
}

function isSquareAttacked(board, row, col, attackerColor) {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== attackerColor) continue;
      if (canAttack(board, piece, r, c, row, col)) return true;
    }
  }
  return false;
}

/* ──────────────── 威胁评分 ──────────────── */

function getNearbyThreatBonus(board, row, col, piece, opponentColor) {
  let bonus = 0;
  const pieceType = piece.type;

  if (pieceType === PIECE_TYPE.ROOK || pieceType === PIECE_TYPE.CANNON) {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      let r = row + dr;
      let c = col + dc;
      let betweenCount = 0;
      while (inBounds(r, c)) {
        const target = board[r][c];
        if (target) {
          if (target.color === opponentColor) {
            if (pieceType === PIECE_TYPE.ROOK && betweenCount === 0) {
              bonus += getMaterialValue(target, r) * 0.2;
            } else if (pieceType === PIECE_TYPE.CANNON && betweenCount === 1) {
              bonus += getMaterialValue(target, r) * 0.2;
            }
          }
          betweenCount++;
          if (betweenCount > 1) break;
        }
        r += dr;
        c += dc;
      }
    }
  }

  if (pieceType === PIECE_TYPE.KNIGHT) {
    const offsets = [
      [-2, -1, -1, 0], [-2, 1, -1, 0],
      [2, -1, 1, 0], [2, 1, 1, 0],
      [-1, -2, 0, -1], [-1, 2, 0, 1],
      [1, -2, 0, -1], [1, 2, 0, 1]
    ];
    for (const [dr, dc, lr, lc] of offsets) {
      const tr = row + dr;
      const tc = col + dc;
      if (!inBounds(tr, tc)) continue;
      if (board[row + lr][col + lc] !== null) continue;
      const target = board[tr][tc];
      if (target && target.color === opponentColor) {
        bonus += getMaterialValue(target, tr) * 0.2;
      }
    }
  }

  if (pieceType === PIECE_TYPE.PAWN) {
    const forward = piece.color === COLOR.RED ? -1 : 1;
    const fr = row + forward;
    if (inBounds(fr, col)) {
      const target = board[fr][col];
      if (target && target.color === opponentColor) {
        bonus += getMaterialValue(target, fr) * 0.2;
      }
    }
    if (hasCrossedRiver(row, piece.color)) {
      for (const dc of [-1, 1]) {
        const tc = col + dc;
        if (inBounds(row, tc)) {
          const target = board[row][tc];
          if (target && target.color === opponentColor) {
            bonus += getMaterialValue(target, row) * 0.2;
          }
        }
      }
    }
  }

  return bonus;
}

/* ══════════════════════════════════════════════
   新增功能函数
   ══════════════════════════════════════════════ */

/* ──────────────── A. 攻防关系分析 ──────────────── */

/**
 * 分析某个位置棋子的攻击者和保护者
 * @param {Array<Array>} board - 棋盘二维数组
 * @param {number} row - 目标位置行
 * @param {number} col - 目标位置列
 * @param {string} defenderColor - 防守方颜色（保护该位置的己方颜色）
 * @returns {{ attackers: Array<{row,col,value,type}>, defenders: Array<{row,col,value,type}> }}
 */
function analyzeAttackDefense(board, row, col, defenderColor) {
  const attackers = [];
  const defenders = [];
  const opponentColor = oppositeColor(defenderColor);

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      if (canAttack(board, piece, r, c, row, col)) {
        const info = { row: r, col: c, value: getMaterialValue(piece, r), type: piece.type };
        if (piece.color === opponentColor) {
          attackers.push(info);
        } else {
          defenders.push(info);
        }
      }
    }
  }

  // 按价值升序排列，便于交换评估
  attackers.sort((a, b) => a.value - b.value);
  defenders.sort((a, b) => a.value - b.value);

  return { attackers, defenders };
}

/* ──────────────── B. 静态交换评估 (SEE) ──────────────── */

/**
 * 评估在 toRow,toCol 吃子后的交换净收益（浅层SEE，深度=1）
 * @param {Array<Array>} board - 棋盘二维数组
 * @param {number} toRow - 目标行
 * @param {number} toCol - 目标列
 * @param {number} capturerRow - 吃子方行
 * @param {number} capturerCol - 吃子方列
 * @returns {number} 净得分（正=赚，负=亏）
 */
function staticExchangeEvaluate(board, toRow, toCol, capturerRow, capturerCol) {
  const victim = board[toRow][toCol];
  if (!victim) return 0;

  const capturer = board[capturerRow][capturerCol];
  if (!capturer || capturer.color === victim.color) return 0;

  const victimValue = getMaterialValue(victim, toRow);
  const capturerValue = getMaterialValue(capturer, capturerRow);

  // 模拟吃子后的棋盘
  const simBoard = board.map(r => [...r]);
  simBoard[toRow][toCol] = simBoard[capturerRow][capturerCol];
  simBoard[capturerRow][capturerCol] = null;

  // 找出对手能用来反吃的最便宜棋子
  const opponentColor = oppositeColor(capturer.color);
  let minRecapturerVal = Infinity;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = simBoard[r][c];
      if (!piece || piece.color !== opponentColor) continue;
      if (canAttack(simBoard, piece, r, c, toRow, toCol)) {
        const val = getMaterialValue(piece, r);
        if (val < minRecapturerVal) minRecapturerVal = val;
      }
    }
  }

  // 无人能反吃 → 净赚
  if (minRecapturerVal === Infinity) return victimValue;

  // 对手反吃有利可图 → 会发生反吃
  // 净收益 = 吃掉的值 - 失去吃子棋子的值
  if (minRecapturerVal <= victimValue + capturerValue) {
    return victimValue - capturerValue;
  }

  // 对手反吃不划算 → 不会反吃
  return victimValue;
}

/* ──────────────── C. 王安全评估 ──────────────── */

/**
 * 评估某一方王的安全状态
 * @param {Array<Array>} board - 棋盘二维数组
 * @param {string} color - 被评估方颜色
 * @returns {number} 正分=安全，负分=危险
 */
function evaluateKingSafety(board, color) {
  // 找到王
  let kingR = -1, kingC = -1;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const p = board[r][c];
      if (p && p.type === PIECE_TYPE.KING && p.color === color) {
        kingR = r;
        kingC = c;
        break;
      }
    }
    if (kingR >= 0) break;
  }
  if (kingR < 0) return -10000;

  let score = 0;
  const opponentColor = oppositeColor(color);

  // 1. 是否被将军
  if (isSquareAttacked(board, kingR, kingC, opponentColor)) {
    score -= 120;
  }

  // 2. 九宫内的守卫
  const pMinR = color === COLOR.RED ? 7 : 0;
  const pMaxR = color === COLOR.RED ? 9 : 2;
  for (let r = pMinR; r <= pMaxR; r++) {
    for (let c = 3; c <= 5; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        if (p.type === PIECE_TYPE.ADVISOR) score += 40;
        else if (p.type === PIECE_TYPE.ELEPHANT) score += 30;
        else if (p.type !== PIECE_TYPE.KING) score += 10;
      }
    }
  }

  // 3. 对方棋子对王的直接威胁
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const p = board[r][c];
      if (!p || p.color !== opponentColor) continue;

      // 能直接攻击王的棋子
      if (canAttack(board, p, r, c, kingR, kingC)) {
        score -= getMaterialValue(p, r) * 0.2;
      }

      // 车与王同列（即使被挡），潜在威胁
      if (p.type === PIECE_TYPE.ROOK && c === kingC) {
        const between = countBetween(board, r, c, kingR, kingC);
        if (between <= 1) score -= 30;
      }

      // 炮与王同行/同列
      if (p.type === PIECE_TYPE.CANNON && (r === kingR || c === kingC)) {
        const between = countBetween(board, r, c, kingR, kingC);
        if (between === 0) score -= 20; // 炮还未架好但已瞄着
        if (between === 1) score -= 50; // 炮已经架好！
      }
    }
  }

  // 4. 王的逃跑格数
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let escapeCount = 0;
  for (const [dr, dc] of dirs) {
    const r = kingR + dr;
    const c = kingC + dc;
    if (inBounds(r, c) && isInPalace(r, c, color)) {
      const p = board[r][c];
      if (!p || p.color !== color) {
        // 不被己方棋子占据
        if (!isSquareAttacked(board, r, c, opponentColor)) {
          escapeCount++;
        }
      }
    }
  }
  score += escapeCount * 20;

  return score;
}

/* ══════════════════════════════════════════════
   BoardEvaluator 类
   ══════════════════════════════════════════════ */

export class BoardEvaluator {

  /* ─── 基础局面评估（保留） ─── */

  static evaluate(boardState, aiColor) {
    let score = 0;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = boardState.getPiece(r, c);
        if (!piece) continue;
        const value = getMaterialValue(piece, r) + getPosValue(piece, r, c);
        score += piece.color === aiColor ? value : -value;
      }
    }
    return score;
  }

  /* ─── D. 综合局面评估（多因子） ─── */

  /**
   * 综合局面评分 = 子力 + 位置 + 机动性 + 王安全
   * @param {BoardState} boardState - 棋盘状态
   * @param {string} aiColor - AI颜色
   * @param {Object} options - 可选参数
   * @param {boolean} options.includeMobility - 是否评估机动性（默认true，lookahead中建议关掉以提速）
   * @param {number} options.defensiveWeight - 防守权重 0~1，越高越重视王安全（默认0）
   * @returns {number}
   */
  static evaluateBoard(boardState, aiColor, options = {}) {
    const board = boardState.board;
    const opponentColor = oppositeColor(aiColor);

    let materialScore = 0;
    let posScore = 0;

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = board[r][c];
        if (!piece) continue;
        const sign = piece.color === aiColor ? 1 : -1;
        materialScore += sign * getMaterialValue(piece, r);
        posScore += sign * getPosValue(piece, r, c);
      }
    }

    // 机动性（在 lookahead 中可以跳过以提速）
    let mobilityScore = 0;
    if (options.includeMobility !== false) {
      const aiMoves = MoveGenerator.generateMoves(boardState, aiColor).length;
      const oppMoves = MoveGenerator.generateMoves(boardState, opponentColor).length;
      mobilityScore = (aiMoves - oppMoves) * MOBILITY_VALUE;
    }

    // 王安全
    const aiKingSafety = evaluateKingSafety(board, aiColor);
    const oppKingSafety = evaluateKingSafety(board, opponentColor);
    const kingSafetyScore = aiKingSafety - oppKingSafety;

    // 防守权重：Hard 模式更重视安全，easy 模式反之
    const defW = options.defensiveWeight || 0;
    const kingWeight = 1.5 + defW * 2.5; // 1.5 ~ 4.0
    const matWeight = 1.0;
    const posWeight = 0.6 - defW * 0.2; // 0.6 ~ 0.4

    return matWeight * materialScore
      + posWeight * posScore
      + mobilityScore
      + kingWeight * kingSafetyScore;
  }

  /* ─── 单步走法评分（保留，Easy 用） ─── */

  static scoreMove(boardState, move, aiColor) {
    const piece = boardState.getPiece(move.fromRow, move.fromCol);
    const captured = boardState.getPiece(move.toRow, move.toCol);
    let score = 0;

    if (captured) {
      score += getMaterialValue(captured, move.toRow);
    }

    const oldPos = getPosValue(piece, move.fromRow, move.fromCol);
    const newPos = getPosValue(piece, move.toRow, move.toCol);
    score += newPos - oldPos;

    if (piece.color !== aiColor) {
      score = -score;
    }

    return score;
  }

  /* ─── 增强走法评分（保留并改进，Medium/Hard 的基值用） ─── */

  static scoreMoveAdvanced(boardState, move, aiColor) {
    const piece = boardState.getPiece(move.fromRow, move.fromCol);
    const captured = boardState.getPiece(move.toRow, move.toCol);
    const opponentColor = oppositeColor(aiColor);
    let score = 0;

    // 吃子评估 — 使用 SEE 避免傻交换
    if (captured) {
      const capturedValue = getMaterialValue(captured, move.toRow);
      const seeResult = staticExchangeEvaluate(
        boardState.board, move.toRow, move.toCol,
        move.fromRow, move.fromCol
      );
      // 至少得一半价值，SEE 可能给出更准确的估值
      score += Math.max(capturedValue * 0.4, seeResult);
    }

    // 位置改善
    const oldPos = getPosValue(piece, move.fromRow, move.fromCol);
    const newPos = getPosValue(piece, move.toRow, move.toCol);
    score += newPos - oldPos;

    // 克隆并执行走法
    const clone = boardState.clone();
    clone.makeMove(move.fromRow, move.fromCol, move.toRow, move.toCol);

    // 将军奖励
    if (MoveGenerator.isKingInCheck(clone, opponentColor)) {
      score += 70;
    }

    // 落点防守评估 — 是否被己方保护
    const { defenders } = analyzeAttackDefense(
      clone.board, move.toRow, move.toCol, aiColor
    );
    if (defenders.length >= 2) {
      score += 15; // 有充分保护
    } else if (defenders.length === 1) {
      score += 5;
    }

    // 落点受攻惩罚
    if (isSquareAttacked(clone.board, move.toRow, move.toCol, opponentColor)) {
      const pieceValue = getMaterialValue(piece, move.toRow);
      if (captured) {
        const capturedValue = getMaterialValue(captured, move.toRow);
        if (pieceValue > capturedValue) {
          score -= (pieceValue - capturedValue); // 大换小
        } else {
          score -= pieceValue * 0.2; // 小换大但可能会被吃回
        }
      } else {
        score -= pieceValue * 0.4; // 平白送子
      }
    }

    // 威胁加分
    score += getNearbyThreatBonus(
      clone.board, move.toRow, move.toCol, piece, opponentColor
    );

    if (piece.color !== aiColor) {
      score = -score;
    }

    return score;
  }

  /* ─── E. 两步预判走法评分 ─── */

  /**
   * 两步预判：执行走法后，对手选择最佳应对，评估最终局面
   * 计算量约 O(moves × 15) ≈ 450 次评估，在 JS 中 < 100ms
   *
   * @param {BoardState} boardState - 当前棋盘状态
   * @param {Object} move - 待评估的AI走法
   * @param {string} aiColor - AI颜色
   * @param {Object} options - 权重参数
   * @param {number} options.defensiveWeight - 防守权重（默认0，Hard模式0.6）
   * @returns {number} 走法评分
   */
  static scoreMoveWithLookahead(boardState, move, aiColor, options = {}) {
    const opponentColor = oppositeColor(aiColor);

    // 执行AI走法
    const clone = boardState.clone();
    clone.makeMove(move.fromRow, move.fromCol, move.toRow, move.toCol);

    // 生成对手合法走法
    const opponentMoves = MoveGenerator.generateMoves(clone, opponentColor);

    // 对手无合法走法 → 将杀/困毙，极大值
    if (opponentMoves.length === 0) {
      return 99999;
    }

    // 采样对手最优应对（按单步贪心排序，取前15个）
    const TOP_N = 15;
    let sampled;
    if (opponentMoves.length <= TOP_N) {
      sampled = opponentMoves;
    } else {
      sampled = opponentMoves
        .map(om => ({
          move: om,
          quick: BoardEvaluator.scoreMove(clone, om, opponentColor)
        }))
        .sort((a, b) => b.quick - a.quick)
        .slice(0, TOP_N)
        .map(x => x.move);
    }

    // 对手选择最不利于AI的应对（min-max）
    let worstScore = Infinity;
    const evalOpts = {
      includeMobility: false, // lookahead中关机动性以提速
      defensiveWeight: options.defensiveWeight || 0
    };
    for (const om of sampled) {
      const oppClone = clone.clone();
      oppClone.makeMove(om.fromRow, om.fromCol, om.toRow, om.toCol);
      const evalScore = BoardEvaluator.evaluateBoard(oppClone, aiColor, evalOpts);
      if (evalScore < worstScore) worstScore = evalScore;
    }

    // 融合即时评分（30%权重），兼顾战术意识
    const immediateScore = BoardEvaluator.scoreMoveAdvanced(boardState, move, aiColor);

    return worstScore + immediateScore * 0.3;
  }
}
