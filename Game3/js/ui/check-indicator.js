import { COLOR } from '../engine/constants.js';
import { RulesEngine } from '../engine/rules.js';

export class CheckIndicator {
  constructor(boardRenderer) {
    this.boardRenderer = boardRenderer;
    this.onCheck = null;
    this._checkedColor = null;
  }

  update(boardState) {
    this.boardRenderer.clearCheckHighlight();
    this._checkedColor = null;

    const redInCheck = RulesEngine.isInCheck(boardState, COLOR.RED);
    const blackInCheck = RulesEngine.isInCheck(boardState, COLOR.BLACK);

    if (redInCheck) {
      const redKing = boardState.findKing(COLOR.RED);
      if (redKing) {
        this.boardRenderer.setCheckHighlight(redKing.row, redKing.col);
        this._checkedColor = COLOR.RED;
      }
    }

    if (blackInCheck) {
      const blackKing = boardState.findKing(COLOR.BLACK);
      if (blackKing) {
        this.boardRenderer.setCheckHighlight(blackKing.row, blackKing.col);
        this._checkedColor = COLOR.BLACK;
      }
    }

    if (this._checkedColor && this.onCheck) {
      this.onCheck(this._checkedColor);
    }
  }

  getCheckedColor() {
    return this._checkedColor;
  }
}
