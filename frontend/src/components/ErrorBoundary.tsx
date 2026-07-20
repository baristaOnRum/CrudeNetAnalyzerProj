/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans p-8">
          <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-8 max-w-lg w-full text-center space-y-4">
            <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
            <h2 className="text-xl font-bold text-slate-800">Error de renderizado</h2>
            <p className="text-sm text-slate-500">
              La interfaz encontró un error inesperado. Puedes intentar recuperarla sin recargar la aplicación.
            </p>
            {this.state.error && (
              <pre className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-opacity-90 transition-all"
            >
              Recuperar interfaz
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
