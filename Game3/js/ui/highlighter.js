export class Highlighter {
  constructor(boardRenderer) {
    this.renderer = boardRenderer;
  }

  showLegalMoves(moves, boardState) {
    // 附加 captured 信息到每个 move，供 Canvas 渲染用
    this.renderer._legalMoves = moves.map(mv => {
      const captured = boardState.getPiece(mv.toRow, mv.toCol);
      return { ...mv, captured };
    });
  }

  clear() {
    this.renderer._legalMoves = [];
  }
}
