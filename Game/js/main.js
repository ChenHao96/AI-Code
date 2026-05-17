import { Game } from './game.js';
import { GRID_SIZE } from './grid.js';
import { getHighScore, getDifficulty, setDifficulty } from './storage.js';

const DIFF_LABELS = { easy: '简单', normal: '普通', hard: '困难' };

const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const pauseOverlay = document.getElementById('pause-overlay');
const canvas = document.getElementById('game-canvas');
const difficultyBtns = document.querySelectorAll('.diff-btn');
const logoCanvas = document.getElementById('logo-canvas');

const hudScore = document.getElementById('hud-score');
const hudHigh = document.getElementById('hud-high');
const hudDiff = document.getElementById('hud-difficulty');
const finalScoreEl = document.getElementById('final-score');
const finalHighEl = document.getElementById('final-high');
const newRecordEl = document.getElementById('new-record');

let game;
let currentDifficulty = getDifficulty();

function drawLogo() {
  if (!logoCanvas) return;
  const ctx = logoCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const s = 10;
  const body = [
    { x: 8, y: 2 }, { x: 7, y: 2 }, { x: 6, y: 2 },
    { x: 5, y: 2 }, { x: 4, y: 2 }, { x: 3, y: 2 },
    { x: 2, y: 2 }, { x: 1, y: 2 },
  ];
  ctx.clearRect(0, 0, logoCanvas.width, logoCanvas.height);
  body.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#a3e635' : '#4ade80';
    ctx.fillRect(seg.x * s + 1, seg.y * s + 1, s - 2, s - 2);
    if (i === 0) {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(seg.x * s + 2, seg.y * s + 2, 2, 2);
      ctx.fillRect(seg.x * s + 6, seg.y * s + 2, 2, 2);
    }
  });
}

function updateHUD(data) {
  hudScore.textContent = `分数: ${data.score}`;
  hudHigh.textContent = `最高: ${data.highScore}`;
  hudDiff.textContent = DIFF_LABELS[data.difficulty] || data.difficulty;
}

function init() {
  drawLogo();
  game = new Game(canvas);
  game.setStateChangeCallback(onStateChange);
  updateDifficultyUI();
  resizeCanvas();
  showScreen('start');
}

function onStateChange(state, data) {
  switch (state) {
    case 'running':
      showScreen('game');
      pauseOverlay.classList.add('hidden');
      updateHUD(data);
      break;
    case 'paused':
      pauseOverlay.classList.remove('hidden');
      break;
    case 'gameover':
      showScreen('gameover');
      finalScoreEl.textContent = `得分: ${data.score}`;
      finalHighEl.textContent = `最高分: ${data.highScore}`;
      if (data.score >= data.highScore && data.score > 0) {
        newRecordEl.classList.remove('hidden');
      } else {
        newRecordEl.classList.add('hidden');
      }
      break;
    case 'idle':
      showScreen('start');
      break;
  }
}

function showScreen(name) {
  startScreen.classList.add('hidden');
  gameScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
  switch (name) {
    case 'start':
      startScreen.classList.remove('hidden');
      break;
    case 'game':
      gameScreen.classList.remove('hidden');
      break;
    case 'gameover':
      gameoverScreen.classList.remove('hidden');
      break;
  }
}

function resizeCanvas() {
  const cellSize = Math.floor(
    Math.min(window.innerWidth * 0.9, window.innerHeight * 0.6) / GRID_SIZE
  );
  const size = cellSize * GRID_SIZE;
  canvas.width = size;
  canvas.height = size;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  if (game) {
    game.resize(cellSize);
  }
}

function updateDifficultyUI() {
  difficultyBtns.forEach(btn => {
    if (btn.dataset.difficulty === currentDifficulty) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// --- 事件绑定 ---

difficultyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentDifficulty = btn.dataset.difficulty;
    setDifficulty(currentDifficulty);
    updateDifficultyUI();
  });
});

document.getElementById('btn-start').addEventListener('click', () => {
  game.start(currentDifficulty);
});

document.getElementById('btn-restart').addEventListener('click', () => {
  game.start(currentDifficulty);
});

document.getElementById('btn-exit').addEventListener('click', () => {
  game.stop();
});

pauseOverlay.addEventListener('click', () => {
  game.resume();
});

window.addEventListener('resize', resizeCanvas);

init();
