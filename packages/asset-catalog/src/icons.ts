/**
 * Registro de iconos vectoriales de respaldo para el catálogo (prompt 02.2:
 * «Evita descargar decenas de assets ahora; iconos vectoriales simples sirven
 * para los placeholders»).
 *
 * LICENCIA Y ORIGINALIDAD: todos los trazados de este archivo son obra
 * original del proyecto (LBA_Restaurant_Engine, MIT): geometría básica
 * (rectángulos, círculos y líneas) dibujada a mano para esta guía. No se
 * descarga ni se redistribuye ningún recurso de terceros; por eso no hay
 * entradas nuevas en THIRD_PARTY_NOTICES.md por este archivo.
 *
 * Formato: SVG de trazo relleno con viewBox fijo "0 0 24 24". El editor
 * (FASE 03) los renderiza al color del material sugerido; la vista 3D
 * (FASE 10) los ignora.
 */

/** Especificación mínima de un icono de respaldo. */
export interface IconSpec {
  /** ViewBox fijo del sistema de iconos del catálogo. */
  readonly viewBox: '0 0 24 24'
  /** Trazado(s) SVG en coordenadas del viewBox; relleno sólido, sin trazo. */
  readonly path: string
}

const VB = '0 0 24 24' as const

/**
 * Registro de iconos por identificador de grupo. La clave coincide con
 * IconId (preset.ts), por lo que toda referencia de preset es válida por
 * construcción y un test verifica la coincidencia 1:1 del registro.
 */
export const ICONS = {
  // Pared vista en planta: barra gruesa horizontal.
  wall: { viewBox: VB, path: 'M3 9h18v6H3z' },
  // Puerta batiente: hoja vertical + arco de apertura.
  door: { viewBox: VB, path: 'M5 21V3h2v16h6v2H5zm8-16a10 10 0 0 1 0 16v-2a8 8 0 0 0 0-12z' },
  // Ventana: marco con cruceta.
  window: {
    viewBox: VB,
    path: 'M3 4h18v16H3V4zm2 2v5.5h6.5V6H5zm8.5 0v5.5H20V6h-6.5zM5 13.5V18h6.5v-4.5H5zm8.5 0V18H20v-4.5h-6.5z',
  },
  // Mesa redonda con base.
  table: {
    viewBox: VB,
    path: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 2.5A6.5 6.5 0 1 0 12 18.5 6.5 6.5 0 0 0 12 5.5z',
  },
  // Silla de perfil: respaldo + asiento + pata.
  chair: { viewBox: VB, path: 'M7 2h3v9h6v2h-6v7h4v2H7v-2h2v-9H7V2z' },
  // Mostrador en L con frente de atención.
  counter: { viewBox: VB, path: 'M3 5h18v6h-8v8H3V5zm2 2v10h6v-6h8V7H5z' },
  // Barra: mostrador con taburete al frente.
  bar: {
    viewBox: VB,
    path: 'M3 6h18v5H3V6zm2 2v1h14V8H5zM4 13a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  },
  // Estación de trabajo: mesa con herramientas.
  station: { viewBox: VB, path: 'M3 8h18v8H3V8zm2 2v4h6v-2.2l1.8 1.8 1.4-1.4L12 12.4V12h8v-2H5z' },
  // Pila de bandejas apiladas.
  tray: {
    viewBox: VB,
    path: 'M4 16h16v4H4v-4zm0-5h16v4H4v-4zm2 6v.01zm0-5v.01zM6 7l1.5-3h9L18 7H6z',
  },
  // Cocina de 4 hornillas: rectángulo con cuatro círculos.
  range: {
    viewBox: VB,
    path: 'M3 4h18v16H3V4zm2 2v12h14V6H5zm3.5 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM8.5 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  },
  // Plancha: superficie con líneas de calor.
  griddle: {
    viewBox: VB,
    path: 'M3 7h18v10H3V7zm2 2v6h14V9H5zm2 1.5h2v1H7v-1zm3 0h2v1h-2v-1zm3 0h2v1h-2v-1zM7 13h2v1H7v-1zm3 0h2v1h-2v-1zm3 0h2v1h-2v-1z',
  },
  // Freidora: cuba con dos canastas.
  fryer: {
    viewBox: VB,
    path: 'M4 6h16v12H4V6zm2 2v8h12V8H6zm2.5 1.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  },
  // Horno de cámara: puerta con visor y bandejas.
  oven: {
    viewBox: VB,
    path: 'M4 3h16v18H4V3zm2 2v14h12V5H6zm2 2h8v3H8V7zm0 5h2v2H8v-2zm3 0h2v2h-2v-2zm3 0h2v2h-2v-2z',
  },
  // Horno de pizza: bóveda con boca y solera.
  'pizza-oven': {
    viewBox: VB,
    path: 'M3 20v-2h2v-6a7 7 0 0 1 14 0v6h2v2H3zm4-2h10v-6a5 5 0 0 0-10 0v6zm2-5a3 3 0 1 1 6 0h-2a1 1 0 1 0-2 0H9z',
  },
  // Nevera vertical: dos puertas y tiradores.
  fridge: {
    viewBox: VB,
    path: 'M6 2h12v20H6V2zm2 2v7h8V4H8zm1.5 2h2v3h-2V6zM8 13v7h8v-7H8zm1.5 2h2v3h-2v-3z',
  },
  // Congelador tipo arca: tapa con bisagras.
  freezer: {
    viewBox: VB,
    path: 'M4 6h16v14H4V6zm2 2v10h12V8H6zm2 2v2h8v-2H8zm0 4v2h5v-2H8zM4 4h4v1H4V4zm12 0h4v1h-4V4z',
  },
  // Batidora de mostrador: base y jarra.
  blender: {
    viewBox: VB,
    path: 'M8 2h8l-1 8H9L8 2zm1.6 2 .6 4h3.6l.6-4H9.6zM6 12h12v2h-5v6h3v2H8v-2h3v-6H6v-2z',
  },
  // Fregadero doble: dos cubas + grifo.
  sink: {
    viewBox: VB,
    path: 'M3 8h18v11H3V8zm2 2v7h6v-7H5zm8 0v7h6v-7h-6zM11 4h2v4h-2V4zm0 1.5L8 8h8l-5-2.5z',
  },
  // Lavavajillas: frente con panel y asa.
  dishwasher: { viewBox: VB, path: 'M5 3h14v18H5V3zm2 2v14h10V5H7zm2 2h6v2H9V7zm0 4h6v5H9v-5z' },
  // Impresora de tickets: ranura de salida y rollo.
  'ticket-printer': {
    viewBox: VB,
    path: 'M5 8h14v9H5V8zm2 2v2h10v-2H7zm2 4h6v2H9v-2zM9 4h6l-1 3h-4L9 4z',
  },
  // Punto de venta: pantalla y base.
  pos: {
    viewBox: VB,
    path: 'M6 3h12v10H6V3zm2 2v6h8V5H8zm-4 12h16l-2 5H6l-2-5zm6 1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
  },
  // Zona: rectángulo discontinuo con esquinas marcadas.
  zone: {
    viewBox: VB,
    path: 'M3 5h5v2H5v2H3V5zm13 0h5v4h-2V7h-3V5zM3 15h2v2h3v2H3v-4zm16 0h2v4h-5v-2h3v-2zM10 5h4v2h-4V5zm0 12h4v2h-4v-2zM3 10h2v4H3v-4zm16 0h2v4h-2v-4z',
  },
} as const satisfies Record<string, IconSpec>

export type IconRegistry = typeof ICONS
