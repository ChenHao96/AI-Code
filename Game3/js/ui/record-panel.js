export class RecordPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`容器元素 #${containerId} 不存在`);
    }

    this.table = document.createElement('table');
    this.table.className = 'move-list-table';
    this.table.innerHTML = '<thead><tr><th>#</th><th style="color:var(--piece-red)">红方</th><th style="color:var(--piece-black)">黑方</th></tr></thead><tbody></tbody>';
    this.container.appendChild(this.table);

    this.tbody = this.table.querySelector('tbody');
    this.moves = [];
  }

  /**
   * 追加走法记录。
   * @param {{ piece: { color: string }, notation: string }} move - 走法对象
   * @param {number} [moveNumber] - 行号，缺省则根据走法数量自动计算
   */
  addMove(move, moveNumber) {
    this.moves.push(move);

    if (move.piece.color === 'red') {
      // 红方走法：新建一行，红方列填入记谱，黑方列留空
      const row = document.createElement('tr');
      const cellNum = document.createElement('td');
      cellNum.className = 'move-number';
      cellNum.textContent = moveNumber != null ? moveNumber : Math.ceil(this.moves.length / 2);
      row.appendChild(cellNum);

      const cellRed = document.createElement('td');
      cellRed.className = 'red-move';
      cellRed.textContent = move.notation || '';
      row.appendChild(cellRed);

      const cellBlack = document.createElement('td');
      cellBlack.className = 'black-move';
      row.appendChild(cellBlack);

      this.tbody.appendChild(row);
    } else {
      // 黑方走法：找到最后一行，在黑方列填入记谱
      const lastRow = this.tbody.lastElementChild;
      if (lastRow) {
        const blackCell = lastRow.querySelector('.black-move');
        if (blackCell) {
          blackCell.textContent = move.notation || '';
        }
      }
    }

    this.container.scrollTop = this.container.scrollHeight;
  }

  /**
   * 移除最后一步走法。
   */
  removeLastMove() {
    if (this.moves.length === 0) return;

    const lastMove = this.moves[this.moves.length - 1];
    this.moves.pop();

    if (lastMove.piece.color === 'red') {
      // 红方走法：直接移除最后一行
      if (this.tbody.lastElementChild) {
        this.tbody.lastElementChild.remove();
      }
    } else {
      // 黑方走法：清除最后一行的黑方列
      const lastRow = this.tbody.lastElementChild;
      if (lastRow) {
        const blackCell = lastRow.querySelector('.black-move');
        if (blackCell) {
          blackCell.textContent = '';
        }
      }
    }
  }

  /**
   * 清空所有走法记录。
   */
  clear() {
    this.tbody.innerHTML = '';
    this.moves = [];
  }

  /**
   * 高亮指定索引的行。
   * @param {number} index - 行索引（从 0 开始）
   */
  highlightMove(index) {
    this.clearHighlight();
    if (index >= 0) {
      const rows = this.tbody.querySelectorAll('tr');
      if (rows[index]) {
        rows[index].classList.add('current-move');
        rows[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  /**
   * 清除所有高亮。
   */
  clearHighlight() {
    this.tbody.querySelectorAll('.current-move').forEach(el => el.classList.remove('current-move'));
  }
}
