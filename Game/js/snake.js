import { wrap } from './grid.js';

export class Snake {
  constructor() {
    this.reset();
  }

  reset() {
    this.body = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    this.direction = { x: 1, y: 0 };
    this._growNext = false;
  }

  move() {
    const head = this.getHead();
    const newHead = {
      x: wrap(head.x + this.direction.x),
      y: wrap(head.y + this.direction.y),
    };
    this.body.unshift(newHead);
    if (this._growNext) {
      this._growNext = false;
    } else {
      this.body.pop();
    }
    return { head: newHead };
  }

  grow() {
    this._growNext = true;
  }

  checkSelfCollision() {
    const head = this.getHead();
    return this.body.slice(1).some(s => s.x === head.x && s.y === head.y);
  }

  setDirection(dx, dy) {
    // 防反向：不能直接掉头
    if (dx === -this.direction.x && dy === -this.direction.y) return false;
    if (dx === 0 && dy === 0) return false;
    this.direction = { x: dx, y: dy };
    return true;
  }

  getHead() {
    return this.body[0];
  }

  getBody() {
    return this.body;
  }
}
