import { COLOR, PIECE_TYPE, PIECE_NAME, oppositeColor } from '../engine/constants.js';
import { MoveGenerator } from '../engine/movegen.js';
import { RulesEngine } from '../engine/rules.js';
import { Highlighter } from './highlighter.js';

const RED_COL = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
const BLACK_COL = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const RED_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

function colName(col, color) {
  return color === COLOR.RED ? RED_COL[col] : BLACK_COL[col];
}

function stepName(steps, color) {
  if (color === COLOR.RED) return RED_NUM[steps];
  return String(steps);
}

export function generateNotation(boardState, fromRow, fromCol, toRow, toCol) {
  const piece = boardState.getPiece(fromRow, fromCol);
  if (!piece) return '';

  const { color, type } = piece;
  const pieceName = PIECE_NAME[color][type];
  const fromColName = colName(fromCol, color);

  let prefix = pieceName;
  const sameCol = [];
  for (let r = 0; r < 10; r++) {
    if (r === fromRow) continue;
    const p = boardState.getPiece(r, fromCol);
    if (p && p.type === type && p.color === color) {
      sameCol.push(r);
    }
  }

  if (sameCol.length === 1) {
    const otherRow = sameCol[0];
    const isFront = color === COLOR.RED ? fromRow < otherRow : fromRow > otherRow;
    prefix = (isFront ? '前' : '后') + pieceName;
  } else if (sameCol.length >= 2) {
    const allRows = [fromRow, ...sameCol].sort((a, b) => a - b);
    const posIdx = color === COLOR.RED
      ? allRows.indexOf(fromRow)
      : (allRows.length - 1 - allRows.indexOf(fromRow));
    const labels = ['前', '中', '后'];
    const label = posIdx < labels.length ? labels[posIdx] : (color === COLOR.RED ? RED_NUM[posIdx + 1] : String(posIdx + 1));
    prefix = label + pieceName;
  }

  const STRAIGHT = [PIECE_TYPE.ROOK, PIECE_TYPE.CANNON, PIECE_TYPE.KING, PIECE_TYPE.PAWN];
  const rowDiff = toRow - fromRow;
  const isAdvance = (color === COLOR.RED && rowDiff < 0) || (color === COLOR.BLACK && rowDiff > 0);

  let action;
  let target;

  if (STRAIGHT.includes(type)) {
    if (fromRow === toRow) {
      action = '平';
      target = colName(toCol, color);
    } else if (isAdvance) {
      action = '进';
      target = stepName(Math.abs(rowDiff), color);
    } else {
      action = '退';
      target = stepName(Math.abs(rowDiff), color);
    }
  } else {
    action = isAdvance ? '进' : '退';
    target = colName(toCol, color);
  }

  return `${prefix}${fromColName}${action}${target}`;
}

export class InputController {
  constructor(boardRenderer, boardState, options = {}) {
    this._renderer = boardRenderer;
    this._board = boardState;
    this._opts = { mode: 'pvp', playerColor: COLOR.RED, ...options };
    this._highlighter = new Highlighter(boardRenderer);
    this._selected = null;
    this._legalMoves = [];
    this._enabled = true;
    this._onMoveMadeCb = null;
    this._onInvalidMoveCb = null;

    this._boundClick = this._onBoardClick.bind(this);
    this._renderer.canvasEl.addEventListener('click', this._boundClick);
  }

  _onBoardClick(event) {
    const pos = this._renderer.pixelToBoard(event.clientX, event.clientY);
    if (!pos) return;
    this.handleCellClick(pos.row, pos.col);
  }

  handleCellClick(row, col) {
    if (!this._enabled) return;

    if (this._opts.mode === 'pve' && this._board.currentTurn !== this._opts.playerColor) {
      return;
    }

    const piece = this._board.getPiece(row, col);

    if (this._selected) {
      const [sr, sc] = this._selected;

      if (row === sr && col === sc) {
        this._clearUI();
        return;
      }

      const isTarget = this._legalMoves.some(m => m.toRow === row && m.toCol === col);
      if (isTarget) {
        this._doMove(sr, sc, row, col);
        return;
      }

      if (piece && piece.color === this._board.currentTurn) {
        this._clearUI();
        this._selectPiece(row, col);
        return;
      }

      this._clearUI();
      if (this._onInvalidMoveCb) {
        this._onInvalidMoveCb({ reason: 'invalid-target' });
      }
      return;
    }

    if (piece && piece.color === this._board.currentTurn) {
      this._selectPiece(row, col);
    }
  }

  _selectPiece(row, col) {
    this._selected = [row, col];
    this._renderer.setSelected(row, col);

    const rawMoves = MoveGenerator.getPieceMoves(this._board, row, col);
    this._legalMoves = rawMoves.filter(m =>
      MoveGenerator.isMoveLegal(this._board, m.fromRow, m.fromCol, m.toRow, m.toCol)
    );
    this._highlighter.showLegalMoves(this._legalMoves, this._board);

    this._renderer.render(this._board);
  }

  _doMove(fromRow, fromCol, toRow, toCol) {
    const notation = generateNotation(this._board, fromRow, fromCol, toRow, toCol);
    const result = this._board.makeMove(fromRow, fromCol, toRow, toCol);

    this._renderer.setLastMoveTo(toRow, toCol);
    this._clearUI();
    this._renderer.render(this._board);

    const opponentColor = oppositeColor(result.piece.color);
    const isCheck = RulesEngine.isInCheck(this._board, opponentColor);

    if (isCheck) {
      const kingPos = this._board.findKing(opponentColor);
      if (kingPos) {
        this._renderer.setCheckHighlight(kingPos.row, kingPos.col);
      }
    } else {
      this._renderer.clearCheckHighlight();
    }

    const gameEnd = RulesEngine.checkGameEnd(this._board);

    if (this._onMoveMadeCb) {
      this._onMoveMadeCb({
        from: result.from,
        to: result.to,
        piece: result.piece,
        captured: result.captured,
        isCheck,
        notation,
        gameEnd
      });
    }
    this._renderer.render(this._board);
  }

  _clearUI() {
    this._selected = null;
    this._legalMoves = [];
    this._renderer.clearSelected();
    this._highlighter.clear();
    this._renderer.render(this._board);
  }

  enable() {
    this._enabled = true;
  }

  disable() {
    this._enabled = false;
    this._clearUI();
  }

  onMoveMade(callback) {
    this._onMoveMadeCb = callback;
  }

  onInvalidMove(callback) {
    this._onInvalidMoveCb = callback;
  }

  destroy() {
    this._renderer.canvasEl.removeEventListener('click', this._boundClick);
    this._clearUI();
  }
}
