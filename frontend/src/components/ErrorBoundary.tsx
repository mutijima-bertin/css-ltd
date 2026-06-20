'use client';

import { Component } from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="retro-grid min-h-screen flex items-center justify-center py-12">
          <div className="retro-card p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">⚠</div>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
              <span className="text-primary">Something went wrong</span>
            </h1>
            <p className="text-muted font-mono text-sm mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              className="retro-border bg-primary text-background px-6 py-3 font-bold text-sm uppercase tracking-wider"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
