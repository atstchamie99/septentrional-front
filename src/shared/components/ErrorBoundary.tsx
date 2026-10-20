import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white border border-gray-200 p-6 sm:p-8 shadow-lg text-center rounded-none">
            <div className="w-12 h-12 bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl rounded-none">
              !
            </div>
            <h2 className="text-xl font-serif font-black text-gray-900 mb-2">
              Une erreur inattendue est survenue
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-6">
              L'application a rencontré un problème d'affichage. Veuillez recharger la page.
            </p>
            {this.state.error && import.meta.env.DEV && (
              <pre className="text-left bg-gray-900 text-red-300 text-[11px] p-3 mb-6 overflow-auto max-h-48 rounded-none">
                {this.state.error.toString()}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-sept-blue hover:bg-sept-blue-dark text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer"
              >
                Recharger la page
              </button>
              <a
                href="/"
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-none transition-colors"
              >
                Retour à l'accueil
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
