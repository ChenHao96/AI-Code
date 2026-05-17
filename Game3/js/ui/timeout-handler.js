export class TimeoutHandler {
  constructor() {
    this.onTimeout = null; // 回调: (loserColor) => void
  }

  // 绑定到 ChessClock 的 timeoutCallback
  // 在创建 ChessClock 实例后调用
  bind(clock) {
    clock.timeoutCallback = (loserColor) => {
      this._handleTimeout(loserColor);
    };
  }

  _handleTimeout(loserColor) {
    if (this.onTimeout) this.onTimeout(loserColor);
  }

  // 显示超时提示（简单实现，使用alert以便调试，后续可改）
  showTimeoutMessage(loserColor) {
    const winnerColor = loserColor === 'red' ? '黑方' : '红方';
    const loser = loserColor === 'red' ? '红方' : '黑方';
    alert(`${loser}超时判负！${winnerColor}获胜！`);
  }
}
