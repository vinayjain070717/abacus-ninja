import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

function ThrowsError({ message }: { message: string }) {
  throw new Error(message);
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>
    );
    expect(getByText('Hello')).toBeInTheDocument();
  });

  it('catches generic errors and shows "Something went wrong"', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowsError message="Some random error" />
      </ErrorBoundary>
    );
    expect(getByText(/something went wrong/i)).toBeInTheDocument();
    expect(getByText('Try Again')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('shows custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getByText } = render(
      <ErrorBoundary fallback={<div>Custom Error</div>}>
        <ThrowsError message="test error" />
      </ErrorBoundary>
    );
    expect(getByText('Custom Error')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('detects chunk load error and shows "Update Available" with Reload button', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowsError message="Failed to fetch dynamically imported module: https://example.com/assets/MatrixPattern-ARxOKLFf.js" />
      </ErrorBoundary>
    );
    expect(getByText(/update available/i)).toBeInTheDocument();
    expect(getByText('Reload Page')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('detects "Loading chunk" errors as chunk errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowsError message="Loading chunk 42 failed" />
      </ErrorBoundary>
    );
    expect(getByText(/update available/i)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('does NOT treat regular errors as chunk errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <ThrowsError message="Cannot read property 'foo' of undefined" />
      </ErrorBoundary>
    );
    expect(queryByText(/update available/i)).toBeNull();
    expect(getByText(/something went wrong/i)).toBeInTheDocument();
    spy.mockRestore();
  });
});
