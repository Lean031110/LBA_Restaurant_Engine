import type { CatalogZonePreset } from '../preset'
import { estimatedSpec } from '../preset'

/**
 * Presets de zonas funcionales (prompt 02.2): uno por cada categoría de
 * `ZoneCategorySchema` de @lba/domain (11/11), de modo que el editor puede
 * crear cualquier zona del contrato desde el catálogo.
 *
 * Convenios del grupo:
 * - `suggestedSize` es el rectángulo inicial que dibuja el editor; el
 *   usuario lo ajusta después. No es un mínimo normativo.
 * - `defaultCapacity` usa la unidad "persons" (personas simultáneas) y es
 *   editable: es una estimación de ocupación, no un aforo certificado.
 * - `allowedRoles` sigue el contrato del dominio: vacío = sin restricción
 *   declarada (no "prohibido el paso").
 */

export const ZONE_PRESETS: CatalogZonePreset[] = [
  {
    id: 'cat_zone-kitchen',
    category: 'kitchen',
    label: 'Zona de cocina',
    description:
      'Área de producción caliente y fría; contiene la línea de cocina, la plancha y los hornos. Acceso restringido a personal.',
    tags: ['zona', 'cocina', 'staff'],
    suggestedSize: { width: 6, depth: 4 },
    defaultCapacity: estimatedSpec({
      label: 'Ocupación simultánea',
      value: 4,
      unit: 'persons',
      minValue: 1,
      maxValue: 20,
      assumptions: 'Estimación de ejemplo para una línea de 6 × 4 m con 4 puestos de trabajo.',
    }),
    allowedRoles: ['cook', 'staff'],
    accessRules: [
      'Solo personal autorizado; se entra por la puerta de servicio, nunca cruzando el salón.',
      'Puertas batientes con ambas manos libres: no se atraviesa cargando sin visibilidad.',
    ],
    iconId: 'zone',
    usageNotes: [
      'La capacidad de la zona NO limita los equipos que caben: la colocación y la congestión las calcula FASE 07.',
    ],
  },
  {
    id: 'cat_zone-dining',
    category: 'dining',
    label: 'Zona de comedor',
    description:
      'Salón general de mesas; el área que ve el cliente y donde se concentra el servicio de sala.',
    tags: ['zona', 'salón', 'clientes'],
    suggestedSize: { width: 8, depth: 6 },
    defaultCapacity: estimatedSpec({
      label: 'Ocupación simultánea',
      value: 24,
      unit: 'persons',
      minValue: 1,
      maxValue: 200,
      assumptions: 'Estimación de ejemplo para 8 × 6 m con mesas de 4: unas 6 mesas.',
    }),
    allowedRoles: [],
    accessRules: [
      'Acceso libre para clientes; los pasillos entre mesas se resuelven al colocarlas (FASE 07 verifica 0,75 m).',
      'El personal cruza el salón solo por los pasillos, nunca entre mesas pegadas.',
    ],
    iconId: 'zone',
    usageNotes: [
      'El aforo real es un dato del local (licencia): la capacidad aquí es estimación de diseño, no un certificado.',
    ],
  },
  {
    id: 'cat_zone-bar',
    category: 'bar',
    label: 'Zona de barra',
    description:
      'Área de barra con taburetes al frente del mostrador; mezcla tránsito de clientes y trabajo de coctelería.',
    tags: ['zona', 'barra', 'clientes'],
    suggestedSize: { width: 4, depth: 3 },
    defaultCapacity: estimatedSpec({
      label: 'Ocupación simultánea',
      value: 12,
      unit: 'persons',
      minValue: 1,
      maxValue: 60,
      assumptions: 'Estimación de ejemplo: 8 clientes en taburetes + 2 barmans + 2 en espera.',
    }),
    allowedRoles: [],
    accessRules: [
      'Los taburetes se colocan a 0,6 m del frente de la barra; el pasillo de coctelería queda detrás.',
    ],
    iconId: 'zone',
    usageNotes: [
      'La barra no atiende sola: las tareas de coctelería y su duración viven en FASE 05/06.',
    ],
  },
  {
    id: 'cat_zone-vip',
    category: 'vip',
    label: 'Zona VIP',
    description:
      'Área reservada con mesas premium y mayor despeje; separada visualmente del salón general.',
    tags: ['zona', 'vip', 'reservado'],
    suggestedSize: { width: 4, depth: 4 },
    defaultCapacity: estimatedSpec({
      label: 'Ocupación simultánea',
      value: 8,
      unit: 'persons',
      minValue: 1,
      maxValue: 50,
      assumptions: 'Estimación de ejemplo: 2 mesas VIP de 4 plazas en 4 × 4 m.',
    }),
    allowedRoles: [],
    accessRules: [
      'Acceso con reserva activa; el anfitrión deriva a la mesa (la política formal llega en FASE 08).',
      'Sin tránsito de servicio cruzando la zona: el personal entra por el flanco, no por el centro.',
    ],
    iconId: 'zone',
    usageNotes: [
      'La condición VIP es de la zona y sus reglas: las mesas dentro heredan el contexto, no al revés.',
    ],
  },
  {
    id: 'cat_zone-pizzeria',
    category: 'pizzeria',
    label: 'Zona de pizzería',
    description:
      'Área del horno de leña a la vista; combina exhibición (mostrador de masas) y producción de pizza.',
    tags: ['zona', 'pizzería', 'exhibición'],
    suggestedSize: { width: 5, depth: 5 },
    defaultCapacity: estimatedSpec({
      label: 'Ocupación simultánea',
      value: 12,
      unit: 'persons',
      minValue: 1,
      maxValue: 60,
      assumptions:
        'Estimación de ejemplo: 2 pizzeros + 1 en masas + colas cortas de clientes mirando.',
    }),
    allowedRoles: ['cook', 'staff'],
    accessRules: [
      'Clientes solo en el frente de exhibición; el flanco del horno es de producción.',
      'El horno de leña exige despeje de 1 m alrededor (se verifica al colocar, FASE 03/07).',
    ],
    iconId: 'zone',
    usageNotes: [
      'La zona no hornea: el horno (cat_pizza-oven-wood-120) aporta los tiempos; la zona solo delimita.',
    ],
  },
  {
    id: 'cat_zone-dishwashing',
    category: 'dishwashing',
    label: 'Zona de lavado',
    description:
      'Área de fregadero y lavavajillas con escurridor; el punto final del ciclo de vajilla.',
    tags: ['zona', 'lavado', 'staff'],
    suggestedSize: { width: 3, depth: 2 },
    defaultCapacity: estimatedSpec({
      label: 'Ocupación simultánea',
      value: 2,
      unit: 'persons',
      minValue: 1,
      maxValue: 10,
      assumptions: 'Estimación de ejemplo: 2 puestos (uno lava, otro clasifica) en 3 × 2 m.',
    }),
    allowedRoles: ['staff'],
    accessRules: ['Solo personal de cocina; entrada con cubas, nunca con bandejas sueltas.'],
    iconId: 'zone',
    usageNotes: [
      'La zona no lava: las tandas y sus duraciones pertenecen al fregadero/lavavajillas (catálogo de equipos).',
    ],
  },
  {
    id: 'cat_zone-storage',
    category: 'storage',
    label: 'Zona de almacén',
    description:
      'Almacén de insumos y stock seco con estanterías; el origen de la cadena de inventario.',
    tags: ['zona', 'almacén', 'stock'],
    suggestedSize: { width: 4, depth: 3 },
    defaultCapacity: estimatedSpec({
      label: 'Ocupación simultánea',
      value: 2,
      unit: 'persons',
      minValue: 1,
      maxValue: 20,
      assumptions:
        'Estimación de ejemplo: 2 personas acomodando stock en 4 × 3 m con pasillo central.',
    }),
    allowedRoles: ['staff'],
    accessRules: ['Pasillo central de 0,9 m despejado; no se apila en el paso.'],
    iconId: 'zone',
    usageNotes: [
      'El stock no vive en la zona: el inventario (FASE 05) es del escenario, con sus propias unidades.',
    ],
  },
  {
    id: 'cat_zone-restroom',
    category: 'restroom',
    label: 'Zona de baños',
    description:
      'Bloque de baños con lavabos y cabinas; la capacidad cuenta cabinas + lavabos ocupables a la vez.',
    tags: ['zona', 'baños', 'clientes'],
    suggestedSize: { width: 2.5, depth: 2.5 },
    defaultCapacity: estimatedSpec({
      label: 'Ocupación simultánea',
      value: 3,
      unit: 'persons',
      maxValue: 30,
      minValue: 1,
      assumptions: 'Estimación de ejemplo: 2 cabinas + 1 lavabo en uso en 2,5 × 2,5 m.',
    }),
    allowedRoles: [],
    accessRules: [
      'Entrada sin puerta directa al salón: se accede por antesala (el editor la dibuja).',
    ],
    iconId: 'zone',
    usageNotes: [
      'Las cabinas son objetos del editor (FASE 03), no presets: la zona solo delimita el bloque.',
    ],
  },
  {
    id: 'cat_zone-exit',
    category: 'exit',
    label: 'Zona de salida',
    description:
      'Área de salida/egreso junto a la puerta principal; su capacidad representa el flujo simultáneo en el vestíbulo.',
    tags: ['zona', 'salida', 'egreso'],
    suggestedSize: { width: 2, depth: 1.5 },
    defaultCapacity: estimatedSpec({
      label: 'Flujo simultáneo',
      value: 15,
      unit: 'persons',
      minValue: 1,
      maxValue: 100,
      assumptions: 'Estimación de ejemplo: personas paradas en el vestíbulo al mismo tiempo.',
    }),
    allowedRoles: [],
    accessRules: [
      'Despeje permanente: nada se apila en la salida (la simulación lo verifica en FASE 07).',
    ],
    iconId: 'zone',
    usageNotes: [
      'La evacuación de emergencia NO se simula en FASE 02: la salida aquí es solo geometría de paso.',
    ],
  },
  {
    id: 'cat_zone-corridor',
    category: 'corridor',
    label: 'Zona de pasillo',
    description:
      'Pasillo de circulación entre áreas; su capacidad representa cuántas personas lo ocupan a la vez sin bloquearse.',
    tags: ['zona', 'pasillo', 'circulación'],
    suggestedSize: { width: 6, depth: 1.5 },
    defaultCapacity: estimatedSpec({
      label: 'Ocupación simultánea',
      value: 6,
      unit: 'persons',
      minValue: 1,
      maxValue: 50,
      assumptions: 'Estimación de ejemplo para 1,5 m de ancho con flujo bidireccional suave.',
    }),
    allowedRoles: [],
    accessRules: ['Sin mobiliario fijo dentro del pasillo; el ancho útil se mide entre paredes.'],
    iconId: 'zone',
    usageNotes: [
      'La congestión real la calcula FASE 07 con la geometría; la capacidad de aquí es solo diseño inicial.',
    ],
  },
  {
    id: 'cat_zone-preparation',
    category: 'preparation',
    label: 'Zona de preparación',
    description:
      'Área de mise en place con estaciones de corte y cámara de adobos; el backstage de la línea caliente.',
    tags: ['zona', 'preparación', 'staff'],
    suggestedSize: { width: 4, depth: 3 },
    defaultCapacity: estimatedSpec({
      label: 'Ocupación simultánea',
      value: 3,
      unit: 'persons',
      minValue: 1,
      maxValue: 15,
      assumptions: 'Estimación de ejemplo: 3 puestos de corte en 4 × 3 m.',
    }),
    allowedRoles: ['cook', 'staff'],
    accessRules: ['Solo personal de cocina; tablas y cuchillos no salen de la zona.'],
    iconId: 'zone',
    usageNotes: [
      'Las tareas de corte y sus duraciones viven en FASE 05; la zona solo delimita el espacio.',
    ],
  },
]
