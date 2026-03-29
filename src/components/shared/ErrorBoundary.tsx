import React from 'react';
import { isChunkLoadError } from '../../utils/lazyWithRetry';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isChunkError: isChunkLoadError(error),
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isChunkError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      if (this.state.isChunkError) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
            <h2 className="text-xl font-bold text-red-400 mb-2">Update Available</h2>
            <p className="text-gray-400 mb-4 text-sm">
              A newer version of the app has been deployed. Please reload to get the latest version.
            </p>
            <button
              onClick={this.handleReload}
              className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary/90 text-white"
            >
              Reload Page
            </button>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4 text-sm">{this.state.error?.message}</p>
          <button
            onClick={this.handleRetry}
            className="px-6 py-2 bg-primary rounded-lg font-semibold hover:bg-primary/90 text-white"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
