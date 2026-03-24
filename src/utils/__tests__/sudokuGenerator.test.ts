import { describe, it, expect } from 'vitest';
import { generateSudoku } from '../sudokuGenerator';

function validateSudokuSolution(grid: (number | null)[][], size: number, boxRows: number, boxCols: number): boolean {
  const expected = new Set(Array.from({ length: size }, (_, i) => i + 1));

  for (let r = 0; r < size; r++) {
    const row = new Set(grid[r]);
    if (row.size !== size) return false;
    for (const v of row) { if (v === null || !expected.has(v)) return false; }
  }

  for (let c = 0; c < size; c++) {
    const col = new Set(grid.map((row) => row[c]));
    if (col.size !== size) return false;
  }

  for (let br = 0; br < size / boxRows; br++) {
    for (let bc = 0; bc < size / boxCols; bc++) {
      const box = new Set<number | null>();
      for (let r = br * boxRows; r < (br + 1) * boxRows; r++) {
        for (let c = bc * boxCols; c < (bc + 1) * boxCols; c++) {
          box.add(grid[r][c]);
        }
      }
      if (box.size !== size) return false;
    }
  }

  return true;
}

describe('generateSudoku(4)', () => {
  it('returns correct metadata', () => {
    const puzzle = generateSudoku(4);
    expect(puzzle.size).toBe(4);
    expect(puzzle.boxRows).toBe(2);
    expect(puzzle.boxCols).toBe(2);
  });

  it('solution is a valid 4x4 sudoku', () => {
    for (let i = 0; i < 5; i++) {
      const puzzle = generateSudoku(4);
      expect(validateSudokuSolution(puzzle.solution, 4, 2, 2)).toBe(true);
    }
  });

  it('puzzle has blanks', () => {
    const puzzle = generateSudoku(4);
    const blanks = puzzle.puzzle.flat().filter((v) => v === null);
    expect(blanks.length).toBeGreaterThan(0);
  });

  it('given cells match solution', () => {
    const puzzle = generateSudoku(4);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (puzzle.puzzle[r][c] !== null) {
          expect(puzzle.puzzle[r][c]).toBe(puzzle.solution[r][c]);
        }
      }
    }
  });
});

describe('generateSudoku(6)', () => {
  it('returns correct metadata', () => {
    const puzzle = generateSudoku(6);
    expect(puzzle.size).toBe(6);
    expect(puzzle.boxRows).toBe(2);
    expect(puzzle.boxCols).toBe(3);
  });

  it('solution is a valid 6x6 sudoku', () => {
    for (let i = 0; i < 3; i++) {
      const puzzle = generateSudoku(6);
      expect(validateSudokuSolution(puzzle.solution, 6, 2, 3)).toBe(true);
    }
  });

  it('puzzle has blanks', () => {
    const puzzle = generateSudoku(6);
    const blanks = puzzle.puzzle.flat().filter((v) => v === null);
    expect(blanks.length).toBeGreaterThan(0);
  });
});
