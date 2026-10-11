/**
 * Panel de catálogo (izquierda, bajo las herramientas): presets agrupados
 * del catálogo @lba/asset-catalog. Elegir un preset activa su herramienta
 * (pared/puerta/ventana/objeto/zona) para dibujar con el siguiente clic.
 */
import { useMemo, useState } from 'react'
import { CATALOG } from '@lba/asset-catalog'
import type { CatalogGroup } from '@lba/asset-catalog'
import { ICONS, type IconId } from '@lba/asset-catalog'

/** Grupos con su orden de presentación y etiqueta en español. */
const GROUPS: ReadonlyArray<{ id: CatalogGroup | 'zone'; label: string }> = [
  { id: 'wall', label: 'Paredes' },
  { id: 'door', label: 'Puertas' },
  { id: 'window', label: 'Ventanas' },
  { id: 'table', label: 'Mesas' },
  { id: 'chair', label: 'Sillas' },
  { id: 'counter', label: 'Mostradores' },
  { id: 'bar', label: 'Barra' },
  { id: 'station', label: 'Estaciones' },
  { id: 'tray', label: 'Bandejas' },
  { id: 'range', label: 'Fuegos' },
  { id: 'griddle', label: 'Planchas' },
  { id: 'fryer', label: 'Freidoras' },
  { id: 'oven', label: 'Hornos' },
  { id: 'pizza-oven', label: 'Hornos de pizza' },
  { id: 'fridge', label: 'Refrigeración' },
  { id: 'freezer', label: 'Congelación' },
  { id: 'blender', label: 'Batidoras' },
  { id: 'sink', label: 'Fregaderos' },
  { id: 'dishwasher', label: 'Lavavajillas' },
  { id: 'ticket-printer', label: 'Impresoras de comandas' },
  { id: 'pos', label: 'Terminales POS' },
  { id: 'zone', label: 'Zonas' },
]

interface CatalogPanelProps {
  activePresetId: string | null
  onPresetPick: (presetId: string | null) => void
}

export function CatalogPanel({ activePresetId, onPresetPick }: CatalogPanelProps) {
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return GROUPS.map((group) => {
      const items =
        group.id === 'zone'
          ? [...CATALOG.zones.values()]
          : [...CATALOG.objects.values()].filter((p) => p.group === group.id)
      const filtered = q
        ? items.filter(
            (p) =>
              p.label.toLowerCase().includes(q) ||
              p.id.includes(q) ||
              p.tags.some((t) => t.toLowerCase().includes(q)),
          )
        : items
      return { ...group, items: filtered.sort((a, b) => a.label.localeCompare(b.label, 'es')) }
    }).filter((g) => g.items.length > 0)
  }, [query])

  return (
    <div className="catalog" aria-label="Catálogo de presets">
      <div className="catalog__search">
        <input
          type="search"
          placeholder="Buscar en el catálogo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar en el catálogo"
          data-testid="catalog-search"
        />
      </div>
      <div className="catalog__groups">
        {groups.map((group) => (
          <section key={group.id} className="catalog__group">
            <h3 className="catalog__group-title">{group.label}</h3>
            <ul className="catalog__items">
              {group.items.map((preset) => {
                const active = preset.id === activePresetId
                const iconId: IconId =
                  'iconId' in preset ? (preset as { iconId: IconId }).iconId : 'zone'
                const spec = ICONS[iconId]
                return (
                  <li key={preset.id}>
                    <button
                      type="button"
                      className={`catalog__item${active ? ' catalog__item--active' : ''}`}
                      aria-pressed={active}
                      data-preset-id={preset.id}
                      title={preset.description}
                      onClick={() => onPresetPick(active ? null : preset.id)}
                    >
                      <svg viewBox={spec.viewBox} width="16" height="16" aria-hidden="true">
                        <path d={spec.path} fill="currentColor" />
                      </svg>
                      <span>{preset.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
        {groups.length === 0 && (
          <p className="catalog__empty" data-testid="catalog-empty">
            Sin resultados para «{query}».
          </p>
        )}
      </div>
    </div>
  )
}
