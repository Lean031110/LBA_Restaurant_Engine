/**
 * Límite de errores de la UI.
 *
 * Regla de la guía: los errores con código legible y acción sugerida,
 * no solo "algo saló mal". Registra APP_UNHANDLED_ERROR en el logger de
 * diagnóstico y ofrece recargar la app.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { EVENT_CODES, type Logger } from '../logger/core'

interface ErrorBoundaryProps {
  logger: Logger
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.logger.error(
      EVENT_CODES.APP_UNHANDLED_ERROR,
      `Error no controlado: ${error.message}`,
      {
        errorName: error.name,
        stack: error.stack ?? '(sin stack)',
        componentStack: info.componentStack ?? '(sin pila de componentes)',
      },
    )
  }

  private readonly handleReload = (): void => {
    window.location.reload()
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children
    return (
      <div role="alert" className="error-boundary">
        <h2>Se produjo un error inesperado</h2>
        <p>
          Código de evento: <code>{EVENT_CODES.APP_UNHANDLED_ERROR}</code>
        </p>
        <p className="error-boundary__message">{this.state.message}</p>
        <p>
          El error quedó registrado en el panel de diagnóstico (botón «Diagnóstico»). Puedes
          descargar el registro y abrir una incidencia con él.
        </p>
        <button type="button" onClick={this.handleReload}>
          Recargar la aplicación
        </button>
      </div>
    )
  }
}
