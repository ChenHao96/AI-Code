export class GameHistory {
  constructor(containerId, recordStore) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`容器元素 #${containerId} 不存在`);
    }
    this.recordStore = recordStore;
    this._selectCallback = null;
    this.onBack = null;
  }

  async loadList() {
    const games = await this.recordStore.getAllGames();
    this.renderList(games);
  }

  renderList(games) {
    if (!games || games.length === 0) {
      this.container.innerHTML =
        '<div class="game-history-empty">暂无对局记录</div>' +
        '<div class="game-history-back"><button class="menu-btn secondary" data-action="back">返回主菜单</button></div>';
      this._bindBack();
      return;
    }

    let html = '<div class="game-history-list">';
    for (const game of games) {
      html += this._buildItemHtml(game);
    }
    html += '</div>';
    html += '<div class="game-history-back"><button class="menu-btn secondary" data-action="back">返回主菜单</button></div>';
    this.container.innerHTML = html;
    this._bindEvents();
    this._bindBack();
  }

  _buildItemHtml(game) {
    const dateStr = this._formatDate(new Date(game.date));
    const modeStr = game.mode === 'pvp' ? '双人对战' : '人机对战';
    const resultStr = this._formatResult(game.result);

    const moveCount = game.moves ? game.moves.length : 0;
    const rounds = Math.ceil(moveCount / 2);

    return `
      <div class="game-history-item" data-id="${game.id}">
        <div class="game-history-info">
          <div class="game-history-date">${dateStr}</div>
          <div class="game-history-meta">
            <span class="game-history-mode">${modeStr}</span>
            <span class="game-history-result">${resultStr}</span>
            <span class="game-history-rounds">${rounds}回合</span>
          </div>
        </div>
        <div class="game-history-actions">
          <button class="btn-history-replay" data-action="replay" data-id="${game.id}">回放</button>
          <button class="btn-history-delete" data-action="delete" data-id="${game.id}">删除</button>
        </div>
      </div>`;
  }

  _formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  }

  _formatResult(result) {
    const map = {
      'red-wins': '红方胜',
      'black-wins': '黑方胜',
      'draw': '和棋',
      'timeout': '超时判负'
    };
    return map[result] || result;
  }

  _bindEvents() {
    this.container.querySelectorAll('[data-action="replay"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (this._selectCallback) {
          this._selectCallback(id);
        }
      });
    });

    this.container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.deleteGame(id);
      });
    });
  }

  _bindBack() {
    const btn = this.container.querySelector('[data-action="back"]');
    if (btn) btn.addEventListener('click', () => { if (this.onBack) this.onBack(); });
  }

  async deleteGame(id) {
    if (!confirm('确定要删除这局对局记录吗？')) return;
    await this.recordStore.deleteGame(id);
    await this.loadList();
  }

  onSelectGame(callback) {
    this._selectCallback = callback;
  }
}
