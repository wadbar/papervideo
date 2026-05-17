import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { sysLog } from '../lib/sys';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorArmor extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    sysLog(`Component Crash Detectado: ${error.message}`, 'error');
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-12 bg-[#0d0d0f] border border-red-900/20 rounded-2xl hardware-card">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-red-500 mb-2">Isolation Protocol Active</h2>
          <p className="text-xs text-[#8e9299] text-center mb-6 max-w-xs">
            A component failed. The system has isolated the fault to preserve kernel stability.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-2 bg-[#1f2128] border border-[#2a2d35] hover:border-red-500/50 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-300 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            Recarregar Sistema
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
