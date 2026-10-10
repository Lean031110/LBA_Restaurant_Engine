import type { CatalogObjectPreset } from '../preset'
import { centerInteractionPoint, estimatedSpec, frontInteractionPoint } from '../preset'

/**
 * Presets estructurales: paredes, puertas y ventanas (prompt 02.2).
 *
 * Convenios del grupo:
 * - Las paredes son elementos pasivos: punto de interacción en el centro
 *   geométrico (el motor no las usa como destino de agentes; son obstáculos
 *   para el módulo espacial de FASE 07).
 * - El parámetro `length` de una pared SIEMPRE coincide con dimensions.width
 *   (coherencia de datos verificada por test): la huella por defecto es la
 *   del tramo por defecto; el editor ajusta la huella al cambiar la longitud.
 * - Todas las dimensiones están en metros de mundo (docs/guia/01); jamás en
 *   píxeles de pantalla.
 * - Todos los valores son ESTIMACIONES de ejemplo (sourceType "estimated",
 *   confianza "low"): no existe fuente fiable para el local concreto de cada
 *   usuario; el calibrado real llega con datos propios (user_calibrated).
 */

export const STRUCTURE_PRESETS: CatalogObjectPreset[] = [
  {
    id: 'cat_wall-interior-100',
    group: 'wall',
    label: 'Pared interior 10 cm',
    description:
      'Tabique interior de 10 cm de espesor para dividir salón, cocina y áreas de servicio. Tramo por defecto de 3 m; la longitud se ajusta al instanciar y la huella se recalcula con ella.',
    family: 'wall',
    layer: 'structure',
    tags: ['estructura', 'división'],
    dimensions: { width: 3, depth: 0.1 },
    heightM: 2.4,
    interactionPoint: centerInteractionPoint(),
    materials: [
      { id: 'drywall', label: 'Placa de yeso', suggestedColor: '#e8e4dc' },
      { id: 'brick', label: 'Ladrillo visto', suggestedColor: '#b5563c' },
    ],
    defaultMaterialId: 'drywall',
    parameters: {
      length: estimatedSpec({
        label: 'Longitud del tramo',
        value: 3,
        unit: 'm',
        minValue: 0.1,
        maxValue: 50,
        assumptions:
          'Estimación de ejemplo: rango operativo pensado para locales de restauración (desde nichos de 10 cm hasta naves de 50 m). No representa ninguna normativa local de edificación.',
      }),
    },
    flags: {},
    iconId: 'wall',
    usageNotes: [
      'La longitud por defecto (3 m) es un punto de partida de dibujo, no una medida del local real.',
      'El espesor (10 cm) no incluye revestimientos; el acabado puede sumar 2–4 cm por cara.',
    ],
  },
  {
    id: 'cat_wall-interior-150',
    group: 'wall',
    label: 'Pared interior 15 cm',
    description:
      'Tabique interior de 15 cm para zonas húmedas o donde se prevé carga (estanterías, campanas). Tramo por defecto de 3 m ajustable al instanciar.',
    family: 'wall',
    layer: 'structure',
    tags: ['estructura', 'división', 'húmeda'],
    dimensions: { width: 3, depth: 0.15 },
    heightM: 2.4,
    interactionPoint: centerInteractionPoint(),
    materials: [
      { id: 'drywall', label: 'Placa de yeso', suggestedColor: '#e8e4dc' },
      { id: 'brick', label: 'Ladrillo visto', suggestedColor: '#b5563c' },
    ],
    defaultMaterialId: 'brick',
    parameters: {
      length: estimatedSpec({
        label: 'Longitud del tramo',
        value: 3,
        unit: 'm',
        minValue: 0.1,
        maxValue: 50,
        assumptions:
          'Estimación de ejemplo con el mismo rango operativo que la pared de 10 cm; no representa la resistencia al fuego ni el aislamiento acústico de la pared real.',
      }),
    },
    flags: {},
    iconId: 'wall',
    usageNotes: [
      'El espesor de 15 cm se elige por zonas húmedas; no certifica aislamiento acústico ni normativo.',
    ],
  },
  {
    id: 'cat_wall-exterior-250',
    group: 'wall',
    label: 'Pared exterior 25 cm',
    description:
      'Fachada o muro perimetral de 25 cm. Tramo por defecto de 4 m, ajustable; la altura física por defecto es 3 m para exteriores.',
    family: 'wall',
    layer: 'structure',
    tags: ['estructura', 'fachada'],
    dimensions: { width: 4, depth: 0.25 },
    heightM: 3,
    interactionPoint: centerInteractionPoint(),
    materials: [
      { id: 'concrete', label: 'Hormigón visto', suggestedColor: '#9aa0a6' },
      { id: 'brick', label: 'Ladrillo visto', suggestedColor: '#b5563c' },
    ],
    defaultMaterialId: 'concrete',
    parameters: {
      length: estimatedSpec({
        label: 'Longitud del tramo',
        value: 4,
        unit: 'm',
        minValue: 0.1,
        maxValue: 60,
        assumptions:
          'Estimación de ejemplo: los perímetros comerciales rara vez superan 60 m por tramo recto. No representa condiciones estructurales ni térmicas del muro real.',
      }),
    },
    flags: {},
    iconId: 'wall',
    usageNotes: [
      'La altura de 3 m es visual (FASE 10); la simulación 2D/3D de FASE 02–09 no la usa para cálculos.',
    ],
  },
  {
    id: 'cat_door-swing-wood-90',
    group: 'door',
    label: 'Puerta batiente madera 90 cm',
    description:
      'Puerta de una hoja con apertura batiente y hueco de 90 cm, el ancho estándar de acceso en restauración. Grosor de hoja 5 cm en el plano.',
    family: 'door',
    layer: 'structure',
    tags: ['estructura', 'acceso'],
    dimensions: { width: 0.9, depth: 0.05 },
    heightM: 2.1,
    interactionPoint: frontInteractionPoint({ width: 0.9, depth: 0.05 }),
    materials: [{ id: 'wood', label: 'Madera', suggestedColor: '#8b5a2b' }],
    defaultMaterialId: 'wood',
    parameters: {},
    flags: {},
    iconId: 'door',
    doorMechanism: 'swing',
    usageNotes: [
      'La huella representa la HOJA cerrada, no el arco de apertura; el editor (FASE 03) dibuja el arco como guía y el módulo espacial (FASE 07) trata el vano como transitable.',
    ],
  },
  {
    id: 'cat_door-swing-metal-90',
    group: 'door',
    label: 'Puerta batiente metal 90 cm',
    description:
      'Puerta metálica de una hoja para paso entre cocina y salón o acceso a almacén. Hueco de 90 cm; hoja de 5 cm en el plano.',
    family: 'door',
    layer: 'structure',
    tags: ['estructura', 'acceso', 'servicio'],
    dimensions: { width: 0.9, depth: 0.05 },
    heightM: 2.1,
    interactionPoint: frontInteractionPoint({ width: 0.9, depth: 0.05 }),
    materials: [
      { id: 'metal', label: 'Acero lacado', suggestedColor: '#6e7b8b' },
      { id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' },
    ],
    defaultMaterialId: 'inox',
    parameters: {},
    flags: {},
    iconId: 'door',
    doorMechanism: 'swing',
    usageNotes: [
      'El preset no declara cierre automático ni resistencia al fuego: esos atributos llegan con datos del fabricante (FASE 05+).',
    ],
  },
  {
    id: 'cat_door-swing-glass-90',
    group: 'door',
    label: 'Puerta batiente cristal 90 cm',
    description:
      'Puerta de vidrio de una hoja para entrada principal al salón. Hueco de 90 cm; hoja de 5 cm en el plano.',
    family: 'door',
    layer: 'structure',
    tags: ['estructura', 'acceso', 'salón'],
    dimensions: { width: 0.9, depth: 0.05 },
    heightM: 2.3,
    interactionPoint: frontInteractionPoint({ width: 0.9, depth: 0.05 }),
    materials: [{ id: 'glass', label: 'Vidrio templado', suggestedColor: '#cfe8f3' }],
    defaultMaterialId: 'glass',
    parameters: {},
    flags: {},
    iconId: 'door',
    doorMechanism: 'swing',
    usageNotes: [
      'No modela freno de cierre ni velocidad de apertura: la simulación de FASE 02 trata todos los vanos como paso inmediato.',
    ],
  },
  {
    id: 'cat_door-swing-wood-70',
    group: 'door',
    label: 'Puerta batiente madera 70 cm (paso)',
    description:
      'Puerta estrecha de paso para staff (despacho, trastero). Hueco de 70 cm; el ancho mínimo recomendado para circulación con bandejas es 90 cm.',
    family: 'door',
    layer: 'structure',
    tags: ['estructura', 'acceso', 'staff'],
    dimensions: { width: 0.7, depth: 0.05 },
    heightM: 2.05,
    interactionPoint: frontInteractionPoint({ width: 0.7, depth: 0.05 }),
    materials: [{ id: 'wood', label: 'Madera', suggestedColor: '#8b5a2b' }],
    defaultMaterialId: 'wood',
    parameters: {},
    flags: {},
    iconId: 'door',
    doorMechanism: 'swing',
    usageNotes: [
      'La congestión de un paso de 70 cm se evalúa en FASE 07; este preset solo fija la geometría del vano.',
    ],
  },
  {
    id: 'cat_door-slide-glass-180',
    group: 'door',
    label: 'Puerta corredera cristal 180 cm',
    description:
      'Puerta corredera de dos hojas para entrada principal. Hueco total de 180 cm; el plano muestra el conjunto cerrado (12 cm de raíl).',
    family: 'door',
    layer: 'structure',
    tags: ['estructura', 'acceso', 'entrada'],
    dimensions: { width: 1.8, depth: 0.12 },
    heightM: 2.4,
    interactionPoint: frontInteractionPoint({ width: 1.8, depth: 0.12 }),
    materials: [
      { id: 'glass', label: 'Vidrio templado', suggestedColor: '#cfe8f3' },
      { id: 'alu', label: 'Aluminio', suggestedColor: '#d7dade' },
    ],
    defaultMaterialId: 'glass',
    parameters: {},
    flags: {},
    iconId: 'door',
    doorMechanism: 'sliding',
    usageNotes: [
      'La huella corresponde al raíl cerrado; las dos hojas no se dibujan por separado en el plano 2D.',
    ],
  },
  {
    id: 'cat_door-slide-metal-140',
    group: 'door',
    label: 'Puerta corredera metal 140 cm (servicio)',
    description:
      'Corredera doble de servicio entre cocina y salón de fondo (pass). Hueco de 140 cm; raíl de 12 cm en el plano.',
    family: 'door',
    layer: 'structure',
    tags: ['estructura', 'acceso', 'cocina'],
    dimensions: { width: 1.4, depth: 0.12 },
    heightM: 2.2,
    interactionPoint: frontInteractionPoint({ width: 1.4, depth: 0.12 }),
    materials: [
      { id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' },
      { id: 'metal', label: 'Acero lacado', suggestedColor: '#6e7b8b' },
    ],
    defaultMaterialId: 'inox',
    parameters: {},
    flags: {},
    iconId: 'door',
    doorMechanism: 'sliding',
    usageNotes: [
      'No declara ventilación ni cortinas de aire: atributos del fabricante, fuera del alcance de FASE 02.',
    ],
  },
  {
    id: 'cat_window-fixed-120',
    group: 'window',
    label: 'Ventana fija 120 cm',
    description:
      'Ventanal fijo de 120 cm de ancho para fachada. El plano muestra el marco (10 cm); aporta luz y vista, no paso.',
    family: 'window',
    layer: 'structure',
    tags: ['estructura', 'iluminación'],
    dimensions: { width: 1.2, depth: 0.1 },
    heightM: 1.5,
    interactionPoint: centerInteractionPoint(),
    materials: [
      { id: 'alu', label: 'Aluminio', suggestedColor: '#d7dade' },
      { id: 'wood', label: 'Madera', suggestedColor: '#8b5a2b' },
    ],
    defaultMaterialId: 'alu',
    parameters: {},
    flags: {},
    iconId: 'window',
    usageNotes: [
      'La ventana es opaca para la simulación: no existe paso de agentes ni intercambio térmico en FASE 02.',
    ],
  },
  {
    id: 'cat_window-fixed-90',
    group: 'window',
    label: 'Ventana fija 90 cm',
    description:
      'Ventana fija de 90 cm para muros interiores de cocina (ojo de pass) o fachadas pequeñas.',
    family: 'window',
    layer: 'structure',
    tags: ['estructura', 'iluminación', 'cocina'],
    dimensions: { width: 0.9, depth: 0.1 },
    heightM: 1.2,
    interactionPoint: centerInteractionPoint(),
    materials: [
      { id: 'alu', label: 'Aluminio', suggestedColor: '#d7dade' },
      { id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' },
    ],
    defaultMaterialId: 'alu',
    parameters: {},
    flags: {},
    iconId: 'window',
    usageNotes: [
      'Como ojo de pass, la transmisión de tickets se modela en FASE 05; aquí es solo geometría del muro.',
    ],
  },
]
