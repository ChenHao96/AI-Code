import { BoardState } from './engine/board.js';
import { RulesEngine } from './engine/rules.js';
import { BoardRenderer } from './ui/board-renderer.js';
import { Highlighter } from './ui/highlighter.js';
import { InputController } from './ui/interaction.js';
import { CheckIndicator } from './ui/check-indicator.js';
import { MenuManager } from './ui/menus.js';
import { RecordPanel } from './ui/record-panel.js';
import { TimerDisplay } from './ui/timer-display.js';
import { GameHistory } from './ui/game-history.js';
import { TimeoutHandler } from './ui/timeout-handler.js';
import { ChessClock } from './timer/clock.js';
import { AIPlayer } from './ai/ai-player.js';
import { RecordStore } from './storage/record-store.js';
import { UndoManager } from './ui/undo-manager.js';
import { ReplayController } from './ui/replay-controller.js';

export class AppController {
  constructor() {
    this.boardState = new BoardState();
    this.renderer = null;
    this.highlighter = null;
    this.inputController = null;
    this.checkIndicator = null;
    this.menuManager = null;
    this.recordPanel = null;
    this.timerDisplay = null;
    this.gameHistory = null;
    this.timeoutHandler = null;
    this.clock = null;
    this.aiPlayer = null;
    this.aiColor = 'black';
    this.recordStore = new RecordStore();
    this.undoManager = null;
    this.replayController = null;
    this.mode = null;
    this.difficulty = 'medium';
    this.timeControl = null;
    this.moveCount = 0;
    this._paused = false;
  }

  async init() {
    await this.recordStore.init();
    this.renderer = new BoardRenderer('board-container');
    this.highlighter = new Highlighter(this.renderer);
    this.checkIndicator = new CheckIndicator(this.renderer);
    this.recordPanel = new RecordPanel('move-record');
    this.timerDisplay = new TimerDisplay('timer-display');
    this.gameHistory = new GameHistory('game-history', this.recordStore);
    this.timeoutHandler = new TimeoutHandler();
    this.menuManager = new MenuManager('menu-container');
    this.replayController = new ReplayController(this.renderer, this.recordPanel);
    this.replayController.onClose = () => this.backToMenu();

    this.menuManager.onModeSelect = (s) => this.startGame(s);
    this.menuManager.onHistoryView = () => this.showHistory();
    this.gameHistory.onSelectGame((id) => this.startReplay(id));
    this.gameHistory.onBack = () => this.backToMenu();

    this.renderer.render(this.boardState);
    this.menuManager.showMainMenu();
  }

  startGame(settings) {
    this.mode = settings.mode;
    this.difficulty = settings.difficulty || 'medium';
    this.timeControl = settings.timeControl;
    this.moveCount = 0;
    this._paused = false;

    const playerColor = settings.playerColor || 'red';
    this.aiColor = playerColor === 'red' ? 'black' : 'red';

    this.boardState.reset();
    this.renderer.clearLastMoveTo();
    this.renderer.setFlipped(playerColor === 'black');
    this.renderer.render(this.boardState);
    this.recordPanel.clear();
    document.getElementById('game-controls').innerHTML = '';

    this.clock = new ChessClock();
    if (this.timeControl) {
      this.clock.init(ChessClock.TIME_CONTROLS[this.timeControl]);
    } else {
      this.clock.init(null);
    }
    this.timeoutHandler.bind(this.clock);
    this.timeoutHandler.onTimeout = (loser) => {
      this.inputController.disable();
      this.timerDisplay.showTimeout(loser);
      this._saveGame(loser === 'red' ? 'black-wins' : 'red-wins');
    };
    this.clock.tickCallback = (s) => this.timerDisplay.update(s);

    if (this.mode === 'pve') {
      this.aiPlayer = new AIPlayer(this.difficulty);
    } else {
      this.aiPlayer = null;
    }

    this.inputController = new InputController(this.renderer, this.boardState, { mode: this.mode, playerColor });
    this.inputController.onMoveMade((m) => this._onPlayerMove(m));

    this.undoManager = new UndoManager(this.boardState, this.inputController, this.recordPanel, this.renderer);
    this.undoManager.mode = this.mode;
    this.undoManager.clearHistory();
    this.undoManager.addUndoButton('game-controls');

    this._addGameButtons();

    this.menuManager.hide();
    document.getElementById('game-container').style.display = '';
    document.getElementById('replay-container').style.display = 'none';
    document.getElementById('timer-display').style.display = '';
    document.getElementById('game-controls').style.display = '';
    document.getElementById('move-record').style.display = 'block';
    document.getElementById('replay-controls').style.display = 'none';

    // 容器变为可见后重新渲染（首次 render 时容器隐藏导致 Canvas 尺寸为 0）
    // 使用 requestAnimationFrame 确保布局完成后再渲染
    requestAnimationFrame(() => this.renderer.render(this.boardState));

    this.clock.start('red');
    this.inputController.enable();
  }

  _addGameButtons() {
    const container = document.getElementById('game-controls');
    const pauseBtn = document.createElement('button');
    pauseBtn.id = 'btn-pause';
    pauseBtn.className = 'control-btn';
    pauseBtn.textContent = '暂停';
    pauseBtn.addEventListener('click', () => {
      if (this._paused) {
        this._paused = false;
        pauseBtn.textContent = '暂停';
        this.clock.resume();
        this.inputController.enable();
      } else {
        this._paused = true;
        pauseBtn.textContent = '继续';
        this.clock.pause();
        this.inputController.disable();
      }
    });
    container.appendChild(pauseBtn);

    const exitBtn = document.createElement('button');
    exitBtn.id = 'btn-exit';
    exitBtn.className = 'control-btn';
    exitBtn.textContent = '退出';
    exitBtn.addEventListener('click', () => {
      if (confirm('确定退出当前对局？')) {
        this.backToMenu();
      }
    });
    container.appendChild(exitBtn);
  }

  _onPlayerMove(move) {
    this.moveCount++;
    this.undoManager.recordMove(move);
    this.recordPanel.addMove(move, Math.ceil(this.moveCount / 2));
    this.checkIndicator.update(this.boardState);
    this.clock.switch(this.boardState.currentTurn);

    const end = RulesEngine.checkGameEnd(this.boardState);
    if (end.isOver) {
      this.inputController.disable();
      this.clock.stop();
      this._showGameEnd(end);
      return;
    }

    if (this.mode === 'pve') {
      this.inputController.disable();
      this._runAI();
    }
  }

  async _runAI() {
    if (this._paused) return;
    const aiMove = await this.aiPlayer.getMove(this.boardState, this.aiColor);
    if (!aiMove) return;

    const { generateNotation } = await import('./ui/interaction.js');
    const notation = generateNotation(this.boardState, aiMove.fromRow, aiMove.fromCol, aiMove.toRow, aiMove.toCol);
    const result = this.boardState.makeMove(aiMove.fromRow, aiMove.fromCol, aiMove.toRow, aiMove.toCol);
    const isCheck = RulesEngine.isInCheck(this.boardState, this.aiColor === 'red' ? 'black' : 'red');

    const fullMove = { ...result, isCheck, notation };
    this.moveCount++;
    this.undoManager.recordMove(fullMove);
    this.recordPanel.addMove(fullMove, Math.ceil(this.moveCount / 2));
    this.renderer.setLastMoveTo(aiMove.toRow, aiMove.toCol);
    this.checkIndicator.update(this.boardState);
    this.renderer.render(this.boardState);
    this.clock.switch(this.boardState.currentTurn);

    const end = RulesEngine.checkGameEnd(this.boardState);
    if (end.isOver) {
      this.inputController.disable();
      this.clock.stop();
      this._showGameEnd(end);
      return;
    }
    this.inputController.enable();
  }

  _showGameEnd(end) {
    const msgs = { 'red-wins': '红方获胜！', 'black-wins': '黑方获胜！', 'stalemate': '困毙！' };
    this._saveGame(end.result);
    setTimeout(() => { alert(msgs[end.result] || '游戏结束'); this.backToMenu(); }, 500);
  }

  async _saveGame(result) {
    try {
      await this.recordStore.saveGame({
        mode: this.mode, difficulty: this.difficulty,
        timeControl: this.timeControl, result,
        moves: this.undoManager.moveHistory.map(m => ({
          piece: m.piece, from: m.from, to: m.to,
          captured: m.captured, isCheck: m.isCheck, notation: m.notation
        }))
      });
    } catch (e) { /* 保存失败不影响游戏 */ }
  }

  backToMenu() {
    this.clock.stop();
    this.inputController?.disable();
    this.renderer.clearLastMoveTo();
    this.renderer.clearCheckHighlight();
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('replay-container').style.display = 'none';
    document.getElementById('timer-display').style.display = '';
    document.getElementById('game-controls').style.display = '';
    document.getElementById('move-record').style.display = 'block';
    document.getElementById('replay-controls').style.display = 'none';
    this.menuManager.showMainMenu();
  }

  async showHistory() {
    this.menuManager.hide();
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('replay-container').style.display = '';
    document.getElementById('game-history').style.display = '';
    await this.gameHistory.loadList();
  }

  async startReplay(gameId) {
    const game = await this.recordStore.getGame(gameId);
    if (!game) return;
    this.menuManager.hide();
    document.getElementById('game-container').style.display = '';
    document.getElementById('timer-display').style.display = 'none';
    document.getElementById('game-controls').style.display = 'none';
    document.getElementById('move-record').style.display = 'block';
    document.getElementById('replay-controls').style.display = '';
    document.getElementById('replay-container').style.display = 'none';
    this.recordPanel.clear();
    this.replayController.loadGame(game);
  }
}
