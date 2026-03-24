import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimedChallenge from '../TimedChallenge';

describe('TimedChallenge', () => {
  it('renders without crashing', () => {
    render(<TimedChallenge />);
  });

  it('shows game selection', () => {
    render(<TimedChallenge />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows start button', () => {
    render(<TimedChallenge />);
    expect(screen.getByText(/^start$/i)).toBeInTheDocument();
  });
});
