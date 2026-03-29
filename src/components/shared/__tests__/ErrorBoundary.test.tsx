import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

function ThrowsGenericError(): React.JSX.Element {
  throw new Error('Test error');
}

function ThrowsChunkError(): React.JSX.Element {
  throw new Error(
    'Failed to fetch dynamically imported module: https://example.com/assets/Chunk-abc.js',
  );
}

describe('ErrorBoundary', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>,
    );
    expect(getByText('Hello')).toBeInTheDocument();
  });

  it('catches generic errors and shows "Something went wrong"', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowsGenericError />
      </ErrorBoundary>,
    );
    expect(getByText(/something went wrong/i)).toBeInTheDocument();
    expect(getByText('Try Again')).toBeInTheDocument();
  });

  it('shows the error message for generic errors', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowsGenericError />
      </ErrorBoundary>,
    );
    expect(getByText('Test error')).toBeInTheDocument();
  });

  it('shows custom fallback when provided', () => {
    const { getByText } = render(
      <ErrorBoundary fallback={<div>Custom Error UI</div>}>
        <ThrowsGenericError />
      </ErrorBoundary>,
    );
    expect(getByText('Custom Error UI')).toBeInTheDocument();
  });

  it('detects chunk load errors and shows "Update Available"', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowsChunkError />
      </ErrorBoundary>,
    );
    expect(getByText('Update Available')).toBeInTheDocument();
    expect(getByText('Reload Page')).toBeInTheDocument();
  });

  it('does NOT show "Try Again" for chunk errors (only "Reload Page")', () => {
    const { queryByText, getByText } = render(
      <ErrorBoundary>
        <ThrowsChunkError />
      </ErrorBoundary>,
    );
    expect(queryByText('Try Again')).not.toBeInTheDocument();
    expect(getByText('Reload Page')).toBeInTheDocument();
  });

  it('shows deployment message for chunk errors', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowsChunkError />
      </ErrorBoundary>,
    );
    expect(
      getByText(/newer version.*deployed.*reload/i),
    ).toBeInTheDocument();
  });

  it('clicking "Try Again" resets generic error state', async () => {
    let shouldThrow = true;

    function MaybeThrows(): React.JSX.Element {
      if (shouldThrow) throw new Error('Temporary error');
      return <div>Recovered</div>;
    }

    const { getByText } = render(
      <ErrorBoundary>
        <MaybeThrows />
      </ErrorBoundary>,
    );

    expect(getByText(/something went wrong/i)).toBeInTheDocument();
    shouldThrow = false;
    getByText('Try Again').click();
    expect(getByText('Recovered')).toBeInTheDocument();
  });

  it('clicking "Reload Page" calls window.location.reload for chunk errors', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadMock },
    });

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowsChunkError />
      </ErrorBoundary>,
    );

    getByText('Reload Page').click();
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('logs errors to console.error via componentDidCatch', () => {
    render(
      <ErrorBoundary>
        <ThrowsGenericError />
      </ErrorBoundary>,
    );
    expect(consoleSpy).toHaveBeenCalled();
    const firstCallArgs = consoleSpy.mock.calls[0];
    const hasOurLog = firstCallArgs?.some?.(
      (arg: unknown) => typeof arg === 'string' && arg.includes('ErrorBoundary caught'),
    );
    expect(hasOurLog).toBe(true);
  });
});
