import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-red-700/20 rounded-xl p-8 lg:p-12 border border-red-300/30 shadow-2xl">
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100/50 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-red-800 mb-4">
                  エラーが発生しました
                </h1>
                <p className="text-xl text-slate-700 mb-2">申し訳ございません。予期しないエラーが発生しました。</p>
                <p className="text-slate-600">ページを再読み込みするか、しばらく時間をおいてから再度お試しください。</p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="backdrop-blur-xl bg-white/20 rounded-lg p-4 border border-white/30 mb-8 text-left">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">エラー詳細（開発用）</h3>
                  <pre className="text-sm text-slate-700 overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white rounded-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>再試行</span>
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-navy-600 to-navy-800 hover:from-navy-700 hover:to-navy-900 text-white rounded-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>ページを再読み込み</span>
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm">
                問題が解決しない場合は、サポートまでお問い合わせください。
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;