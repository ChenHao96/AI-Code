import { Snake } from './snake.js';
import { Food } from './food.js';
import { InputHandler } from './input.js';
import { Renderer } from './renderer.js';
import { GRID_SIZE } from './grid.js';
import { getHighScore, setHighScore } from './storage.js';

const SPEED = { easy: 150, normal: 100, hard: 60 };

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas, 20);
    this.input = new InputHandler();
    this.input.onPauseToggle(() => this.togglePause());
    this.input.onDirection((dir) => this.snake.setDirection(dir.x, dir.y));
    this.snake = new Snake();
    this.food = new Food();
    this.score = 0;
    this.highScore = getHighScore();
    this.difficulty = 'normal';
    this.state = 'idle';
    this._timeout = null;
    this._onStateChange = null;
  }

  setStateChangeCallback(cb) {
    this._onStateChange = cb;
  }

  start(difficulty) {
    clearTimeout(this._timeout);
    this.difficulty = difficulty;
    this.score = 0;
    this.highScore = getHighScore();
    this.snake.reset();
    this.food.place(this.snake.getBody());
    this.input.reset();
    this._changeState('running');
  }

  _getSpeed() {
    const base = SPEED[this.difficulty];
    if (this.state === 'running' && this.input.isBoosting()) {
      return Math.floor(base / 2);
    }
    return base;
  }

  _scheduleTick() {
    this._timeout = setTimeout(() => this._tick(), this._getSpeed());
  }

  _tick() {
    if (this.state !== 'running') return;

    const { head } = this.snake.move();

    const dir = this.input.getDirection(this.snake.direction);
    if (dir) {
      this.snake.setDirection(dir.x, dir.y);
    }

    if (this.snake.checkSelfCollision()) {
      this._gameOver();
      return;
    }

    const foodPos = this.food.getPos();
    if (head.x === foodPos.x && head.y === foodPos.y) {
      this.snake.grow();
      this.score += 10;
      this._notify();
      this.food.place(this.snake.getBody());
    }

    this.render();
    this._scheduleTick();
  }

  pause() {
    if (this.state === 'running') {
      this._changeState('paused');
    }
  }

  resume() {
    if (this.state === 'paused') {
      this._changeState('running');
    }
  }

  togglePause() {
    if (this.state === 'running') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  _gameOver() {
    clearTimeout(this._timeout);
    this.state = 'gameover';
    this.highScore = getHighScore();
    const isNew = setHighScore(this.score);
    if (isNew) this.highScore = this.score;
    this._notify();
  }

  render() {
    this.renderer.render(this.snake.getBody(), this.food.getPos());
  }

  _changeState(newState) {
    this.state = newState;
    if (newState === 'running') {
      this._scheduleTick();
    }
    this._notify();
    this.render();
  }

  _notify() {
    if (this._onStateChange) {
      this._onStateChange(this.state, {
        score: this.score,
        highScore: this.highScore,
        difficulty: this.difficulty,
      });
    }
  }

  stop() {
    clearTimeout(this._timeout);
    this.state = 'idle';
    this._notify();
  }

  getState() { return this.state; }
  getScore() { return this.score; }
  getHighScore() { return this.highScore; }
  getDifficulty() { return this.difficulty; }

  resize(cellSize) {
    this.renderer.updateCellSize(cellSize);
    if (this.state === 'running' || this.state === 'paused') {
      this.render();
    }
  }
}
