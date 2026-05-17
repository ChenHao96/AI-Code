import { INITIAL_BOARD, BOARD_ROWS, BOARD_COLS, COLOR, oppositeColor } from './constants.js';

export class BoardState {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = INITIAL_BOARD.map(row => row.map(cell => cell ? { ...cell } : null));
    this.currentTurn = COLOR.RED;
  }

  clone() {
    const newBoard = new BoardState();
    newBoard.board = this.board.map(row => row.map(cell => cell ? { ...cell } : null));
    newBoard.currentTurn = this.currentTurn;
    return newBoard;
  }

  getPiece(row, col) {
    if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return null;
    return this.board[row][col];
  }

  setPiece(row, col, piece) {
    this.board[row][col] = piece;
  }

  makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = this.board[fromRow][fromCol];
    const captured = this.board[toRow][toCol];
    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;
    this.currentTurn = oppositeColor(this.currentTurn);
    return { piece, captured, from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
  }

  undoMove(move) {
    this.board[move.from.row][move.from.col] = move.piece;
    this.board[move.to.row][move.to.col] = move.captured;
    this.currentTurn = oppositeColor(this.currentTurn);
  }

  getPieces(color) {
    const pieces = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = this.board[r][c];
        if (piece && piece.color === color) {
          pieces.push({ row: r, col: c, piece });
        }
      }
    }
    return pieces;
  }

  findKing(color) {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = this.board[r][c];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }
}
