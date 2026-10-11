/**
 * Inspector contextual derecho (prompt 03.1; edición completa en 03.2).
 *
 - Sin selección: propiedades del escenario y resumen de zonas.
 - Objeto: básicas arriba (nombre, posición, rotación, dimensiones) y
   avanzadas plegadas (zona, etiquetas, propiedades del catálogo, apertura
   en puertas) — regla 15: no mostrar todo a la vez.
 - Selección múltiple: recuento y acciones masivas.
 - Zona: nombre, categoría, límites y capacidad.
 *
 Las ediciones se confirman al perder el foco o con Enter (una edición =
 una entrada de historial) y las rechazadas por el dominio se muestran sin
 perder datos (el mensaje de error aparece en el panel de estado).
 */
import { useState } from 'react'
import type { CatalogObjectPreset } from '@lba/asset-catalog'
import type { WorldObjectId, ZoneId } from '@lba/domain'
import type { EditorStore } from '@lba/editor-2d'
import {
  HINGE_KEY,
  OPENING_KEY,
  SLIDE_KEY,
  dimensionLimitsFor,
  formatLength,
  originPresetOf,
  rangeErrorMessage,
} from '@lba/editor-2d'
import { useCommittableValue, useEditorValue } from './useEditorStore'

const DEG = '°'

export function Inspector({ store }: { store: EditorStore }) {
  const selection = useEditorValue(store, (s) => s.document.selection)
  const objectCount = selection.objectIds.length
  const zoneCount = selection.zoneIds.length

  if (objectCount === 0 && zoneCount === 0) {
    return <ScenarioInspector store={store} />
  }
  if (objectCount === 0 && zoneCount === 1) {
    return <ZoneInspector store={store} zoneId={selection.zoneIds[0]!} />
  }
  if (objectCount === 1 && zoneCount === 0) {
    return <ObjectInspector store={store} objectId={selection.objectIds[0]!} />
  }
  return <MultiInspector store={store} objectCount={objectCount} zoneCount={zoneCount} />
}

// --------------------------------------------------------------- escenario

function ScenarioInspector({ store }: { store: EditorStore }) {
  const scenario = useEditorValue(store, (s) => s.document.scenario)
  const unit = scenario.world.lengthUnit
  const zoneNames = scenario.zones.map((z) => `${z.name} (${z.category})`).join(', ')

  return (
    <div className="inspector" data-testid="inspector-scenario">
      <h2 className="inspector__title">Escenario</h2>
      <p className="inspector__hint">
        Selecciona un objeto en el lienzo para editarlo, o dibuja con las herramientas de la
        izquierda. Atajos: 1–8 cambian de herramienta, Ctrl+Z deshace, ? muestra la ayuda.
      </p>

      <TextField
        label="Nombre"
        value={scenario.name}
        data-testid="field-scenario-name"
        onCommit={(v) => store.patchScenario({ name: v })}
      />
      <TextField
        label="Descripción"
        value={scenario.description ?? ''}
        optional
        data-testid="field-scenario-description"
        onCommit={(v) =>
          store.patchScenario(v === '' ? { description: undefined } : { description: v })
        }
      />
      <NumberField
        label="Semilla de simulación"
        value={scenario.seed}
        integer
        data-testid="field-scenario-seed"
        onCommit={(v) => store.patchScenario({ seed: v })}
      />
      <div className="inspector__row">
        <NumberField
          label={`Ancho del local (${unit})`}
          value={scenario.world.size.width}
          step={0.5}
          data-testid="field-world-width"
          onCommit={(v) =>
            store.patchScenario({ worldSize: { width: v, depth: scenario.world.size.depth } })
          }
        />
        <NumberField
          label={`Fondo del local (${unit})`}
          value={scenario.world.size.depth}
          step={0.5}
          data-testid="field-world-depth"
          onCommit={(v) =>
            store.patchScenario({ worldSize: { width: scenario.world.size.width, depth: v } })
          }
        />
      </div>

      <div className="inspector__section">
        <h3>Zonas del plano</h3>
        {scenario.zones.length === 0 ? (
          <p className="inspector__empty" data-testid="inspector-zones-empty">
            Aún no hay zonas: dibuja la primera con la herramienta Zona (6).
          </p>
        ) : (
          <ul className="inspector__zone-list" data-testid="inspector-zone-list">
            {scenario.zones.map((z) => (
              <li key={z.id}>
                <button type="button" onClick={() => store.selectZone(z.id, false)}>
                  {z.name} <small>({z.category})</small>
                </button>
              </li>
            ))}
          </ul>
        )}
        {zoneNames.length > 0 && <p className="inspector__muted">{zoneNames}</p>}
      </div>
    </div>
  )
}

// --------------------------------------------------------------- objetos

function ObjectInspector({ store, objectId }: { store: EditorStore; objectId: WorldObjectId }) {
  const obj = useEditorValue(store, (s) =>
    s.document.scenario.objects.find((o) => o.id === objectId),
  )
  const unit = useEditorValue(store, (s) => s.document.scenario.world.lengthUnit)
  const zones = useEditorValue(store, (s) => s.document.scenario.zones)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  if (!obj) {
    return (
      <div className="inspector" data-testid="inspector-object-missing">
        <p>El objeto seleccionado ya no existe (¿se borró?).</p>
      </div>
    )
  }

  const preset = originPresetOf(obj)
  const isWall = obj.kind === 'wall'
  const limitsLength = dimensionLimitsFor(obj, 'length')
  const limitsWidth = dimensionLimitsFor(obj, 'width')
  const limitsDepth = dimensionLimitsFor(obj, 'depth')

  const commitDimension = (
    label: string,
    value: number,
    limits: { min: number; max: number },
    apply: () => void,
  ) => {
    if (value < limits.min || value > limits.max) {
      store.pushMessage('error', rangeErrorMessage(label, value, limits, unit))
      return
    }
    apply()
  }

  return (
    <div className="inspector" data-testid="inspector-object">
      <h2 className="inspector__title">{obj.name ?? obj.kind}</h2>
      <p className="inspector__muted">
        {obj.kind} · capa {obj.layer}
        {preset ? ` · preset ${preset.label}` : ' · sin preset de catálogo'}
      </p>

      <TextField
        label="Nombre visible"
        value={obj.name ?? ''}
        optional
        data-testid="field-object-name"
        onCommit={(v) => store.patchObject(obj.id, v === '' ? { name: undefined } : { name: v })}
      />

      <div className="inspector__row">
        <NumberField
          label={`X (${unit})`}
          value={obj.position.x}
          step={0.1}
          data-testid="field-object-x"
          onCommit={(v) => store.patchObject(obj.id, { position: { ...obj.position, x: v } })}
        />
        <NumberField
          label={`Y (${unit})`}
          value={obj.position.y}
          step={0.1}
          data-testid="field-object-y"
          onCommit={(v) => store.patchObject(obj.id, { position: { ...obj.position, y: v } })}
        />
      </div>

      <NumberField
        label={`Rotación ${DEG} [0, 360)`}
        value={obj.rotation}
        step={15}
        data-testid="field-object-rotation"
        suffix={
          <span className="inspector__quick">
            <button
              type="button"
              title="Girar 90° a la derecha (tecla R)"
              onClick={() => store.rotateSelection(90)}
            >
              +90°
            </button>
          </span>
        }
        onCommit={(v) => store.patchObject(obj.id, { rotation: v })}
      />

      {isWall ? (
        <NumberField
          label={`Longitud del tramo (${unit})`}
          value={obj.dimensions.width}
          step={0.1}
          data-testid="field-wall-length"
          onCommit={(v) =>
            commitDimension('Longitud del tramo', v, limitsLength, () =>
              store.updateWallLength(obj.id, v),
            )
          }
        />
      ) : (
        <div className="inspector__row">
          <NumberField
            label={`Ancho (${unit})`}
            value={obj.dimensions.width}
            step={0.05}
            data-testid="field-object-width"
            onCommit={(v) =>
              commitDimension('Ancho', v, limitsWidth, () =>
                store.patchObject(obj.id, { dimensions: { ...obj.dimensions, width: v } }),
              )
            }
          />
          <NumberField
            label={`Fondo (${unit})`}
            value={obj.dimensions.depth}
            step={0.05}
            data-testid="field-object-depth"
            onCommit={(v) =>
              commitDimension('Fondo', v, limitsDepth, () =>
                store.patchObject(obj.id, { dimensions: { ...obj.dimensions, depth: v } }),
              )
            }
          />
        </div>
      )}

      {preset && preset.materials.length > 0 && (
        <MaterialSelect
          store={store}
          objectId={obj.id}
          preset={preset}
          current={obj.material ?? ''}
        />
      )}

      <ColorField
        label="Color del plano (#RRGGBB)"
        value={obj.color ?? '#bdc3c7'}
        data-testid="field-object-color"
        onCommit={(v) => store.patchObject(obj.id, { color: v })}
      />

      <button
        type="button"
        className="inspector__fold"
        aria-expanded={advancedOpen}
        data-testid="fold-advanced"
        onClick={() => setAdvancedOpen((v) => !v)}
      >
        {advancedOpen ? '▾' : '▸'} Propiedades avanzadas
      </button>

      {advancedOpen && (
        <div className="inspector__advanced" data-testid="advanced-panel">
          <label className="inspector__field">
            Zona funcional
            <select
              value={obj.zoneId ?? ''}
              data-testid="field-object-zone"
              onChange={(e) => {
                const value = e.target.value
                store.patchObject(obj.id, { zoneId: (value === '' ? undefined : value) as never })
              }}
            >
              <option value="">— Sin zona —</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </label>

          {obj.kind === 'door' && (
            <div className="inspector__section">
              <h3>Apertura</h3>
              <label className="inspector__field">
                Mecanismo
                <select
                  value={obj.doorType ?? 'swing'}
                  data-testid="field-door-type"
                  onChange={(e) =>
                    store.patchObject(obj.id, { doorType: e.target.value as 'swing' | 'sliding' })
                  }
                >
                  <option value="swing">Batiente</option>
                  <option value="sliding">Corredera</option>
                </select>
              </label>
              {obj.doorType !== 'sliding' ? (
                <div className="inspector__row">
                  <label className="inspector__field">
                    Bisagra
                    <select
                      value={String(obj.properties[HINGE_KEY] ?? 'left')}
                      data-testid="field-door-hinge"
                      onChange={(e) =>
                        store.patchObject(obj.id, {
                          properties: { ...obj.properties, [HINGE_KEY]: e.target.value },
                        })
                      }
                    >
                      <option value="left">Izquierda</option>
                      <option value="right">Derecha</option>
                    </select>
                  </label>
                  <label className="inspector__field">
                    Lado de apertura
                    <select
                      value={String(obj.properties[OPENING_KEY] ?? 'a')}
                      data-testid="field-door-opening"
                      onChange={(e) =>
                        store.patchObject(obj.id, {
                          properties: { ...obj.properties, [OPENING_KEY]: e.target.value },
                        })
                      }
                    >
                      <option value="a">Lado A</option>
                      <option value="b">Lado B</option>
                    </select>
                  </label>
                </div>
              ) : (
                <label className="inspector__field">
                  Dirección de deslizamiento
                  <select
                    value={String(obj.properties[SLIDE_KEY] ?? 'right')}
                    data-testid="field-door-slide"
                    onChange={(e) =>
                      store.patchObject(obj.id, {
                        properties: { ...obj.properties, [SLIDE_KEY]: e.target.value },
                      })
                    }
                  >
                    <option value="left">Hacia la izquierda</option>
                    <option value="right">Hacia la derecha</option>
                  </select>
                </label>
              )}
            </div>
          )}

          {preset && Object.keys(preset.parameters).length > 0 && (
            <div className="inspector__section">
              <h3>Propiedades del catálogo</h3>
              {Object.entries(preset.parameters).map(([key, spec]) => (
                <NumberField
                  key={key}
                  label={`${spec.label} (${spec.record.unit})`}
                  value={
                    typeof obj.properties[key] === 'number'
                      ? (obj.properties[key] as number)
                      : spec.record.value
                  }
                  step={1}
                  data-testid={`field-param-${key}`}
                  onCommit={(v) =>
                    store.patchObject(obj.id, { properties: { ...obj.properties, [key]: v } })
                  }
                />
              ))}
              <p className="inspector__muted">
                Rangos declarados por el catálogo (estimaciones editables, regla 10): consúltalos en
                la descripción del preset.
              </p>
            </div>
          )}

          {obj.capacity !== undefined && (
            <NumberField
              label="Capacidad (comensales)"
              value={obj.capacity}
              integer
              min={1}
              data-testid="field-object-capacity"
              onCommit={(v) => store.patchObject(obj.id, { capacity: Math.max(1, Math.round(v)) })}
            />
          )}

          <TextField
            label="Etiquetas (separadas por comas)"
            value={obj.tags.join(', ')}
            data-testid="field-object-tags"
            onCommit={(v) =>
              store.patchObject(obj.id, {
                tags: v
                  .split(',')
                  .map((t) => t.trim())
                  .filter((t) => t.length > 0),
              })
            }
          />

          <div className="inspector__row">
            <NumberField
              label={`Punto de interacción X (${unit})`}
              value={obj.interactionPoint.x}
              step={0.1}
              data-testid="field-object-ipx"
              onCommit={(v) =>
                store.patchObject(obj.id, {
                  interactionPoint: { ...obj.interactionPoint, x: v },
                })
              }
            />
            <NumberField
              label={`Y (${unit})`}
              value={obj.interactionPoint.y}
              step={0.1}
              data-testid="field-object-ipy"
              onCommit={(v) =>
                store.patchObject(obj.id, {
                  interactionPoint: { ...obj.interactionPoint, y: v },
                })
              }
            />
          </div>
          <p className="inspector__muted">
            {preset
              ? preset.usageNotes[0]
              : 'Objeto sin preset de catálogo: solo se aplican las invariantes del dominio.'}
          </p>
        </div>
      )}

      <div className="inspector__danger">
        <button
          type="button"
          data-testid="inspector-delete"
          onClick={() => store.deleteSelection()}
        >
          🗑 Borrar objeto
        </button>
        <button
          type="button"
          data-testid="inspector-duplicate"
          onClick={() => store.duplicateSelection()}
        >
          ⧉ Duplicar
        </button>
      </div>
    </div>
  )
}

function MaterialSelect({
  store,
  objectId,
  preset,
  current,
}: {
  store: EditorStore
  objectId: WorldObjectId
  preset: CatalogObjectPreset
  current: string
}) {
  return (
    <label className="inspector__field">
      Material
      <select
        value={preset.materials.find((m) => m.label === current)?.id ?? preset.defaultMaterialId}
        data-testid="field-object-material"
        onChange={(e) => {
          const material = preset.materials.find((m) => m.id === e.target.value)
          if (material) {
            store.patchObject(objectId, {
              material: material.label,
              color: material.suggestedColor,
            })
          }
        }}
      >
        {preset.materials.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </label>
  )
}

// --------------------------------------------------------------- zonas

function ZoneInspector({ store, zoneId }: { store: EditorStore; zoneId: ZoneId }) {
  const zone = useEditorValue(store, (s) => s.document.scenario.zones.find((z) => z.id === zoneId))
  const unit = useEditorValue(store, (s) => s.document.scenario.world.lengthUnit)
  if (!zone) {
    return (
      <div className="inspector" data-testid="inspector-zone-missing">
        <p>La zona seleccionada ya no existe.</p>
      </div>
    )
  }
  return (
    <div className="inspector" data-testid="inspector-zone">
      <h2 className="inspector__title">{zone.name}</h2>
      <p className="inspector__muted">Zona funcional · categoría {zone.category}</p>
      <TextField
        label="Nombre visible"
        value={zone.name}
        data-testid="field-zone-name"
        onCommit={(v) => store.patchZone(zone.id, { name: v })}
      />
      <div className="inspector__row">
        <NumberField
          label={`Min X (${unit})`}
          value={zone.bounds.min.x}
          step={0.5}
          data-testid="field-zone-minx"
          onCommit={(v) =>
            store.patchZone(zone.id, {
              bounds: { ...zone.bounds, min: { ...zone.bounds.min, x: v } },
            })
          }
        />
        <NumberField
          label={`Min Y (${unit})`}
          value={zone.bounds.min.y}
          step={0.5}
          data-testid="field-zone-miny"
          onCommit={(v) =>
            store.patchZone(zone.id, {
              bounds: { ...zone.bounds, min: { ...zone.bounds.min, y: v } },
            })
          }
        />
      </div>
      <div className="inspector__row">
        <NumberField
          label={`Max X (${unit})`}
          value={zone.bounds.max.x}
          step={0.5}
          data-testid="field-zone-maxx"
          onCommit={(v) =>
            store.patchZone(zone.id, {
              bounds: { ...zone.bounds, max: { ...zone.bounds.max, x: v } },
            })
          }
        />
        <NumberField
          label={`Max Y (${unit})`}
          value={zone.bounds.max.y}
          step={0.5}
          data-testid="field-zone-maxy"
          onCommit={(v) =>
            store.patchZone(zone.id, {
              bounds: { ...zone.bounds, max: { ...zone.bounds.max, y: v } },
            })
          }
        />
      </div>
      {zone.capacity !== undefined && (
        <NumberField
          label="Capacidad estimada (personas)"
          value={zone.capacity}
          integer
          min={1}
          data-testid="field-zone-capacity"
          onCommit={(v) => store.patchZone(zone.id, { capacity: Math.max(1, Math.round(v)) })}
        />
      )}
      <p className="inspector__muted">
        Tamaño: {formatLength(zone.bounds.max.x - zone.bounds.min.x, unit)} ×{' '}
        {formatLength(zone.bounds.max.y - zone.bounds.min.y, unit)}. La capacidad es una estimación
        editable, no un aforo certificado.
      </p>
      <div className="inspector__danger">
        <button type="button" data-testid="zone-delete" onClick={() => store.deleteSelection()}>
          🗑 Borrar zona
        </button>
      </div>
    </div>
  )
}

function MultiInspector({
  store,
  objectCount,
  zoneCount,
}: {
  store: EditorStore
  objectCount: number
  zoneCount: number
}) {
  return (
    <div className="inspector" data-testid="inspector-multi">
      <h2 className="inspector__title">Selección múltiple</h2>
      <p>
        {objectCount} objeto{objectCount === 1 ? '' : 's'} y {zoneCount} zona
        {zoneCount === 1 ? '' : 's'} seleccionados.
      </p>
      <p className="inspector__muted">
        Mueve la selección arrastrando en el lienzo o con las flechas; rota con R; borra con Supr
        (se pedirá confirmación).
      </p>
      <div className="inspector__danger">
        <button type="button" data-testid="multi-delete" onClick={() => store.deleteSelection()}>
          🗑 Borrar selección
        </button>
        <button
          type="button"
          data-testid="multi-duplicate"
          onClick={() => store.duplicateSelection()}
        >
          ⧉ Duplicar objetos
        </button>
      </div>
    </div>
  )
}

// --------------------------------------------------------------- campos

interface TextFieldProps {
  label: string
  value: string
  optional?: boolean
  'data-testid'?: string
  onCommit: (value: string) => void
}

function TextField({ label, value, optional, onCommit, ...rest }: TextFieldProps) {
  const { draft, setDraft, commit, cancel } = useCommittableValue(value, onCommit)
  return (
    <label className="inspector__field">
      {label}
      {optional ? ' (opcional)' : ''}
      <input
        type="text"
        value={draft}
        data-testid={rest['data-testid']}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') cancel()
        }}
      />
    </label>
  )
}

interface NumberFieldProps {
  label: string
  value: number
  step?: number
  integer?: boolean
  min?: number
  'data-testid'?: string
  suffix?: React.ReactNode
  onCommit: (value: number) => void
}

function NumberField({
  label,
  value,
  step = 0.1,
  integer = false,
  min,
  onCommit,
  suffix,
  ...rest
}: NumberFieldProps) {
  const { draft, setDraft, commit, cancel } = useCommittableValue(String(value), (next) => {
    const parsed = integer ? Number.parseInt(next, 10) : Number.parseFloat(next)
    if (!Number.isFinite(parsed)) return
    const bounded = min !== undefined ? Math.max(min, parsed) : parsed
    if (bounded !== value) onCommit(bounded)
  })
  return (
    <label className="inspector__field">
      {label}
      <span className="inspector__number">
        <input
          type="number"
          value={draft}
          step={step}
          data-testid={rest['data-testid']}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') cancel()
          }}
        />
        {suffix}
      </span>
    </label>
  )
}

function ColorField({
  label,
  value,
  onCommit,
  ...rest
}: {
  label: string
  value: string
  'data-testid'?: string
  onCommit: (value: string) => void
}) {
  return (
    <label className="inspector__field">
      {label}
      <span className="inspector__color">
        <input
          type="color"
          value={value}
          data-testid={rest['data-testid']}
          onChange={(e) => onCommit(e.target.value.toUpperCase())}
        />
        <code>{value}</code>
      </span>
    </label>
  )
}
