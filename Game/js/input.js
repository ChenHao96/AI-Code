export class InputHandler {
  constructor() {
    this._directionQueue = [];
    this._pausePressed = false;
    this._touchStart = null;
    this._boostKeys = {};
    this._onPauseToggle = null;
    this._onDirection = null;
    this._initKeyboard();
    this._initTouch();
  }

  onPauseToggle(cb) {
    this._onPauseToggle = cb;
  }

  onDirection(cb) {
    this._onDirection = cb;
  }

  _initKeyboard() {
    document.addEventListener('keydown', (e) => {
      const dir = this._keyToDir(e.key);
      if (dir) {
        e.preventDefault();
        if (!(e.key in this._boostKeys)) {
          this._boostKeys[e.key] = Date.now();
        }
        this._enqueueDirection(dir.x, dir.y);
      } else if (e.key === ' ') {
        e.preventDefault();
        if (this._onPauseToggle) this._onPauseToggle();
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key in this._boostKeys) {
        delete this._boostKeys[e.key];
      }
    });
  }

  _keyToDir(key) {
    const map = {
      ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
      w: { x: 0, y: -1 }, s: { x: 0, y: 1 },
      a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
    };
    return map[key] || null;
  }

  _initTouch() {
    document.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      this._touchStart = { x: t.clientX, y: t.clientY };
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (!this._touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - this._touchStart.x;
      const dy = t.clientY - this._touchStart.y;
      this._touchStart = null;
      const threshold = 20;
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
      if (Math.abs(dx) >= Math.abs(dy)) {
        this._enqueueDirection(dx > 0 ? 1 : -1, 0);
      } else {
        this._enqueueDirection(0, dy > 0 ? 1 : -1);
      }
    });
  }

  _enqueueDirection(x, y) {
    if (this._directionQueue.length < 2) {
      this._directionQueue.push({ x, y });
    }
    if (this._onDirection) {
      if (this._onDirection({ x, y })) {
        this._directionQueue = [];
      }
    }
  }

  getDirection(currentDir) {
    while (this._directionQueue.length > 0) {
      const d = this._directionQueue.shift();
      if (d.x === 0 && d.y === 0) continue;
      if (d.x === -currentDir.x && d.y === -currentDir.y) return null;
      return d;
    }
    return null;
  }

  isBoosting() {
    const now = Date.now();
    for (const key in this._boostKeys) {
      if (now - this._boostKeys[key] > 200) {
        return true;
      }
    }
    return false;
  }

  reset() {
    this._directionQueue = [];
    this._pausePressed = false;
    this._touchStart = null;
    this._boostKeys = {};
  }
}
