import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

function WorksheetSectionTestHarness({ problems }: {
  problems: { display: string; correctAnswer: number }[];
}) {
  const [answers, setAnswers] = useState<string[]>(Array(problems.length).fill(''));
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const handleBlur = (i: number) => {
    if (answers[i].trim() !== '') {
      setChecked((prev) => new Set(prev).add(i));
    }
  };

  const getFeedback = (i: number): 'correct' | 'wrong' | null => {
    if (!checked.has(i) || answers[i].trim() === '') return null;
    return parseInt(answers[i]) === problems[i].correctAnswer ? 'correct' : 'wrong';
  };

  return (
    <div>
      {problems.map((p, i) => {
        const feedback = getFeedback(i);
        return (
          <div key={i} data-testid={`problem-${i}`}>
            <span>{p.display} =</span>
            <input
              data-testid={`input-${i}`}
              type="number"
              value={answers[i]}
              onChange={(e) => {
                const a = [...answers];
                a[i] = e.target.value;
                setAnswers(a);
              }}
              onBlur={() => handleBlur(i)}
            />
            {feedback === 'correct' && <span data-testid={`check-${i}`}>✓</span>}
            {feedback === 'wrong' && <span data-testid={`wrong-${i}`}>✗ Ans: {p.correctAnswer}</span>}
          </div>
        );
      })}
      <button data-testid="next-btn">Next Section</button>
    </div>
  );
}

const sampleProblems = [
  { display: '5 + 3', correctAnswer: 8 },
  { display: '10 - 4', correctAnswer: 6 },
  { display: '7 × 2', correctAnswer: 14 },
];

describe('WorksheetSection inline feedback', () => {
  it('shows no feedback when answers are empty', () => {
    render(<WorksheetSectionTestHarness problems={sampleProblems} />);
    expect(screen.queryByTestId('check-0')).toBeNull();
    expect(screen.queryByTestId('wrong-0')).toBeNull();
  });

  it('shows green checkmark for correct answer on blur', () => {
    render(<WorksheetSectionTestHarness problems={sampleProblems} />);
    const input = screen.getByTestId('input-0');
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.blur(input);
    expect(screen.getByTestId('check-0')).toHaveTextContent('✓');
    expect(screen.queryByTestId('wrong-0')).toBeNull();
  });

  it('shows red mark with correct answer for wrong input on blur', () => {
    render(<WorksheetSectionTestHarness problems={sampleProblems} />);
    const input = screen.getByTestId('input-1');
    fireEvent.change(input, { target: { value: '99' } });
    fireEvent.blur(input);
    expect(screen.getByTestId('wrong-1')).toHaveTextContent('Ans: 6');
    expect(screen.queryByTestId('check-1')).toBeNull();
  });

  it('does not show feedback for untouched inputs', () => {
    render(<WorksheetSectionTestHarness problems={sampleProblems} />);
    const input0 = screen.getByTestId('input-0');
    fireEvent.change(input0, { target: { value: '8' } });
    fireEvent.blur(input0);
    expect(screen.queryByTestId('check-2')).toBeNull();
    expect(screen.queryByTestId('wrong-2')).toBeNull();
  });

  it('does not block next-section button', () => {
    render(<WorksheetSectionTestHarness problems={sampleProblems} />);
    const input = screen.getByTestId('input-0');
    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.blur(input);
    expect(screen.getByTestId('next-btn')).not.toBeDisabled();
  });

  it('updates feedback if user corrects their answer', () => {
    render(<WorksheetSectionTestHarness problems={sampleProblems} />);
    const input = screen.getByTestId('input-0');
    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.blur(input);
    expect(screen.getByTestId('wrong-0')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.blur(input);
    expect(screen.getByTestId('check-0')).toBeInTheDocument();
    expect(screen.queryByTestId('wrong-0')).toBeNull();
  });
});
