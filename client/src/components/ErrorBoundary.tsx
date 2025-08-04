import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  async componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
    if (process.env.SENTRY_DSN) {
      const { captureException } = await import("@sentry/browser");
      captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center space-y-4">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}