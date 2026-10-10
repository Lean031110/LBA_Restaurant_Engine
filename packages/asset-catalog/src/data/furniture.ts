import type { CatalogObjectPreset } from '../preset'
import { estimatedSpec, frontInteractionPoint } from '../preset'

/**
 * Presets de mobiliario: mesas, sillas, mostradores, barra, estaciones y
 * pila de bandejas (prompt 02.2).
 *
 * Convenios del grupo:
 * - `seats` usa la unidad "persons" (entero) y `accessibleClearance` la
 *   unidad "m": son magnitudes de @lba/domain, no reglas locales.
 * - Los tiempos de limpieza son ESTIMACIONES de ejemplo por mesa/puesto,
 *   medidos "en vacío" (sin clientes esperando): representan el trabajo
 *   físico, no la política de turnos del local.
 * - La silla no declara parámetros: su ocupación la modela la simulación
 *   (FASE 08), no el catálogo.
 */

export const FURNITURE_PRESETS: CatalogObjectPreset[] = [
  {
    id: 'cat_table-round-2',
    group: 'table',
    label: 'Mesa redonda 2 plazas',
    description:
      'Mesa redonda de 60 cm de diámetro para parejas o café. Altura de 75 cm; dos plazas cómodas.',
    family: 'furniture',
    layer: 'furniture',
    tags: ['mobiliario', 'salón', 'café'],
    dimensions: { width: 0.6, depth: 0.6 },
    heightM: 0.75,
    interactionPoint: frontInteractionPoint({ width: 0.6, depth: 0.6 }),
    materials: [
      { id: 'laminate', label: 'Laminado', suggestedColor: '#e6d5b8' },
      { id: 'wood', label: 'Madera', suggestedColor: '#8b5a2b' },
    ],
    defaultMaterialId: 'laminate',
    parameters: {
      seats: estimatedSpec({
        label: 'Plazas',
        value: 2,
        unit: 'persons',
        minValue: 1,
        maxValue: 4,
        assumptions:
          'Estimación de ejemplo para 60 cm de diámetro: 2 comensales cómodos; 4 sería el máximo físico sin confort.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza de mesa',
        value: 240,
        unit: 's',
        minValue: 60,
        maxValue: 1800,
        assumptions:
          'Estimación de ejemplo en vacío (limpiar y montar); no incluye desbarasar ni cobrar, que viven en las tareas de FASE 05/08.',
      }),
      accessibleClearance: estimatedSpec({
        label: 'Despeje accesible',
        value: 0.75,
        unit: 'm',
        minValue: 0.6,
        maxValue: 1.5,
        assumptions:
          'Estimación de ejemplo inspirada en guías de accesibilidad; verifícala contra la normativa local vigente antes de usarla en decisiones reales.',
      }),
    },
    flags: {},
    iconId: 'table',
    usageNotes: [
      'El diámetro es la huella del tablero; las sillas se colocan fuera y no forman parte de la colisión de la mesa.',
    ],
  },
  {
    id: 'cat_table-round-4',
    group: 'table',
    label: 'Mesa redonda 4 plazas',
    description:
      'Mesa redonda de 110 cm de diámetro, el formato clásico de salón. Altura de 75 cm.',
    family: 'furniture',
    layer: 'furniture',
    tags: ['mobiliario', 'salón'],
    dimensions: { width: 1.1, depth: 1.1 },
    heightM: 0.75,
    interactionPoint: frontInteractionPoint({ width: 1.1, depth: 1.1 }),
    materials: [
      { id: 'laminate', label: 'Laminado', suggestedColor: '#e6d5b8' },
      { id: 'wood', label: 'Madera', suggestedColor: '#8b5a2b' },
    ],
    defaultMaterialId: 'laminate',
    parameters: {
      seats: estimatedSpec({
        label: 'Plazas',
        value: 4,
        unit: 'persons',
        minValue: 2,
        maxValue: 6,
        assumptions: 'Estimación de ejemplo para 110 cm de diámetro.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza de mesa',
        value: 300,
        unit: 's',
        minValue: 60,
        maxValue: 1800,
        assumptions:
          'Estimación de ejemplo en vacío; no representa la política de turnos del local.',
      }),
      accessibleClearance: estimatedSpec({
        label: 'Despeje accesible',
        value: 0.75,
        unit: 'm',
        minValue: 0.6,
        maxValue: 1.5,
        assumptions: 'Estimación de ejemplo de guías de accesibilidad; la normativa local manda.',
      }),
    },
    flags: {},
    iconId: 'table',
    usageNotes: [
      'El punto de interacción está delante de la mesa (lado del servidor); la FASE 08 lo usa para meseros, no para comensales.',
    ],
  },
  {
    id: 'cat_table-square-4',
    group: 'table',
    label: 'Mesa cuadrada 4 plazas',
    description:
      'Mesa cuadrada de 90 cm de lado para salón compacto; encaja en esquemas de 2 en fondo.',
    family: 'furniture',
    layer: 'furniture',
    tags: ['mobiliario', 'salón', 'compacta'],
    dimensions: { width: 0.9, depth: 0.9 },
    heightM: 0.75,
    interactionPoint: frontInteractionPoint({ width: 0.9, depth: 0.9 }),
    materials: [
      { id: 'laminate', label: 'Laminado', suggestedColor: '#e6d5b8' },
      { id: 'wood', label: 'Madera', suggestedColor: '#8b5a2b' },
    ],
    defaultMaterialId: 'laminate',
    parameters: {
      seats: estimatedSpec({
        label: 'Plazas',
        value: 4,
        unit: 'persons',
        minValue: 2,
        maxValue: 8,
        assumptions: 'Estimación de ejemplo: 8 es el máximo físico en 90 cm, sin confort.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza de mesa',
        value: 300,
        unit: 's',
        minValue: 60,
        maxValue: 1800,
        assumptions: 'Estimación de ejemplo en vacío.',
      }),
      accessibleClearance: estimatedSpec({
        label: 'Despeje accesible',
        value: 0.75,
        unit: 'm',
        minValue: 0.6,
        maxValue: 1.5,
        assumptions: 'Estimación de ejemplo de guías de accesibilidad.',
      }),
    },
    flags: {},
    iconId: 'table',
    usageNotes: [
      'La silla extra en esquina reduce el despeje: la FASE 07 lo comprueba al calcular rutas.',
    ],
  },
  {
    id: 'cat_table-rect-6',
    group: 'table',
    label: 'Mesa rectangular 6 plazas',
    description:
      'Mesa rectangular de 160 × 80 cm para grupos familiares; el estándar de comedor medio.',
    family: 'furniture',
    layer: 'furniture',
    tags: ['mobiliario', 'salón', 'grupo'],
    dimensions: { width: 1.6, depth: 0.8 },
    heightM: 0.75,
    interactionPoint: frontInteractionPoint({ width: 1.6, depth: 0.8 }),
    materials: [
      { id: 'laminate', label: 'Laminado', suggestedColor: '#e6d5b8' },
      { id: 'wood', label: 'Madera', suggestedColor: '#8b5a2b' },
    ],
    defaultMaterialId: 'wood',
    parameters: {
      seats: estimatedSpec({
        label: 'Plazas',
        value: 6,
        unit: 'persons',
        minValue: 4,
        maxValue: 10,
        assumptions:
          'Estimación de ejemplo: 2 por lateral largo + 1 por cabecera; 10 es hacinamiento.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza de mesa',
        value: 360,
        unit: 's',
        minValue: 60,
        maxValue: 1800,
        assumptions:
          'Estimación de ejemplo en vacío; más superficie, más tiempo que la redonda de 4.',
      }),
      accessibleClearance: estimatedSpec({
        label: 'Despeje accesible',
        value: 0.75,
        unit: 'm',
        minValue: 0.6,
        maxValue: 1.5,
        assumptions: 'Estimación de ejemplo de guías de accesibilidad.',
      }),
    },
    flags: {},
    iconId: 'table',
    usageNotes: ['El ancho de 80 cm no incluye el mantel caído; el editor dibuja solo el tablero.'],
  },
  {
    id: 'cat_table-vip-4',
    group: 'table',
    label: 'Mesa VIP 4 plazas',
    description:
      'Mesa VIP de 120 cm de diámetro con acabados premium; pensada para zona reservada con mayor despeje.',
    family: 'furniture',
    layer: 'furniture',
    tags: ['mobiliario', 'vip', 'reservado'],
    dimensions: { width: 1.2, depth: 1.2 },
    heightM: 0.78,
    interactionPoint: frontInteractionPoint({ width: 1.2, depth: 1.2 }),
    materials: [
      { id: 'marble', label: 'Mármol', suggestedColor: '#f2f0eb' },
      { id: 'wood', label: 'Madera noble', suggestedColor: '#5d4037' },
    ],
    defaultMaterialId: 'marble',
    parameters: {
      seats: estimatedSpec({
        label: 'Plazas',
        value: 4,
        unit: 'persons',
        minValue: 2,
        maxValue: 6,
        assumptions: 'Estimación de ejemplo para 120 cm de diámetro con servicio a la mesa.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza de mesa',
        value: 480,
        unit: 's',
        minValue: 120,
        maxValue: 3600,
        assumptions:
          'Estimación de ejemplo: incluye cristalería y montaje fino; no representa el servicio en sala (FASE 08).',
      }),
      accessibleClearance: estimatedSpec({
        label: 'Despeje accesible',
        value: 0.9,
        unit: 'm',
        minValue: 0.6,
        maxValue: 1.5,
        assumptions:
          'Estimación de ejemplo: la zona VIP suele diseñarse con más despeje que el salón general.',
      }),
    },
    flags: {},
    iconId: 'table',
    usageNotes: [
      'La condición VIP la da la zona (cat_zone-vip) y sus reglas de acceso, no la mesa en sí.',
    ],
  },
  {
    id: 'cat_chair-standard',
    group: 'chair',
    label: 'Silla estándar',
    description:
      'Silla de salón de 45 × 48 cm con respaldo; apila hasta 6 unidades. Sin parámetros: su ocupación la decide la simulación.',
    family: 'furniture',
    layer: 'furniture',
    tags: ['mobiliario', 'salón', 'asiento'],
    dimensions: { width: 0.45, depth: 0.48 },
    heightM: 0.85,
    interactionPoint: frontInteractionPoint({ width: 0.45, depth: 0.48 }),
    materials: [
      { id: 'wood', label: 'Madera', suggestedColor: '#8b5a2b' },
      { id: 'poly', label: 'Polipropileno', suggestedColor: '#eceff1' },
    ],
    defaultMaterialId: 'poly',
    parameters: {},
    flags: {},
    iconId: 'chair',
    usageNotes: [
      'La silla no tiene parámetros: sentarse y levantarse son eventos de FASE 08, con duraciones del motor, no del catálogo.',
    ],
  },
  {
    id: 'cat_chair-vip',
    group: 'chair',
    label: 'Silla VIP',
    description: 'Butaca tapizada para zona VIP, 50 × 55 cm; más ancha y con respaldo alto.',
    family: 'furniture',
    layer: 'furniture',
    tags: ['mobiliario', 'vip', 'asiento'],
    dimensions: { width: 0.5, depth: 0.55 },
    heightM: 0.95,
    interactionPoint: frontInteractionPoint({ width: 0.5, depth: 0.55 }),
    materials: [
      { id: 'velvet', label: 'Terciopelo', suggestedColor: '#5d4037' },
      { id: 'leather', label: 'Cuero', suggestedColor: '#6d4c41' },
    ],
    defaultMaterialId: 'velvet',
    parameters: {},
    flags: {},
    iconId: 'chair',
    usageNotes: [
      'La butaca NO bloquea el paso por sí misma: la huella de colisión la declara el editor al colocarla.',
    ],
  },
  {
    id: 'cat_counter-straight-180',
    group: 'counter',
    label: 'Mostrador recto 180 cm',
    description:
      'Mostrador de atención de 180 × 60 cm y 110 cm de alto: caja, recepción o display; frente de atención al público.',
    family: 'furniture',
    layer: 'furniture',
    tags: ['mobiliario', 'atención'],
    dimensions: { width: 1.8, depth: 0.6 },
    heightM: 1.1,
    interactionPoint: frontInteractionPoint({ width: 1.8, depth: 0.6 }),
    materials: [
      { id: 'laminate', label: 'Laminado', suggestedColor: '#e6d5b8' },
      { id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' },
    ],
    defaultMaterialId: 'laminate',
    parameters: {
      capacity: estimatedSpec({
        label: 'Puestos de atención',
        value: 2,
        unit: 'persons',
        minValue: 1,
        maxValue: 4,
        assumptions: 'Estimación de ejemplo: 2 cajeros por 1,8 m con POS compartido.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza de mostrador',
        value: 600,
        unit: 's',
        minValue: 180,
        maxValue: 3600,
        assumptions: 'Estimación de ejemplo al cierre; no incluye el recuento de caja (FASE 08).',
      }),
    },
    flags: {},
    iconId: 'counter',
    usageNotes: [
      'El punto de interacción está en el lado del cliente; el personal trabaja por detrás (−y) y la FASE 08 colocará ambos lados.',
    ],
  },
  {
    id: 'cat_counter-curved-240',
    group: 'counter',
    label: 'Mostrador curvo 240 cm',
    description:
      'Mostrador curvo de 240 × 70 cm con esquinas frontal en chaflán (huella poligonal); ideal para recepción con flujo lateral.',
    family: 'furniture',
    layer: 'furniture',
    tags: ['mobiliario', 'atención', 'recepción'],
    dimensions: { width: 2.4, depth: 0.7 },
    heightM: 1.1,
    footprint: [
      { x: -1.2, y: -0.35 },
      { x: 1.2, y: -0.35 },
      { x: 1.2, y: 0.1 },
      { x: 0.95, y: 0.35 },
      { x: -0.95, y: 0.35 },
      { x: -1.2, y: 0.1 },
    ],
    interactionPoint: frontInteractionPoint({ width: 2.4, depth: 0.7 }),
    materials: [
      { id: 'solid-surface', label: 'Superficie sólida', suggestedColor: '#f5f5f0' },
      { id: 'laminate', label: 'Laminado', suggestedColor: '#e6d5b8' },
    ],
    defaultMaterialId: 'solid-surface',
    parameters: {
      capacity: estimatedSpec({
        label: 'Puestos de atención',
        value: 2,
        unit: 'persons',
        minValue: 1,
        maxValue: 4,
        assumptions: 'Estimación de ejemplo para 2,4 m de frente curvo.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza de mostrador',
        value: 720,
        unit: 's',
        minValue: 180,
        maxValue: 3600,
        assumptions: 'Estimación de ejemplo: algo más de superficie que el recto de 180 cm.',
      }),
    },
    flags: {},
    iconId: 'counter',
    usageNotes: [
      'La huella poligonal recorta las esquinas frontales: la colisión usa ese polígono, no el rectángulo envolvente.',
    ],
  },
  {
    id: 'cat_bar-counter-240',
    group: 'bar',
    label: 'Barra de bar 240 cm',
    description:
      'Barra de bar de 240 × 60 cm con frente de trabajo; taburetes al frente (los coloca el editor) y estación de coctelería detrás.',
    family: 'furniture',
    layer: 'furniture',
    tags: ['mobiliario', 'barra', 'bar'],
    dimensions: { width: 2.4, depth: 0.6 },
    heightM: 1.1,
    interactionPoint: frontInteractionPoint({ width: 2.4, depth: 0.6 }),
    materials: [
      { id: 'wood', label: 'Madera lacada', suggestedColor: '#5d4037' },
      { id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' },
    ],
    defaultMaterialId: 'wood',
    parameters: {
      capacity: estimatedSpec({
        label: 'Barmans simultáneos',
        value: 2,
        unit: 'persons',
        minValue: 1,
        maxValue: 4,
        assumptions: 'Estimación de ejemplo: 2 barmans por 2,4 m con estación detrás.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza de barra',
        value: 900,
        unit: 's',
        minValue: 300,
        maxValue: 3600,
        assumptions:
          'Estimación de ejemplo al cierre: barra + fregadero de goteo; no incluye lavar cristalería (va con el fregadero/lavavajillas).',
      }),
    },
    flags: {},
    iconId: 'bar',
    usageNotes: [
      'La barra no declara bebidas ni recetas: el inventario y las recetas de coctelería viven en FASE 05.',
    ],
  },
  {
    id: 'cat_station-prep-180',
    group: 'station',
    label: 'Estación de preparación 180 cm',
    description:
      'Mesa de preparación de 180 × 70 cm y 95 cm de alto, con puestos para dos cocineros simultáneos y espacio de corte a ambos lados.',
    family: 'station',
    layer: 'furniture',
    tags: ['estación', 'cocina', 'preparación'],
    dimensions: { width: 1.8, depth: 0.7 },
    heightM: 0.95,
    interactionPoint: frontInteractionPoint({ width: 1.8, depth: 0.7 }),
    materials: [
      { id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' },
      { id: 'laminate', label: 'Laminado', suggestedColor: '#e6d5b8' },
    ],
    defaultMaterialId: 'inox',
    parameters: {
      capacity: estimatedSpec({
        label: 'Cocineros simultáneos',
        value: 2,
        unit: 'persons',
        minValue: 1,
        maxValue: 4,
        assumptions:
          'Estimación de ejemplo: 2 puestos de corte en 1,8 m con tablas independientes.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza de estación',
        value: 420,
        unit: 's',
        minValue: 120,
        maxValue: 1800,
        assumptions:
          'Estimación de ejemplo: sanitizar tabla y superficie; no representa la limpieza profunda programada.',
      }),
    },
    flags: {},
    iconId: 'station',
    usageNotes: [
      'La estación NO corta ni cocina: las tareas de preparación (con sus recursos) se definen en FASE 05/06.',
    ],
  },
  {
    id: 'cat_station-pass-120',
    group: 'station',
    label: 'Ventana de pass 120 cm',
    description:
      'Mesa de pass/expedición de 120 × 60 cm entre cocina y salón: punto de entrega de pedidos listos.',
    family: 'station',
    layer: 'furniture',
    tags: ['estación', 'pass', 'expedición'],
    dimensions: { width: 1.2, depth: 0.6 },
    heightM: 1,
    interactionPoint: frontInteractionPoint({ width: 1.2, depth: 0.6 }),
    materials: [
      { id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' },
      { id: 'laminate', label: 'Laminado', suggestedColor: '#e6d5b8' },
    ],
    defaultMaterialId: 'inox',
    parameters: {
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza de pass',
        value: 300,
        unit: 's',
        minValue: 60,
        maxValue: 1800,
        assumptions:
          'Estimación de ejemplo al cierre del servicio; no representa el pulido de cámara (FASE 10).',
      }),
    },
    flags: {},
    iconId: 'station',
    usageNotes: [
      'El pass no entrega pedidos por sí solo: la tarea de entrega y su duración viven en FASE 05/08.',
    ],
  },
  {
    id: 'cat_station-host-50',
    group: 'station',
    label: 'Podio de anfitrión 50 cm',
    description:
      'Podio de anfitrión de 50 × 40 cm y 110 cm de alto, con libro de reservas; el punto fijo donde se reciben y derivan los clientes.',
    family: 'station',
    layer: 'furniture',
    tags: ['estación', 'anfitrión', 'recepción'],
    dimensions: { width: 0.5, depth: 0.4 },
    heightM: 1.1,
    interactionPoint: frontInteractionPoint({ width: 0.5, depth: 0.4 }),
    materials: [
      { id: 'wood', label: 'Madera', suggestedColor: '#8b5a2b' },
      { id: 'laminate', label: 'Laminado', suggestedColor: '#e6d5b8' },
    ],
    defaultMaterialId: 'wood',
    parameters: {},
    flags: {},
    iconId: 'station',
    usageNotes: [
      'El podio no modela la espera de clientes: la cola de recepción y su política viven en FASE 08.',
    ],
  },
  {
    id: 'cat_tray-stack-40',
    group: 'tray',
    label: 'Pila de bandejas (40 cm)',
    description:
      'Pila de bandejas de servicio de 40 × 30 cm y 15 cm de alto apiladas; el stock disponible se ajusta al instanciar.',
    family: 'furniture',
    layer: 'furniture',
    tags: ['mobiliario', 'bandejas', 'servicio'],
    dimensions: { width: 0.4, depth: 0.3 },
    heightM: 0.15,
    interactionPoint: frontInteractionPoint({ width: 0.4, depth: 0.3 }),
    materials: [
      { id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' },
      { id: 'poly', label: 'Polipropileno', suggestedColor: '#eceff1' },
    ],
    defaultMaterialId: 'poly',
    parameters: {
      capacity: estimatedSpec({
        label: 'Bandejas en pila',
        value: 30,
        unit: 'unit',
        minValue: 10,
        maxValue: 200,
        assumptions:
          'Estimación de ejemplo: 30 bandejas en 15 cm de altura; el stock real se calibra por local.',
      }),
    },
    flags: {},
    iconId: 'tray',
    usageNotes: [
      'La pila es un punto de recogida: cuánto tarda un agente en tomar una bandeja lo define la tarea de FASE 05, no este preset.',
    ],
  },
]
