export class ChessClock {
  constructor(timeControl) {
    this.timeControl = timeControl;
    this.redTime = 0;
    this.blackTime = 0;
    this.activeColor = null;
    this.isRunning = false;
    this.intervalId = null;
    this.tickCallback = null;
    this.timeoutCallback = null;
  }

  init(timeControl) {
    this.stop();
    this.timeControl = timeControl;
    if (timeControl) {
      const mainMs = timeControl.mainTime * 60 * 1000;
      this.redTime = mainMs;
      this.blackTime = mainMs;
    } else {
      this.redTime = Infinity;
      this.blackTime = Infinity;
    }
    this.activeColor = null;
    this.isRunning = false;
  }

  start(color) {
    if (!this.timeControl) return;
    this.activeColor = color;
    this.isRunning = true;
    this.startInterval();
  }

  switch(color) {
    if (!this.timeControl || !this.isRunning) return;
    this.activeColor = color;
  }

  pause() {
    this.isRunning = false;
    this.stopInterval();
  }

  resume() {
    if (this.activeColor && this.timeControl) {
      this.isRunning = true;
      this.startInterval();
    }
  }

  stop() {
    this.isRunning = false;
    this.stopInterval();
    this.activeColor = null;
  }

  startInterval() {
    this.stopInterval();
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  tick() {
    if (!this.isRunning || !this.activeColor) return;

    if (this.activeColor === 'red') {
      this.redTime = Math.max(0, this.redTime - 1000);
    } else {
      this.blackTime = Math.max(0, this.blackTime - 1000);
    }

    if (this.tickCallback) {
      this.tickCallback({
        redTime: this.redTime,
        blackTime: this.blackTime,
        activeColor: this.activeColor
      });
    }

    if (this.redTime <= 0 || this.blackTime <= 0) {
      this.stop();
      if (this.timeoutCallback) {
        this.timeoutCallback(this.redTime <= 0 ? 'red' : 'black');
      }
    }
  }

  getRemainingTime(color) {
    return color === 'red' ? this.redTime : this.blackTime;
  }

  static formatTime(ms) {
    if (ms === Infinity || ms == null) return '--:--';
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  static TIME_CONTROLS = {
    '5+3': { mainTime: 5, byoyomi: 3 },
    '15+30': { mainTime: 15, byoyomi: 30 },
    '30+60': { mainTime: 30, byoyomi: 60 }
  };

  static getTimeControlLabel(key) {
    if (!key) return '不计时';
    const tc = ChessClock.TIME_CONTROLS[key];
    if (!tc) return key;
    return `${tc.mainTime}分钟 + ${tc.byoyomi}秒`;
  }
}
