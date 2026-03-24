type Grid = (number | null)[][];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValid(grid: Grid, row: number, col: number, num: number, size: number, boxRows: number, boxCols: number): boolean {
  for (let c = 0; c < size; c++) if (grid[row][c] === num) return false;
  for (let r = 0; r < size; r++) if (grid[r][col] === num) return false;

  const startRow = Math.floor(row / boxRows) * boxRows;
  const startCol = Math.floor(col / boxCols) * boxCols;
  for (let r = startRow; r < startRow + boxRows; r++) {
    for (let c = startCol; c < startCol + boxCols; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function solve(grid: Grid, size: number, boxRows: number, boxCols: number): boolean {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) {
        const nums = shuffle(Array.from({ length: size }, (_, i) => i + 1));
        for (const n of nums) {
          if (isValid(grid, r, c, n, size, boxRows, boxCols)) {
            grid[r][c] = n;
            if (solve(grid, size, boxRows, boxCols)) return true;
            grid[r][c] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export interface SudokuPuzzle {
  size: number;
  boxRows: number;
  boxCols: number;
  puzzle: Grid;
  solution: Grid;
}

export function generateSudoku(size: 4 | 6 | 9): SudokuPuzzle {
  const boxRows = size === 4 ? 2 : size === 6 ? 2 : 3;
  const boxCols = size === 4 ? 2 : 3;

  const grid: Grid = Array.from({ length: size }, () => Array(size).fill(null));
  solve(grid, size, boxRows, boxCols);

  const solution: Grid = grid.map(row => [...row]);
  const puzzle: Grid = grid.map(row => [...row]);

  const cellsToRemove = size === 4 ? 8 : size === 6 ? 18 : 40;
  const positions = shuffle(
    Array.from({ length: size * size }, (_, i) => [Math.floor(i / size), i % size])
  );

  for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = null;
  }

  return { size, boxRows, boxCols, puzzle, solution };
}
