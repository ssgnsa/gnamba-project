import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Bug } from "lucide-react";
import { captureErrorBoundary } from "../lib/sentry";

interface Props {
  children: ReactNode;
  moduleName: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary - Capture les erreurs React et affiche un fallback utilisateur
 *
 * Utilisation :
 * <ErrorBoundary moduleName="Projets BTP">
 *   <ProjetsBTP />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV)
      console.error(
        `[ErrorBoundary] Module "${this.props.moduleName}" crashed:`,
        error,
        errorInfo,
      );

    // Logger l'erreur pour le débogage
    this.setState({ errorInfo });

    // Send to Sentry in production
    if (import.meta.env.PROD) {
      captureErrorBoundary(
        this.props.moduleName,
        error,
        errorInfo.componentStack ?? undefined,
      );
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Appeler le callback onReset si fourni
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Module indisponible
                </h2>
                <p className="text-xs text-gray-500">{this.props.moduleName}</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-sm text-red-800">
                Une erreur technique est survenue dans ce module. Notre équipe a
                été notifiée.
              </p>
            </div>

            {this.state.error && (
              <details className="mb-6">
                <summary className="text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-800 flex items-center gap-2">
                  <Bug size={14} />
                  Détails techniques (pour le support)
                </summary>
                <div className="mt-3 p-3 bg-gray-900 rounded-lg overflow-x-auto">
                  <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {"\n\n"}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                <RefreshCw size={18} />
                Réessayer
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Recharger la page
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                Si le problème persiste, contactez l'administrateur système.
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
