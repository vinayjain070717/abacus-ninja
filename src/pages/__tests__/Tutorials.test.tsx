import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Tutorials from '../Tutorials';

describe('Tutorials', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <Tutorials />
      </MemoryRouter>
    );
  });

  it('shows Vedic Math tab', () => {
    render(
      <MemoryRouter>
        <Tutorials />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /vedic math/i })).toBeInTheDocument();
  });

  it('shows tutorial categories', () => {
    render(
      <MemoryRouter>
        <Tutorials />
      </MemoryRouter>
    );
    expect(screen.getByText(/multiplication/i)).toBeInTheDocument();
  });
});
