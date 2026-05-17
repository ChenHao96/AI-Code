export const GRID_SIZE = 20;

export function wrap(coord) {
  return ((coord % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
}
