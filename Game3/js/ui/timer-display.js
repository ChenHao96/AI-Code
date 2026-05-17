import { ChessClock } from '../timer/clock.js';

export class TimerDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`TimerDisplay: 容器 #${containerId} 不存在`);
    }
    this.redBox = null;
    this.blackBox = null;
    this.redValue = null;
    this.blackValue = null;
    this._buildDOM();
  }

  _buildDOM() {
    this.container.innerHTML = '';

    this.redBox = this._createTimerBox('red', '红方');
    this.blackBox = this._createTimerBox('black', '黑方');

    this.container.appendChild(this.redBox);
    this.container.appendChild(this.blackBox);

    this.redValue = this.redBox.querySelector('.timer-value');
    this.blackValue = this.blackBox.querySelector('.timer-value');
  }

  _createTimerBox(color, label) {
    const box = document.createElement('div');
    box.className = `timer-box ${color}-timer`;

    const labelEl = document.createElement('div');
    labelEl.className = 'timer-label';
    labelEl.textContent = label;

    const valueEl = document.createElement('div');
    valueEl.className = 'timer-value';
    valueEl.textContent = '--:--';

    box.appendChild(labelEl);
    box.appendChild(valueEl);
    return box;
  }

  update(clockState) {
    if (!clockState) return;

    this.redValue.textContent = ChessClock.formatTime(clockState.redTime);
    this.blackValue.textContent = ChessClock.formatTime(clockState.blackTime);

    this.redBox.classList.toggle('active', clockState.activeColor === 'red');
    this.blackBox.classList.toggle('active', clockState.activeColor === 'black');
  }

  setWarning(color) {
    const valueEl = color === 'red' ? this.redValue : this.blackValue;
    const box = color === 'red' ? this.redBox : this.blackBox;
    if (box) box.classList.add('warning');
  }

  clearWarning(color) {
    const box = color === 'red' ? this.redBox : this.blackBox;
    if (box) box.classList.remove('warning');
  }

  showTimeout(loserColor) {
    const loserLabel = loserColor === 'red' ? '红方' : '黑方';
    setTimeout(() => {
      alert(`${loserLabel}超时判负`);
    }, 50);
  }
}
