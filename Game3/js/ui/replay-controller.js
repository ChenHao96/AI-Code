import { BoardState } from '../engine/board.js';

export class ReplayController {
  constructor(renderer, recordPanel) {
    this.renderer = renderer;
    this.recordPanel = recordPanel;
    this.boardState = null;
    this.moves = [];
    this.currentStep = 0;
    this.isPlaying = false;
    this.replayTimer = null;
    this.container = null;
    this._keyHandler = null;
    this.onClose = null;
  }

  loadGame(gameData) {
    this.renderer.clearLastMoveTo();
    this.boardState = new BoardState();
    this.boardState.reset();
    this.moves = gameData.moves || [];
    this.currentStep = 0;
    this.isPlaying = false;
    this._buildUI();
    this._goTo(0);
  }

  _buildUI() {
    const container = document.getElementById('replay-controls');
    container.innerHTML = `
      <div class="replay-bar">
        <button class="replay-btn" data-action="first">⏮ 开头</button>
	<button class="replay-btn" data-action="auto" style="flex:2;">自动播放 ▶▶</button>
        <button class="replay-btn secondary" data-action="close">返回</button>
      </div>
      <div class="replay-bar">
        <button class="replay-btn" data-action="prev">◀ 上一步</button>
        <span class="replay-info">第 <span id="replay-step">0</span>/<span id="replay-total">${this.moves.length}</span> 步</span>
        <button class="replay-btn" data-action="next">下一步 ▶</button>
      </div>`;
    container.querySelectorAll('.replay-btn').forEach(btn => {
      btn.addEventListener('click', () => this._handleAction(btn.dataset.action));
    });
    this.recordPanel.clear();
    this._bindKeyboard();
  }

  _handleAction(action) {
    switch (action) {
      case 'first': this._goTo(0); break;
      case 'prev': this._goTo(this.currentStep - 1); break;
      case 'next': this._goTo(this.currentStep + 1); break;
      case 'auto': this._toggleAutoPlay(); break;
      case 'close': this._close(); break;
    }
  }

  _goTo(step) {
    this.boardState.reset();
    this.renderer.render(this.boardState);
    this.recordPanel.clear();

    const targetStep = Math.max(0, Math.min(step, this.moves.length));
    for (let i = 0; i < targetStep; i++) {
      const m = this.moves[i];
      // 兼容走法坐标两种存储格式
      const fromRow = m.fromRow != null ? m.fromRow : (m.from ? m.from.row : undefined);
      const fromCol = m.fromCol != null ? m.fromCol : (m.from ? m.from.col : undefined);
      const toRow = m.toRow != null ? m.toRow : (m.to ? m.to.row : undefined);
      const toCol = m.toCol != null ? m.toCol : (m.to ? m.to.col : undefined);
      const result = this.boardState.makeMove(fromRow, fromCol, toRow, toCol);
      const recordMove = {
        piece: m.piece || result.piece,
        notation: m.notation || '',
        isCheck: m.isCheck || false,
        captured: result.captured
      };
      this.recordPanel.addMove(recordMove, Math.ceil((i + 1) / 2));
    }

    this.currentStep = targetStep;
    this.renderer.render(this.boardState);
    const stepEl = document.getElementById('replay-step');
    if (stepEl) stepEl.textContent = this.currentStep;
    this.recordPanel.highlightMove(Math.ceil(this.currentStep / 2) - 1);
  }

  _toggleAutoPlay() {
    this.isPlaying = !this.isPlaying;
    const btn = document.querySelector('[data-action="auto"]');
    if (!btn) return;
    if (this.isPlaying) {
      btn.textContent = '暂停 ⏸';
      this._autoPlayStep();
    } else {
      btn.textContent = '自动播放 ▶▶';
      if (this.replayTimer) {
        clearTimeout(this.replayTimer);
        this.replayTimer = null;
      }
    }
  }

  _autoPlayStep() {
    if (!this.isPlaying) return;
    if (this.currentStep >= this.moves.length) {
      this.isPlaying = false;
      const btn = document.querySelector('[data-action="auto"]');
      if (btn) btn.textContent = '自动播放 ▶▶';
      return;
    }
    this._goTo(this.currentStep + 1);
    this.replayTimer = setTimeout(() => this._autoPlayStep(), 1000);
  }

  _close() {
    if (this.replayTimer) {
      clearTimeout(this.replayTimer);
      this.replayTimer = null;
    }
    this.isPlaying = false;
    if (typeof this.onClose === 'function') {
      this.onClose();
      return;
    }
    const replayContainer = document.getElementById('replay-container');
    if (replayContainer) replayContainer.style.display = 'none';
    const menuContainer = document.getElementById('menu-container');
    if (menuContainer) menuContainer.style.display = '';
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) gameContainer.style.display = 'none';
  }

  _bindKeyboard() {
    this._keyHandler = (e) => {
      const replayContainer = document.getElementById('replay-container');
      if (!replayContainer || replayContainer.style.display === 'none') return;
      if (e.key === 'ArrowRight') { this._goTo(this.currentStep + 1); }
      if (e.key === 'ArrowLeft') { this._goTo(this.currentStep - 1); }
      if (e.key === 'Escape') { this._close(); }
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  cleanup() {
    if (this.replayTimer) {
      clearTimeout(this.replayTimer);
      this.replayTimer = null;
    }
    this.isPlaying = false;
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  }
}
