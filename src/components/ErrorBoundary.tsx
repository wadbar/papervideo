import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-[#0a0a0b] text-white">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">System Fault Detected</h2>
          <p className="text-sm text-[#8e9299] mb-4">The application encountered a critical runtime exception.</p>
          <div className="bg-[#151619] p-4 rounded-lg border border-red-900/30 text-left max-w-2xl overflow-auto text-xs font-mono text-red-400">
            {this.state.error?.message}
          </div>
          <button
            className="mt-6 px-6 py-2 bg-[#1f2128] hover:bg-[#2a2d35] rounded-xl border border-[#2a2d35] transition-colors font-bold text-sm"
            onClick={() => window.location.reload()}
          >
            Reboot System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
