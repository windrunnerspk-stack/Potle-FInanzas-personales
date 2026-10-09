import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('💥 [ErrorBoundary] Error no capturado en la app:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('aura_modo_invitado');
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isDark = true;
      return (
        <div
          className={`min-h-screen flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif] ${
            isDark ? 'bg-[#090d16] text-neutral-100' : 'bg-slate-50 text-slate-900'
          }`}
        >
          <div className="w-full max-w-md p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <AlertTriangle size={28} />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">
                {this.props.fallbackTitle || 'Se presentó un inconveniente'}
              </h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                La aplicación protegió tu información y evitó una pantalla en blanco.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/40 border border-neutral-800 text-left">
                <span className="text-[10px] font-mono text-rose-400 block break-words">
                  {this.state.error.message || String(this.state.error)}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw size={14} />
                <span>Reintentar</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Home size={14} />
                <span>Reiniciar sesión</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
