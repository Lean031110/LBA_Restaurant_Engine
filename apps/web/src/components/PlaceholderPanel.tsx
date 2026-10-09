/**
 * Panel de marcador de posición para funcionalidades de fases futuras.
 * Regla de la guía: los controles sin acción deben quedar deshabilitados
 * con explicación, nunca parecer funcionales.
 */
interface PlaceholderPanelProps {
  title: string
  description: string
  phase: string
}

export function PlaceholderPanel({
  title,
  description,
  phase,
}: PlaceholderPanelProps): React.JSX.Element {
  return (
    <section className="placeholder-panel" aria-label={title}>
      <h3>{title}</h3>
      <p>{description}</p>
      <p className="placeholder-panel__phase">Se construye en la {phase}.</p>
    </section>
  )
}
