import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface FeatureErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
  retryCount: number;
}

export class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, FeatureErrorBoundaryState> {
  private maxRetries = 3;

  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<FeatureErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(`FeatureErrorBoundary [${this.props.featureName}]:`, error, errorInfo);
    
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In development, provide detailed error information
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Feature Error: ${this.props.featureName}`);
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error Boundary Stack:', error.stack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: this.state.retryCount + 1
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg m-4">
          <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400 mb-3" />
          
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            {this.props.featureName} Unavailable
          </h3>
          
          <p className="text-sm text-red-600 dark:text-red-300 text-center mb-4 max-w-md">
            This feature is temporarily unavailable. The app will continue working normally.
          </p>

          {this.state.retryCount < this.maxRetries && (
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again ({this.maxRetries - this.state.retryCount} attempts left)
            </button>
          )}

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 w-full">
              <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">
                Show Error Details (Development)
              </summary>
              <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/20 rounded border text-xs text-red-800 dark:text-red-200 overflow-auto">
                <div className="font-mono mb-2">
                  <strong>Error:</strong> {this.state.error.message}
                </div>
                <div className="font-mono mb-2">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">{this.state.error.stack}</pre>
                </div>
                {this.state.errorInfo && (
                  <div className="font-mono">
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">{this.state.errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping features with error boundaries
export function withFeatureErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureName: string,
  fallback?: ReactNode
) {
  const WithErrorBoundary = (props: P) => (
    <FeatureErrorBoundary featureName={featureName} fallback={fallback}>
      <WrappedComponent {...props} />
    </FeatureErrorBoundary>
  );

  WithErrorBoundary.displayName = `withFeatureErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithErrorBoundary;
}