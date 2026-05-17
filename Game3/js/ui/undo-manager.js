/**
 * UndoManager — 悔棋管理器
 *
 * 职责：
 * - PvE：玩家随时悔棋，每次撤销两步（玩家上一步 + AI 的回应），棋盘恢复到玩家走子前
 * - PvP：悔棋方请求悔棋，对方确认后执行，只撤销一步
 * - 不限次数，第一步不可悔棋（无步可悔）
 *
 * 使用方式（由 AppController 集成）：
 *   1. 实例化时传入 boardState, inputController, recordPanel, boardRenderer
 *   2. 设置 this.mode = 'pvp' | 'pve'
 *   3. 调用 addUndoButton('game-controls') 添加悔棋按钮
 *   4. 在 InputController.onMoveMade 回调中调用 undoManager.recordMove(moveData)
 *   5. 设置 onUndoComplete 回调，用于重新启用输入和更新状态
 */
export class UndoManager {
  constructor(boardState, inputController, recordPanel, boardRenderer) {
    this.boardState = boardState;
    this.inputController = inputController;
    this.recordPanel = recordPanel;
    this.boardRenderer = boardRenderer;
    this.moveHistory = [];   // 完整走法历史（用于undo）
    this.mode = 'pvp';       // 'pvp' | 'pve'
    this.onUndoComplete = null;
    this._btn = null;
  }

  // ───────────────────── 公共接口 ─────────────────────

  /**
   * 记录一步走法（每次走子后由 AppController 调用）
   * @param {Object} move - 走法对象，需包含 { from: {row,col}, to: {row,col}, piece, captured, ... }
   */
  recordMove(move) {
    this.moveHistory.push(move);
  }

  /**
   * 添加悔棋按钮到指定的 containerId
   * @param {string} containerId - 按钮容器的 DOM id
   */
  addUndoButton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const btn = document.createElement('button');
    btn.id = 'btn-undo';
    btn.className = 'control-btn';
    btn.textContent = '悔棋';
    btn.addEventListener('click', () => this.requestUndo());
    container.appendChild(btn);
    this._btn = btn;
  }

  /**
   * 请求悔棋（按钮点击入口）
   */
  requestUndo() {
    if (this.moveHistory.length === 0) return; // 无步可悔

    if (this.mode === 'pve') {
      this._undoPvE();
    } else {
      this._undoPvP();
    }
  }

  /**
   * 清空历史（新游戏时调用）
   */
  clearHistory() {
    this.moveHistory = [];
  }

  // ───────────────────── 悔棋策略 ─────────────────────

  /**
   * PvE 悔棋：
   * - 撤销两步（玩家的上一步 + AI 的回应），恢复到玩家走子前
   * - 若 AI 尚未回应（仅玩家走了），则只撤销玩家的一步
   */
  _undoPvE() {
    if (this.moveHistory.length < 1) return;

    // moveHistory.length 奇偶性判断：
    //   奇数 → 玩家刚走完，AI 尚未回应 → 撤销 1 步
    //   偶数 → 双方都已走子 → 撤销 2 步
    let stepsToUndo = this.moveHistory.length % 2 === 1 ? 1 : 2;
    this._doUndo(stepsToUndo);
  }

  /**
   * PvP 悔棋：
   * - 请求方点击悔棋 → 对方确认后执行
   * - 只撤销一步
   */
  _undoPvP() {
    if (this.moveHistory.length < 1) return;
    if (!confirm('对方请求悔棋，是否同意？')) return;
    this._doUndo(1);
  }

  // ───────────────────── 核心撤销逻辑 ─────────────────────

  _doUndo(count) {
    // 1. 撤销走法
    for (let i = 0; i < count && this.moveHistory.length > 0; i++) {
      const move = this.moveHistory.pop();
      // 从棋谱面板移除最后一条记录
      this.recordPanel.removeLastMove();
      // 恢复棋盘状态（BoardState.undoMove 会切换 currentTurn）
      this.boardState.undoMove(move);
    }

    // 2. 清除 UI 高亮状态
    this.boardRenderer.clearSelected();
    this.boardRenderer.clearCheckHighlight();

    // 3. 重新渲染棋盘
    this.boardRenderer.render(this.boardState);

    // 4. 重新启用玩家交互并更新状态（由回调处理）
    if (this.onUndoComplete) {
      this.onUndoComplete();
    }
  }
}
