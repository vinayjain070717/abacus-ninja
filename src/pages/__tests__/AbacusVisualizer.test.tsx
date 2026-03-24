import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AbacusVisualizer from '../AbacusVisualizer';

describe('AbacusVisualizer', () => {
  it('renders without crashing', () => {
    render(<AbacusVisualizer />);
  });

  it('shows number input', () => {
    render(<AbacusVisualizer />);
    expect(screen.getByRole('textbox', { name: /enter number/i })).toBeInTheDocument();
  });

  it('shows quiz mode button', () => {
    render(<AbacusVisualizer />);
    expect(screen.getByText(/quiz/i)).toBeInTheDocument();
  });
});
