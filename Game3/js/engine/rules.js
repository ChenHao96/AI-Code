import { COLOR, oppositeColor } from './constants.js';
import { MoveGenerator } from './movegen.js';

export class RulesEngine {

  static isCheckmate(boardState, color) {
    if (!MoveGenerator.isKingInCheck(boardState, color)) {
      return false;
    }
    const moves = MoveGenerator.generateMoves(boardState, color);
    return moves.length === 0;
  }

  static isStalemate(boardState, color) {
    if (MoveGenerator.isKingInCheck(boardState, color)) {
      return false;
    }
    const moves = MoveGenerator.generateMoves(boardState, color);
    return moves.length === 0;
  }

  static checkGameEnd(boardState) {
    const currentColor = boardState.currentTurn;

    if (RulesEngine.isCheckmate(boardState, currentColor)) {
      const winner = oppositeColor(currentColor);
      return {
        isOver: true,
        result: winner === COLOR.RED ? 'red-wins' : 'black-wins',
        reason: winner === COLOR.RED ? '红方胜 — 将死对方' : '黑方胜 — 将死对方'
      };
    }

    if (RulesEngine.isStalemate(boardState, currentColor)) {
      const winner = oppositeColor(currentColor);
      return {
        isOver: true,
        result: winner === COLOR.RED ? 'red-wins' : 'black-wins',
        reason: winner === COLOR.RED ? '红方胜 — 对方困毙' : '黑方胜 — 对方困毙'
      };
    }

    return {
      isOver: false,
      result: null,
      reason: currentColor === COLOR.RED ? '红方走子' : '黑方走子'
    };
  }

  static isInCheck(boardState, color) {
    return MoveGenerator.isKingInCheck(boardState, color);
  }

  static getGameStatus(boardState) {
    const result = RulesEngine.checkGameEnd(boardState);

    if (result.isOver) {
      return result;
    }

    const currentColor = boardState.currentTurn;
    const inCheck = MoveGenerator.isKingInCheck(boardState, currentColor);

    return {
      isOver: false,
      result: null,
      reason: currentColor === COLOR.RED ? '红方走子' : '黑方走子',
      inCheck
    };
  }
}
