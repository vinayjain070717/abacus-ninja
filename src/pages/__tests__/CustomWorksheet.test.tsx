import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CustomWorksheet from '../CustomWorksheet';

describe('CustomWorksheet', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <CustomWorksheet />
      </MemoryRouter>
    );
  });

  it('shows generate button', () => {
    render(
      <MemoryRouter>
        <CustomWorksheet />
      </MemoryRouter>
    );
    expect(screen.getByText(/generate/i)).toBeInTheDocument();
  });
});
