import { GRID_SIZE } from './grid.js';

const COLORS = {
  bg: '#1a1a2e',
  gridDot: '#ffffff10',
  snakeBody: '#4ade80',
  snakeHead: '#a3e635',
  food: '#ef4444',
};

export class Renderer {
  constructor(canvas, cellSize) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.cellSize = cellSize;
    this._pixelSize = canvas.width / GRID_SIZE;
  }

  updateCellSize(cellSize) {
    this.cellSize = cellSize;
    this._pixelSize = this.canvas.width / GRID_SIZE;
  }

  clear() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = COLORS.gridDot;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        ctx.fillRect(
          x * this._pixelSize + this._pixelSize / 2 - 1,
          y * this._pixelSize + this._pixelSize / 2 - 1,
          2, 2
        );
      }
    }
  }

  drawSnake(body) {
    const ctx = this.ctx;
    const s = this._pixelSize;
    const gap = Math.max(1, Math.floor(s * 0.1));
    body.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snakeBody;
      ctx.fillRect(seg.x * s + gap, seg.y * s + gap, s - gap * 2, s - gap * 2);
    });
  }

  drawFood(pos) {
    const ctx = this.ctx;
    const s = this._pixelSize;
    const gap = Math.max(1, Math.floor(s * 0.1));
    ctx.fillStyle = COLORS.food;
    ctx.fillRect(pos.x * s + gap, pos.y * s + gap, s - gap * 2, s - gap * 2);
  }

  render(snakeBody, foodPos) {
    this.clear();
    this.drawSnake(snakeBody);
    this.drawFood(foodPos);
  }
}
