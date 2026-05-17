export class MenuManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.onModeSelect = null; // callback
    this.onHistoryView = null;
  }

  // 显示主菜单
  showMainMenu() {
    this.container.innerHTML = `
      <div class="menu-screen">
        <h1 class="menu-title">象 棋</h1>
        <div class="menu-buttons">
          <button class="menu-btn" data-action="pvp">双人对战</button>
          <button class="menu-btn" data-action="pve">人机对战</button>
          <button class="menu-btn secondary" data-action="history">历史对局</button>
        </div>
      </div>`;
    this.container.style.display = '';
    this._bindEvents();
  }

  // 显示模式设置
  showGameSettings(mode) {
    // PvE显示难度选择、时间控制
    // PvP显示时间控制
    this.container.innerHTML = `
      <div class="menu-screen">
        <h2>${mode === 'pve' ? '人机对战 - 设置' : '双人对战 - 设置'}</h2>
        <div class="setting-group">
          <label>难度</label>
          <select id="setting-difficulty">
            <option value="easy">初级</option>
            <option value="medium" selected>中级</option>
            <option value="hard">高级</option>
          </select>
        </div>
        <div class="setting-group">
          <label>计时</label>
          <select id="setting-time">
            <option value="">不计时</option>
            <option value="5+3">5分钟+3秒</option>
            <option value="15+30" selected>15分钟+30秒</option>
            <option value="30+60">30分钟+60秒</option>
          </select>
        </div>
        <div class="setting-group" id="setting-color-group">
          <label>选择颜色</label>
          <div class="color-options">
            <label><input type="radio" name="player-color" value="red" checked> 执红（先手）</label>
            <label><input type="radio" name="player-color" value="black"> 执黑（后手）</label>
          </div>
        </div>
        <div class="menu-buttons">
          <button class="menu-btn" id="btn-start">开始游戏</button>
          <button class="menu-btn secondary" id="btn-back">返回</button>
        </div>
      </div>`;
    // PvP模式不显示难度选择和颜色选择
    if (mode === 'pvp') {
      document.getElementById('setting-difficulty').closest('.setting-group').style.display = 'none';
      document.getElementById('setting-color-group').style.display = 'none';
    }
    this._bindSettings(mode);
  }

  // 隐藏菜单
  hide() {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }

  _bindEvents() {
    this.container.querySelectorAll('.menu-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'pvp' || action === 'pve') {
          this.showGameSettings(action);
        } else if (action === 'history') {
          if (this.onHistoryView) this.onHistoryView();
        }
      });
    });
  }

  _bindSettings(mode) {
    document.getElementById('btn-start').addEventListener('click', () => {
      const difficulty = document.getElementById('setting-difficulty')?.value || 'medium';
      const timeControl = document.getElementById('setting-time').value || null;
      const playerColor = document.querySelector('input[name="player-color"]:checked')?.value || 'red';
      if (this.onModeSelect) this.onModeSelect({ mode, difficulty, timeControl, playerColor });
    });
    document.getElementById('btn-back').addEventListener('click', () => this.showMainMenu());
  }
}
