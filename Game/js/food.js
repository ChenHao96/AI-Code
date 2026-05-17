import { GRID_SIZE } from './grid.js';

export class Food {
  constructor() {
    this.pos = { x: 0, y: 0 };
  }

  place(snakeBody) {
    const occupied = new Set(snakeBody.map(s => `${s.x},${s.y}`));
    const free = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!occupied.has(`${x},${y}`)) {
          free.push({ x, y });
        }
      }
    }
    if (free.length === 0) return; // 蛇身占满，不会发生但防御
    const idx = Math.floor(Math.random() * free.length);
    this.pos = free[idx];
  }

  getPos() {
    return { ...this.pos };
  }
}
