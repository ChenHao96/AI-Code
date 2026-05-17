const KEY_HIGH_SCORE = 'snake_high_score';
const KEY_DIFFICULTY = 'snake_difficulty';

export function getHighScore() {
  const v = localStorage.getItem(KEY_HIGH_SCORE);
  return v ? parseInt(v, 10) : 0;
}

export function setHighScore(score) {
  const current = getHighScore();
  if (score > current) {
    localStorage.setItem(KEY_HIGH_SCORE, score.toString());
    return true;
  }
  return false;
}

export function getDifficulty() {
  const v = localStorage.getItem(KEY_DIFFICULTY);
  if (v === 'easy' || v === 'normal' || v === 'hard') return v;
  return 'normal';
}

export function setDifficulty(d) {
  localStorage.setItem(KEY_DIFFICULTY, d);
}
