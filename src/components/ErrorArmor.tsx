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
        <div className="flex flex-col items-center justify-center p-16 bg-surface-variant/10 border border-error/20 rounded-[3rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-error/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="p-6 bg-error/10 rounded-[2rem] text-error mb-8 shadow-inner border border-error/20">
            <AlertCircle className="w-16 h-16 animate-pulse" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-[0.3em] text-error mb-4">Neural_Fault_Detected</h2>
          <p className="text-sm font-bold text-on-surface-variant opacity-60 text-center mb-10 max-w-sm leading-relaxed tracking-tight">
            An internal sequence failure occurred. The Neural Guard has isolated the affected logic cluster to maintain platform integrity.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-4 px-10 py-5 bg-error text-on-error hover:bg-error/90 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-error/20 transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Reboot Protocols
          </button>
          <p className="mt-10 text-[9px] font-black uppercase tracking-[0.4em] text-outline opacity-30">Status: Fault_Isolated</p>
        </div>
      );
    }

    return this.props.children;
  }
}
