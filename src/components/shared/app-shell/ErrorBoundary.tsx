/**
 * ErrorBoundary — global React error boundary.
 *
 * Catches runtime JS exceptions in the React tree and renders the
 * `<ErrorState>` primitive (same "baby 404" visual language as /pages/NotFound).
 * Mounted near the app root — any thrown render error hits this.
 *
 * Spec: src/components/primitives/shell/ErrorState.tsx
 * Replaces the pre-refactor legacy card with the W08/S-shell primitive (2026-04-20).
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@/components/primitives/shell';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Infinite-recursion diagnostic — surface component stack to help debug
    if (error.message.includes('Maximum call stack size exceeded')) {
      console.error('🔄 INFINITE RECURSION DETECTED IN ERROR BOUNDARY:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
      void import('@/utils/toastHelper').then(({ showEnhancedToast }) => {
        showEnhancedToast({
          title: 'Infinite Recursion Error',
          description: `Component: ${errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown'}\n\nThis is likely caused by a useEffect or useCallback dependency loop.`,
          variant: 'destructive',
        });
      });
      return;
    }

    // Auth-init race: uninitialized variable / Cannot access — redirect to login
    if (
      error.message.includes('uninitialized variable') ||
      error.message.includes('Cannot access')
    ) {
      window.location.href = '/login';
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'var(--page-bg, #f4f4f5)' }}
        >
          <ErrorState
            code="500"
            subhead="Something went wrong"
            body="An unexpected error occurred. Your work is preserved — try refreshing, or send us a report if this keeps happening."
            onRetry={() => window.location.reload()}
            onReport={() => (window.location.href = '/login')}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
