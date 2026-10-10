import type { CatalogObjectPreset } from '../preset'
import { estimatedSpec, flagSpec, frontInteractionPoint } from '../preset'

/**
 * Presets de equipo de cocina y servicio (prompt 02.2). Un preset por cada
 * EquipmentKind de @lba/domain (12/12), de modo que la instancia produce
 * tanto el WorldObject (geometría) como el Equipment (tiempos/temperaturas)
 * de un escenario.
 *
 * HONESTIDAD DE LOS VALORES (docs/guia/02): todos son ESTIMACIONES DE
 * EJEMPLO (sourceType "estimated", confianza "low"). El calentamiento de una
 * plancha concreta depende de potencia, masa térmica, voltaje y carga; no
 * existe una duración universal. La temperatura de superficie NO es la
 * temperatura interior del alimento; la simulación no certifica seguridad
 * alimentaria ni sustituye termómetro, manual o normativa local. Los
 * usageNotes de cada preset lo repiten donde importa.
 */

export const EQUIPMENT_PRESETS: CatalogObjectPreset[] = [
  {
    id: 'cat_range-4burner-120',
    group: 'range',
    label: 'Cocina 4 hornillas 120 cm',
    description:
      'Cocina abierta de 4 hornillas sobre base de 120 × 90 cm; el caballete clásico de una línea de cocina.',
    family: 'equipment',
    layer: 'equipment',
    tags: ['equipo', 'cocina', 'fuego'],
    dimensions: { width: 1.2, depth: 0.9 },
    heightM: 0.95,
    interactionPoint: frontInteractionPoint({ width: 1.2, depth: 0.9 }),
    materials: [{ id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' }],
    defaultMaterialId: 'inox',
    parameters: {
      powerOnSeconds: estimatedSpec({
        label: 'Encendido',
        value: 20,
        unit: 's',
        minValue: 5,
        maxValue: 120,
        assumptions:
          'Estimación de ejemplo: encendido eléctrico por chispa; no incluye revisión visual.',
      }),
      warmupSeconds: estimatedSpec({
        label: 'Hornillas a temperatura',
        value: 300,
        unit: 's',
        minValue: 60,
        maxValue: 900,
        assumptions:
          'Estimación de ejemplo para llevar una olla de agua a hervor; el tiempo real depende de potencia, material y volumen.',
      }),
      capacity: estimatedSpec({
        label: 'Ollas simultáneas',
        value: 4,
        unit: 'unit',
        minValue: 1,
        maxValue: 8,
        assumptions: 'Estimación de ejemplo: 4 hornillas; 8 contaría ollas compartiendo hornilla.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza',
        value: 900,
        unit: 's',
        minValue: 300,
        maxValue: 3600,
        assumptions:
          'Estimación de ejemplo: rejillas y plaque al cierre; no incluye desmonte de inyectores.',
      }),
    },
    flags: {},
    iconId: 'range',
    equipmentKind: 'range',
    usageNotes: [
      'La cocina no hierve nada por sí sola: las recetas (FASE 05) deciden qué se cocina y durante cuánto tiempo en cada hornilla.',
    ],
  },
  {
    id: 'cat_griddle-120',
    group: 'griddle',
    label: 'Plancha 120 cm',
    description:
      'Plancha de superficie plana de 120 × 70 cm para cocina a la vista; el equipo de mayor uso en la línea caliente.',
    family: 'equipment',
    layer: 'equipment',
    tags: ['equipo', 'cocina', 'línea caliente'],
    dimensions: { width: 1.2, depth: 0.7 },
    heightM: 0.95,
    interactionPoint: frontInteractionPoint({ width: 1.2, depth: 0.7 }),
    materials: [{ id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' }],
    defaultMaterialId: 'inox',
    parameters: {
      powerOnSeconds: estimatedSpec({
        label: 'Encendido',
        value: 30,
        unit: 's',
        minValue: 10,
        maxValue: 300,
        assumptions:
          'Estimación de ejemplo: arranque y comprobación; no representa el calentamiento completo (eso es warmupSeconds).',
      }),
      targetTemperatureC: estimatedSpec({
        label: 'Temperatura objetivo',
        value: 220,
        unit: 'C',
        minValue: 150,
        maxValue: 300,
        assumptions:
          'Estimación de ejemplo de superficie de plancha en servicio; NO es la temperatura interior del alimento ni un criterio de seguridad alimentaria.',
      }),
      warmupSeconds: estimatedSpec({
        label: 'Calentamiento',
        value: 900,
        unit: 's',
        minValue: 300,
        maxValue: 3600,
        assumptions:
          'Estimación de ejemplo: depende de potencia, masa térmica, voltaje/combustible, ambiente y carga; no existe duración universal.',
      }),
      heatRecoverySeconds: estimatedSpec({
        label: 'Recuperación térmica',
        value: 45,
        unit: 's',
        minValue: 10,
        maxValue: 300,
        assumptions: 'Estimación de ejemplo tras una carga fría típica; una sobrecarga lo alarga.',
      }),
      capacity: estimatedSpec({
        label: 'Raciones simultáneas',
        value: 4,
        unit: 'unit',
        minValue: 1,
        maxValue: 12,
        assumptions:
          'Estimación de ejemplo: 4 zonas de cocción cómodas en 1,2 m; 12 sería amontonar.',
      }),
      cooldownSeconds: estimatedSpec({
        label: 'Enfriamiento',
        value: 1800,
        unit: 's',
        minValue: 300,
        maxValue: 7200,
        assumptions:
          'Estimación de ejemplo: enfriar hasta manipulación segura; no representa el ciclo térmico completo del acero.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza',
        value: 600,
        unit: 's',
        minValue: 180,
        maxValue: 3600,
        assumptions:
          'Estimación de ejemplo: raspado y planchado en frío; no incluye la puesta a punto de la noche.',
      }),
    },
    flags: {},
    iconId: 'griddle',
    equipmentKind: 'griddle',
    usageNotes: [
      'La temperatura de superficie NO certifica la cocción del alimento: la simulación no es certificadora ni sustituye un termómetro.',
    ],
  },
  {
    id: 'cat_fryer-2basket-80',
    group: 'fryer',
    label: 'Freidora 2 canastas 80 cm',
    description:
      'Freidora de doble canasta sobre 80 × 70 cm; el ciclo de fritura se calibra por tipo de alimento.',
    family: 'equipment',
    layer: 'equipment',
    tags: ['equipo', 'cocina', 'fritura'],
    dimensions: { width: 0.8, depth: 0.7 },
    heightM: 0.95,
    interactionPoint: frontInteractionPoint({ width: 0.8, depth: 0.7 }),
    materials: [{ id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' }],
    defaultMaterialId: 'inox',
    parameters: {
      targetTemperatureC: estimatedSpec({
        label: 'Temperatura objetivo',
        value: 180,
        unit: 'C',
        minValue: 140,
        maxValue: 200,
        assumptions:
          'Estimación de ejemplo de aceite en servicio; NO es un criterio de seguridad alimentaria ni de vida útil del aceite.',
      }),
      warmupSeconds: estimatedSpec({
        label: 'Calentamiento',
        value: 720,
        unit: 's',
        minValue: 300,
        maxValue: 1800,
        assumptions:
          'Estimación de ejemplo: de ambiente a 180 °C con volumen de cuba típico; más aceite, más tiempo.',
      }),
      capacity: estimatedSpec({
        label: 'Canastas simultáneas',
        value: 2,
        unit: 'unit',
        minValue: 1,
        maxValue: 6,
        assumptions:
          'Estimación de ejemplo: 2 canastas físicas; 6 exigiría canastas extra compartiendo la misma cuba.',
      }),
      cycleSeconds: estimatedSpec({
        label: 'Ciclo de fritura',
        value: 480,
        unit: 's',
        minValue: 180,
        maxValue: 900,
        assumptions:
          'Estimación de ejemplo de ciclo medio (patatas congeladas); el tiempo real lo pone la receta de FASE 05.',
      }),
      heatRecoverySeconds: estimatedSpec({
        label: 'Recuperación térmica',
        value: 60,
        unit: 's',
        minValue: 20,
        maxValue: 300,
        assumptions:
          'Estimación de ejemplo tras cargar una canasta fría; una sobrecarga lo dispara.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza',
        value: 900,
        unit: 's',
        minValue: 300,
        maxValue: 3600,
        assumptions:
          'Estimación de ejemplo: filtrado de aceite al cierre; no incluye el cambio completo de aceite.',
      }),
    },
    flags: {},
    iconId: 'fryer',
    equipmentKind: 'fryer',
    usageNotes: [
      'La freidora no fríe sola: cada alimento trae su propia duración en la receta (FASE 05).',
    ],
  },
  {
    id: 'cat_oven-deck-90',
    group: 'oven',
    label: 'Horno de cámara 90 cm',
    description:
      'Horno de cámara (deck) de 90 × 90 cm y 140 cm de alto para panadería y bandejas; la duración de horneado la fija cada receta.',
    family: 'equipment',
    layer: 'equipment',
    tags: ['equipo', 'cocina', 'horneado'],
    dimensions: { width: 0.9, depth: 0.9 },
    heightM: 1.4,
    interactionPoint: frontInteractionPoint({ width: 0.9, depth: 0.9 }),
    materials: [{ id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' }],
    defaultMaterialId: 'inox',
    parameters: {
      warmupSeconds: estimatedSpec({
        label: 'Calentamiento',
        value: 1200,
        unit: 's',
        minValue: 600,
        maxValue: 3600,
        assumptions:
          'Estimación de ejemplo: cámara aislada a temperatura de trabajo; depende del aislamiento real del modelo.',
      }),
      targetTemperatureC: estimatedSpec({
        label: 'Temperatura objetivo',
        value: 250,
        unit: 'C',
        minValue: 180,
        maxValue: 300,
        assumptions:
          'Estimación de ejemplo para panadería; NO representa la temperatura del centro de la pieza.',
      }),
      heatRecoverySeconds: estimatedSpec({
        label: 'Recuperación térmica',
        value: 90,
        unit: 's',
        minValue: 30,
        maxValue: 300,
        assumptions: 'Estimación de ejemplo tras abrir la puerta 10 s; abrir 30 s lo alarga mucho.',
      }),
      capacity: estimatedSpec({
        label: 'Bandejas simultáneas',
        value: 3,
        unit: 'unit',
        minValue: 1,
        maxValue: 6,
        assumptions: 'Estimación de ejemplo: 3 niveles en una cámara de 90 cm.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza',
        value: 1200,
        unit: 's',
        minValue: 300,
        maxValue: 3600,
        assumptions:
          'Estimación de ejemplo: cámaras y bandejas en frío; no incluye desincrustación programada.',
      }),
    },
    flags: {},
    iconId: 'oven',
    equipmentKind: 'oven',
    usageNotes: [
      'El horno NO define el tiempo de horneado de nada: cada receta de FASE 05 trae su propia duración por lote.',
    ],
  },
  {
    id: 'cat_pizza-oven-wood-120',
    group: 'pizza-oven',
    label: 'Horno de pizza (leña) 120 cm',
    description:
      'Horno de leña de bóveda de 120 × 120 cm y 160 cm de alto para pizza a la vista; el ícono del local si hay pizzería.',
    family: 'equipment',
    layer: 'equipment',
    tags: ['equipo', 'cocina', 'pizzería'],
    dimensions: { width: 1.2, depth: 1.2 },
    heightM: 1.6,
    interactionPoint: frontInteractionPoint({ width: 1.2, depth: 1.2 }),
    materials: [
      { id: 'brick', label: 'Refractario visto', suggestedColor: '#b5563c' },
      { id: 'stucco', label: 'Estuco refractario', suggestedColor: '#d9c8a9' },
    ],
    defaultMaterialId: 'brick',
    parameters: {
      warmupSeconds: estimatedSpec({
        label: 'Calentamiento de bóveda',
        value: 2700,
        unit: 's',
        minValue: 1800,
        maxValue: 5400,
        assumptions:
          'Estimación de ejemplo: 45 min para una bóveda de leña en equilibrio; la masa térmica real manda.',
      }),
      targetTemperatureC: estimatedSpec({
        label: 'Temperatura de solera',
        value: 400,
        unit: 'C',
        minValue: 350,
        maxValue: 450,
        assumptions:
          'Estimación de ejemplo de solera en servicio de pizza; NO es la temperatura del centro de la pizza.',
      }),
      bakeSeconds: estimatedSpec({
        label: 'Horneado de pizza',
        value: 90,
        unit: 's',
        minValue: 60,
        maxValue: 180,
        assumptions:
          'Estimación de ejemplo para pizza napolitana fina a 400 °C; estilos gruesos (FASE 05) traen su propia duración.',
      }),
      capacity: estimatedSpec({
        label: 'Pizzas simultáneas',
        value: 2,
        unit: 'unit',
        minValue: 1,
        maxValue: 4,
        assumptions: 'Estimación de ejemplo: 2 palas simultáneas en boca de 1,2 m.',
      }),
      heatRecoverySeconds: estimatedSpec({
        label: 'Recuperación de solera',
        value: 120,
        unit: 's',
        minValue: 60,
        maxValue: 300,
        assumptions: 'Estimación de ejemplo tras entrar una pizza fría.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza',
        value: 1800,
        unit: 's',
        minValue: 600,
        maxValue: 7200,
        assumptions:
          'Estimación de ejemplo: barrido de ceniza y solera al cierre; no incluye reconstrucción de bóveda.',
      }),
    },
    flags: {},
    iconId: 'pizza-oven',
    equipmentKind: 'pizza_oven',
    usageNotes: [
      'La solera a 400 °C NO certifica la cocción: la simulación no reemplaza manual, termómetro ni normativa local.',
    ],
  },
  {
    id: 'cat_fridge-upright-70',
    group: 'fridge',
    label: 'Nevera vertical 70 cm',
    description:
      'Armario refrigerado vertical de 70 × 70 cm y 180 cm de alto para conservación de frescos con acceso frontal.',
    family: 'equipment',
    layer: 'equipment',
    tags: ['equipo', 'frío', 'conservación'],
    dimensions: { width: 0.7, depth: 0.7 },
    heightM: 1.8,
    interactionPoint: frontInteractionPoint({ width: 0.7, depth: 0.7 }),
    materials: [{ id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' }],
    defaultMaterialId: 'inox',
    parameters: {
      targetTemperatureC: estimatedSpec({
        label: 'Temperatura de conservación',
        value: 4,
        unit: 'C',
        minValue: 2,
        maxValue: 8,
        assumptions:
          'Estimación de ejemplo de la banda típica de refrigeración; NO sustituye la normativa local de seguridad alimentaria ni un registro real de temperaturas.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza',
        value: 1800,
        unit: 's',
        minValue: 600,
        maxValue: 7200,
        assumptions:
          'Estimación de ejemplo: estantes en frío al cierre semanal; no incluye el deshielo.',
      }),
    },
    flags: {},
    iconId: 'fridge',
    equipmentKind: 'fridge',
    usageNotes: [
      'La nevera no guarda nada por sí sola: el inventario (FASE 05) decide qué hay dentro y en qué cantidad.',
    ],
  },
  {
    id: 'cat_freezer-chest-140',
    group: 'freezer',
    label: 'Congelador tipo arca 140 cm',
    description:
      'Congelador de tapa basculante de 140 × 70 cm y 90 cm de alto para congelados a −20 °C; la altura de trabajo es la de la tapa.',
    family: 'equipment',
    layer: 'equipment',
    tags: ['equipo', 'frío', 'congelación'],
    dimensions: { width: 1.4, depth: 0.7 },
    heightM: 0.9,
    interactionPoint: frontInteractionPoint({ width: 1.4, depth: 0.7 }),
    materials: [{ id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' }],
    defaultMaterialId: 'inox',
    parameters: {
      targetTemperatureC: estimatedSpec({
        label: 'Temperatura de congelación',
        value: -20,
        unit: 'C',
        minValue: -25,
        maxValue: -15,
        assumptions:
          'Estimación de ejemplo de la banda típica; NO certifica la cadena de frío: la simulación no es certificadora.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza',
        value: 1800,
        unit: 's',
        minValue: 600,
        maxValue: 7200,
        assumptions:
          'Estimación de ejemplo con el arca vacía y deshielada; no representa el deshielo en sí.',
      }),
    },
    flags: {},
    iconId: 'freezer',
    equipmentKind: 'freezer',
    usageNotes: [
      'La apertura de la tapa no se simula en FASE 02: la pérdida térmica por apertura llega con el motor (FASE 04) si el diseño la exige.',
    ],
  },
  {
    id: 'cat_blender-counter-40',
    group: 'blender',
    label: 'Batidora de mostrador 40 cm',
    description:
      'Batidora de vasos para coctelería y smoothies sobre 40 × 40 cm; necesita vaso libre para arrancar cada ciclo.',
    family: 'equipment',
    layer: 'equipment',
    tags: ['equipo', 'barra', 'batido'],
    dimensions: { width: 0.4, depth: 0.4 },
    heightM: 0.55,
    interactionPoint: frontInteractionPoint({ width: 0.4, depth: 0.4 }),
    materials: [{ id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' }],
    defaultMaterialId: 'inox',
    parameters: {
      startupSeconds: estimatedSpec({
        label: 'Arranque',
        value: 5,
        unit: 's',
        minValue: 2,
        maxValue: 30,
        assumptions:
          'Estimación de ejemplo: colocación del vaso y arranque del motor; no incluye dosificar ingredientes.',
      }),
      cycleSeconds: estimatedSpec({
        label: 'Ciclo de batido',
        value: 60,
        unit: 's',
        minValue: 20,
        maxValue: 300,
        assumptions: 'Estimación de ejemplo para smoothie medio; hielo duro lo alarga.',
      }),
      capacity: estimatedSpec({
        label: 'Lotes por ciclo (maxBatchUnits)',
        value: 2,
        unit: 'unit',
        minValue: 1,
        maxValue: 4,
        assumptions:
          'Estimación de ejemplo: 2 vasos por ciclo en vaso doble; la receta (FASE 05) define qué va dentro.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza',
        value: 120,
        unit: 's',
        minValue: 60,
        maxValue: 600,
        assumptions:
          'Estimación de ejemplo: enjuague entre usos; la limpieza profunda del vaso es otra tarea.',
      }),
    },
    flags: {
      requiresFreeContainer: flagSpec({
        label: 'Requiere vaso libre',
        value: true,
        note: 'El ciclo no arranca sin un vaso libre disponible; el motor lo verifica como precondición (FASE 04).',
      }),
    },
    iconId: 'blender',
    equipmentKind: 'blender',
    usageNotes: [
      'La batidora no mezcla recetas: solo aporta el ciclo mecánico; qué se mezcla y en qué orden viven en FASE 05.',
    ],
  },
  {
    id: 'cat_sink-double-140',
    group: 'sink',
    label: 'Fregadero doble 140 cm',
    description:
      'Fregadero de dos cubas de 140 × 60 cm con escurridor lateral; el punto de lavado manual de la zona de dishwashing.',
    family: 'equipment',
    layer: 'equipment',
    tags: ['equipo', 'lavado', 'cocina'],
    dimensions: { width: 1.4, depth: 0.6 },
    heightM: 0.95,
    interactionPoint: frontInteractionPoint({ width: 1.4, depth: 0.6 }),
    materials: [{ id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' }],
    defaultMaterialId: 'inox',
    parameters: {
      capacity: estimatedSpec({
        label: 'Vajilla simultánea en cubas',
        value: 20,
        unit: 'unit',
        minValue: 4,
        maxValue: 100,
        assumptions:
          'Estimación de ejemplo: piezas por tanda de lavado manual; el stock real de vajilla es inventario (FASE 05).',
      }),
      washSeconds: estimatedSpec({
        label: 'Lavado manual',
        value: 240,
        unit: 's',
        minValue: 60,
        maxValue: 3600,
        assumptions:
          'Estimación de ejemplo por tanda típica; no representa la normativa local de temperaturas de lavado.',
      }),
      drySeconds: estimatedSpec({
        label: 'Escurrido',
        value: 1800,
        unit: 's',
        minValue: 600,
        maxValue: 7200,
        assumptions:
          'Estimación de ejemplo al aire en escurridor; el motor lo modela como bloqueo del puesto, no como trabajo.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza de cubas',
        value: 600,
        unit: 's',
        minValue: 180,
        maxValue: 3600,
        assumptions: 'Estimación de ejemplo al cierre; no incluye desatascar.',
      }),
    },
    flags: {},
    iconId: 'sink',
    equipmentKind: 'sink',
    usageNotes: [
      'El fregadero no deshace tareas: consumir su capacidad de tanda es lo que impide lavar dos tandas a la vez.',
    ],
  },
  {
    id: 'cat_dishwasher-60',
    group: 'dishwasher',
    label: 'Lavavajillas 60 cm',
    description:
      'Lavavajillas de carga frontal de 60 × 60 cm y 85 cm de alto (bajo mostrador); ciclos automáticos con cola propia.',
    family: 'equipment',
    layer: 'equipment',
    tags: ['equipo', 'lavado', 'automático'],
    dimensions: { width: 0.6, depth: 0.6 },
    heightM: 0.85,
    interactionPoint: frontInteractionPoint({ width: 0.6, depth: 0.6 }),
    materials: [{ id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' }],
    defaultMaterialId: 'inox',
    parameters: {
      capacity: estimatedSpec({
        label: 'Racks por ciclo',
        value: 20,
        unit: 'unit',
        minValue: 4,
        maxValue: 200,
        assumptions:
          'Estimación de ejemplo: piezas por ciclo estándar; el modelo concreto del local manda.',
      }),
      washSeconds: estimatedSpec({
        label: 'Ciclo de lavado',
        value: 180,
        unit: 's',
        minValue: 120,
        maxValue: 600,
        assumptions:
          'Estimación de ejemplo para ciclo corto comercial; ciclos largos lo multiplican.',
      }),
      drySeconds: estimatedSpec({
        label: 'Secado',
        value: 1200,
        unit: 's',
        minValue: 600,
        maxValue: 3600,
        assumptions: 'Estimación de ejemplo: secado térmico interno antes de abrir la puerta.',
      }),
      cleaningSeconds: estimatedSpec({
        label: 'Limpieza del equipo',
        value: 900,
        unit: 's',
        minValue: 300,
        maxValue: 3600,
        assumptions:
          'Estimación de ejemplo: filtros al cierre; no incluye desincrustación química programada.',
      }),
    },
    flags: {},
    iconId: 'dishwasher',
    equipmentKind: 'dishwasher',
    usageNotes: [
      'El lavavajillas bloquea su puerta durante el ciclo: el motor (FASE 04) lo modela como equipo "in_use".',
    ],
  },
  {
    id: 'cat_ticket-printer-25',
    group: 'ticket-printer',
    label: 'Impresora de tickets 25 cm',
    description:
      'Impresora térmica de comandas de 25 × 25 cm; imprime el ticket de cocina en el pass y el de caja en el mostrador.',
    family: 'equipment',
    layer: 'equipment',
    tags: ['equipo', 'comandas', 'pass'],
    dimensions: { width: 0.25, depth: 0.25 },
    heightM: 0.2,
    interactionPoint: frontInteractionPoint({ width: 0.25, depth: 0.25 }),
    materials: [{ id: 'poly', label: 'Plástico ABS', suggestedColor: '#eceff1' }],
    defaultMaterialId: 'poly',
    parameters: {
      ticketPrintSeconds: estimatedSpec({
        label: 'Impresión de ticket',
        value: 4,
        unit: 's',
        minValue: 1,
        maxValue: 30,
        assumptions:
          'Estimación de ejemplo para ticket térmico corto; una comanda larga lo alarga.',
      }),
      capacity: estimatedSpec({
        label: 'Cola de impresión (queueCapacity)',
        value: 50,
        unit: 'unit',
        minValue: 10,
        maxValue: 500,
        assumptions:
          'Estimación de ejemplo: comandas en espera antes de rechazar; el motor (FASE 04) la usa como tope de cola.',
      }),
    },
    flags: {
      paperAvailable: flagSpec({
        label: 'Papel disponible',
        value: true,
        note: 'Cierto tras cada recarga; el motor lo verifica como precondición de impresión (FASE 04).',
      }),
    },
    iconId: 'ticket-printer',
    equipmentKind: 'ticket_printer',
    usageNotes: [
      'La impresora no crea pedidos: los pedidos nacen en el POS (FASE 08); esta solo emite la comanda física.',
    ],
  },
  {
    id: 'cat_pos-terminal-30',
    group: 'pos',
    label: 'Terminal POS 30 cm',
    description:
      'Punto de venta de 30 × 25 cm con pantalla; el origen de los pedidos y el cierre de caja.',
    family: 'equipment',
    layer: 'equipment',
    tags: ['equipo', 'caja', 'pedidos'],
    dimensions: { width: 0.3, depth: 0.25 },
    heightM: 0.35,
    interactionPoint: frontInteractionPoint({ width: 0.3, depth: 0.25 }),
    materials: [
      { id: 'poly', label: 'Plástico ABS', suggestedColor: '#eceff1' },
      { id: 'inox', label: 'Inoxidable', suggestedColor: '#c9ced6' },
    ],
    defaultMaterialId: 'poly',
    parameters: {
      cycleSeconds: estimatedSpec({
        label: 'Captura de pedido',
        value: 45,
        unit: 's',
        minValue: 15,
        maxValue: 300,
        assumptions:
          'Estimación de ejemplo: anotar y cobrar un pedido medio en pantalla; menús largos lo alargan.',
      }),
      capacity: estimatedSpec({
        label: 'Operadores simultáneos',
        value: 1,
        unit: 'persons',
        minValue: 1,
        maxValue: 3,
        assumptions:
          'Estimación de ejemplo: un cajero por terminal; 3 exigiría modo compartido poco realista.',
      }),
    },
    flags: {},
    iconId: 'pos',
    equipmentKind: 'pos',
    usageNotes: [
      'El POS no cobra por sí solo: el cobro es una tarea de FASE 08; aquí solo se declara su duración base.',
    ],
  },
]
