import { COLOR, PIECE_TYPE, BOARD_ROWS, BOARD_COLS, oppositeColor } from './constants.js';

/* ──────────────── 基础辅助 ──────────────── */

function inBounds(row, col) {
  return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
}

function isInPalace(row, col, color) {
  if (color === COLOR.RED) {
    return row >= 7 && row <= 9 && col >= 3 && col <= 5;
  }
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

/* ──────────────── 单棋子候选走法（操作原始二维数组） ──────────────── */

function generateRookMoves(board, fromRow, fromCol, color) {
  const moves = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    let r = fromRow + dr;
    let c = fromCol + dc;
    while (inBounds(r, c)) {
      const target = board[r][c];
      if (target === null) {
        moves.push({ fromRow, fromCol, toRow: r, toCol: c });
      } else {
        if (target.color !== color) {
          moves.push({ fromRow, fromCol, toRow: r, toCol: c });
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return moves;
}

function generateKnightMoves(board, fromRow, fromCol, color) {
  const moves = [];
  const offsets = [
    [-2, -1], [-2, 1], [2, -1], [2, 1],
    [-1, -2], [-1, 2], [1, -2], [1, 2]
  ];
  for (const [dr, dc] of offsets) {
    const tr = fromRow + dr;
    const tc = fromCol + dc;
    if (!inBounds(tr, tc)) continue;

    const legR = Math.abs(dr) === 2
      ? fromRow + (dr > 0 ? 1 : -1)
      : fromRow;
    const legC = Math.abs(dc) === 2
      ? fromCol + (dc > 0 ? 1 : -1)
      : fromCol;

    if (board[legR][legC] !== null) continue;

    const target = board[tr][tc];
    if (target === null || target.color !== color) {
      moves.push({ fromRow, fromCol, toRow: tr, toCol: tc });
    }
  }
  return moves;
}

function generateCannonMoves(board, fromRow, fromCol, color) {
  const moves = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    let r = fromRow + dr;
    let c = fromCol + dc;

    // 不吃子移动：遇子停止
    while (inBounds(r, c) && board[r][c] === null) {
      moves.push({ fromRow, fromCol, toRow: r, toCol: c });
      r += dr;
      c += dc;
    }
    if (!inBounds(r, c)) continue;

    // 跳过炮架，寻找第一个敌方棋子
    r += dr;
    c += dc;
    while (inBounds(r, c)) {
      if (board[r][c] !== null) {
        if (board[r][c].color !== color) {
          moves.push({ fromRow, fromCol, toRow: r, toCol: c });
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return moves;
}

function generatePawnMoves(board, fromRow, fromCol, color) {
  const moves = [];
  const forward = color === COLOR.RED ? -1 : 1;

  const fr = fromRow + forward;
  if (inBounds(fr, fromCol)) {
    const target = board[fr][fromCol];
    if (target === null || target.color !== color) {
      moves.push({ fromRow, fromCol, toRow: fr, toCol: fromCol });
    }
  }

  if (hasCrossedRiver(fromRow, color)) {
    for (const dc of [-1, 1]) {
      const tc = fromCol + dc;
      if (inBounds(fromRow, tc)) {
        const target = board[fromRow][tc];
        if (target === null || target.color !== color) {
          moves.push({ fromRow, fromCol, toRow: fromRow, toCol: tc });
        }
      }
    }
  }
  return moves;
}

function generateAdvisorMoves(board, fromRow, fromCol, color) {
  const moves = [];
  const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of dirs) {
    const tr = fromRow + dr;
    const tc = fromCol + dc;
    if (inBounds(tr, tc) && isInPalace(tr, tc, color)) {
      const target = board[tr][tc];
      if (target === null || target.color !== color) {
        moves.push({ fromRow, fromCol, toRow: tr, toCol: tc });
      }
    }
  }
  return moves;
}

function generateElephantMoves(board, fromRow, fromCol, color) {
  const moves = [];
  const dirs = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
  for (const [dr, dc] of dirs) {
    const tr = fromRow + dr;
    const tc = fromCol + dc;
    if (!inBounds(tr, tc)) continue;

    // 不能过河
    if (color === COLOR.RED && tr < 5) continue;
    if (color === COLOR.BLACK && tr > 4) continue;

    // 塞眼检测（田字中心）
    const eyeR = fromRow + (dr > 0 ? 1 : -1);
    const eyeC = fromCol + (dc > 0 ? 1 : -1);
    if (board[eyeR][eyeC] !== null) continue;

    const target = board[tr][tc];
    if (target === null || target.color !== color) {
      moves.push({ fromRow, fromCol, toRow: tr, toCol: tc });
    }
  }
  return moves;
}

function generateKingMoves(board, fromRow, fromCol, color) {
  const moves = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const tr = fromRow + dr;
    const tc = fromCol + dc;
    if (inBounds(tr, tc) && isInPalace(tr, tc, color)) {
      const target = board[tr][tc];
      if (target === null || target.color !== color) {
        moves.push({ fromRow, fromCol, toRow: tr, toCol: tc });
      }
    }
  }
  return moves;
}

const PIECE_MOVE_GENERATORS = {
  [PIECE_TYPE.ROOK]: generateRookMoves,
  [PIECE_TYPE.KNIGHT]: generateKnightMoves,
  [PIECE_TYPE.CANNON]: generateCannonMoves,
  [PIECE_TYPE.PAWN]: generatePawnMoves,
  [PIECE_TYPE.ADVISOR]: generateAdvisorMoves,
  [PIECE_TYPE.ELEPHANT]: generateElephantMoves,
  [PIECE_TYPE.KING]: generateKingMoves
};

function rawPieceMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const generator = PIECE_MOVE_GENERATORS[piece.type];
  return generator ? generator(board, row, col, piece.color) : [];
}

/* ──────────────── 将军检测（操作原始二维数组） ──────────────── */

function rawKingInCheck(board, color) {
  let kingR = -1;
  let kingC = -1;
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
  if (kingR < 0) return false;

  const enemy = oppositeColor(color);

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== enemy) continue;

      if (canPieceAttack(board, piece, r, c, kingR, kingC)) {
        return true;
      }
    }
  }
  return false;
}

/* ──────────────── 单棋子攻击判断 ──────────────── */

function canPieceAttack(board, piece, fromR, fromC, targetR, targetC) {
  switch (piece.type) {
    case PIECE_TYPE.ROOK:
      return (fromR === targetR || fromC === targetC)
        && countBetween(board, fromR, fromC, targetR, targetC) === 0;

    case PIECE_TYPE.KNIGHT: {
      const dr = Math.abs(fromR - targetR);
      const dc = Math.abs(fromC - targetC);
      if (!((dr === 2 && dc === 1) || (dr === 1 && dc === 2))) return false;
      const legR = dr === 2
        ? fromR + (targetR > fromR ? 1 : -1)
        : fromR;
      const legC = dc === 2
        ? fromC + (targetC > fromC ? 1 : -1)
        : fromC;
      return board[legR][legC] === null;
    }

    case PIECE_TYPE.CANNON:
      return (fromR === targetR || fromC === targetC)
        && countBetween(board, fromR, fromC, targetR, targetC) === 1;

    case PIECE_TYPE.PAWN: {
      const forward = piece.color === COLOR.RED ? -1 : 1;
      if (fromC === targetC && targetR === fromR + forward) return true;
      if (hasCrossedRiver(fromR, piece.color)
        && fromR === targetR
        && Math.abs(fromC - targetC) === 1) return true;
      return false;
    }

    case PIECE_TYPE.ADVISOR:
      return Math.abs(fromR - targetR) === 1
        && Math.abs(fromC - targetC) === 1
        && isInPalace(targetR, targetC, piece.color);

    case PIECE_TYPE.ELEPHANT: {
      if (Math.abs(fromR - targetR) !== 2 || Math.abs(fromC - targetC) !== 2) return false;
      if (piece.color === COLOR.RED && targetR < 5) return false;
      if (piece.color === COLOR.BLACK && targetR > 4) return false;
      const eyeR = fromR + (targetR > fromR ? 1 : -1);
      const eyeC = fromC + (targetC > fromC ? 1 : -1);
      return board[eyeR][eyeC] === null;
    }

    case PIECE_TYPE.KING:
      // 飞将：两将同列且之间无棋子
      return fromC === targetC
        && countBetween(board, fromR, fromC, targetR, targetC) === 0;

    default:
      return false;
  }
}

/* ──────────────── 公开接口 ──────────────── */

export class MoveGenerator {

  static generateMoves(boardState, color) {
    const board = boardState.board;
    const moves = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = board[r][c];
        if (!piece || piece.color !== color) continue;
        const candidates = rawPieceMoves(board, r, c);
        for (const mv of candidates) {
          if (MoveGenerator.isMoveLegal(boardState, mv.fromRow, mv.fromCol, mv.toRow, mv.toCol)) {
            moves.push(mv);
          }
        }
      }
    }
    return moves;
  }

  static getPieceMoves(boardState, row, col) {
    return rawPieceMoves(boardState.board, row, col);
  }

  static isMoveLegal(boardState, fromRow, fromCol, toRow, toCol) {
    const clone = boardState.clone();
    clone.makeMove(fromRow, fromCol, toRow, toCol);
    const movingColor = clone.board[toRow][toCol].color;
    return !rawKingInCheck(clone.board, movingColor);
  }

  static isKingInCheck(boardState, color) {
    return rawKingInCheck(boardState.board, color);
  }
}
