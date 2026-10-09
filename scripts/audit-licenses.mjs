#!/usr/bin/env node
/**
 * Auditoría de licencias de dependencias — LBA_Restaurant_Engine.
 *
 * Regla de la guía (docs/guia/02_RECURSOS_LICENCIAS_Y_PARAMETROS.md):
 * "Crear un workflow que produzca un informe de licencias y falle ante
 * estado desconocido/no permitido."
 *
 * Sin dependencias externas: recorre node_modules (raíz + workspaces),
 * deduplica por name@version y verifica cada licencia contra la lista
 * permitida. Expresiones SPDX (p. ej. "MIT OR Apache-2.0") se aceptan si
 * TODAS las opciones están permitidas.
 *
 * Salida: reports/license-report.json y reports/license-report.md
 * Exit code: 0 si todo permitido; 1 si hay licencias desconocidas/prohibidas.
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const ALLOWED = new Set([
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'Zlib',
  'zlib',
  '0BSD',
  'Unlicense',
  'CC0-1.0',
  'Python-2.0',
  'BlueOak-1.0.0',
  // Excepciones aprobadas en ADR-0002 (docs/decisions/ADR-0002-licencias-transitivas-build.md):
  'MIT-0', // MIT sin obligación de aviso: más permisiva que MIT.
  'CC-BY-4.0', // Solo datos/activos con atribución documentada (p. ej. caniuse-lite).
  'MPL-2.0', // Solo herramientas de build sin modificar (p. ej. lightningcss vía Vite).
])

/** Extrae el campo license (o licenses) de un package.json. */
function readLicense(pkgDir) {
  try {
    const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
    let license = pkg.license
    if (Array.isArray(pkg.licenses)) {
      license = pkg.licenses.map((l) => (typeof l === 'string' ? l : l.type)).join(' OR ')
    }
    if (typeof license !== 'string') license = null
    return { name: pkg.name ?? '(sin nombre)', version: pkg.version ?? '?', license }
  } catch {
    return null
  }
}

/** Recorre node_modules (incluidos @scopes) sin bajar a los anidados. */
function* walkNodeModules(dir) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    if (entry.isDirectory() && entry.name.startsWith('@')) {
      for (const sub of readdirSync(join(dir, entry.name), { withFileTypes: true })) {
        if (sub.isDirectory()) yield join(dir, entry.name, sub.name)
      }
    } else if (entry.isDirectory()) {
      yield join(dir, entry.name)
    }
  }
}

/** True si una expresión SPDX usa solo licencias permitidas. */
function isAllowed(expression) {
  if (!expression) return false
  const parts = expression
    .replace(/[()]/g, ' ')
    .split(/\s+(?:OR|AND)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return false
  return parts.every((p) => ALLOWED.has(p))
}

// --- Recolección -----------------------------------------------------------
const packages = new Map() // key: name@version → { name, version, license, path }
const roots = [join(ROOT, 'node_modules')]

// node_modules de workspaces (apps/*, packages/*)
for (const area of ['apps', 'packages']) {
  const areaDir = join(ROOT, area)
  if (!existsSync(areaDir)) continue
  for (const ws of readdirSync(areaDir, { withFileTypes: true })) {
    if (!ws.isDirectory()) continue
    const nested = join(areaDir, ws.name, 'node_modules')
    if (existsSync(nested)) roots.push(nested)
  }
}

for (const root of roots) {
  for (const pkgDir of walkNodeModules(root)) {
    const info = readLicense(pkgDir)
    if (!info) continue
    const key = `${info.name}@${info.version}`
    if (!packages.has(key)) {
      packages.set(key, { ...info, path: relative(ROOT, pkgDir) })
    }
  }
}

// --- Evaluación ------------------------------------------------------------
const entries = [...packages.values()].sort((a, b) => a.name.localeCompare(b.name))
const problems = entries.filter((e) => !isAllowed(e.license))

const reportJson = {
  generatedAt: new Date().toISOString(),
  totalPackages: entries.length,
  allowedLicenses: [...ALLOWED],
  packages: entries,
  problems: problems.map((p) => `${p.name}@${p.version}: ${p.license ?? 'SIN LICENCIA'}`),
}

const lines = [
  '# Informe de licencias de dependencias — LBA_Restaurant_Engine',
  '',
  `- Generado: ${reportJson.generatedAt}`,
  `- Paquetes auditados: ${entries.length}`,
  `- Licencias permitidas: ${[...ALLOWED].join(', ')}`,
  `- Estado: ${problems.length === 0 ? 'OK — todas las licencias permitidas' : 'FALLO — licencias desconocidas o no permitidas'}`,
  '',
  '| Paquete | Versión | Licencia | Estado |',
  '|---|---|---|---|',
]
for (const e of entries) {
  const ok = isAllowed(e.license)
  lines.push(
    `| ${e.name} | ${e.version} | ${e.license ?? '(sin licencia)'} | ${ok ? 'OK' : 'NO PERMITIDA'} |`,
  )
}

// --- Escritura --------------------------------------------------------------
mkdirSync(join(ROOT, 'reports'), { recursive: true })
writeFileSync(join(ROOT, 'reports', 'license-report.json'), JSON.stringify(reportJson, null, 2))
writeFileSync(join(ROOT, 'reports', 'license-report.md'), `${lines.join('\n')}\n`)

console.log(`Paquetes auditados: ${entries.length}`)
for (const e of entries) {
  const ok = isAllowed(e.license)
  console.log(`${ok ? '  OK ' : 'FALLO'} ${e.name}@${e.version} → ${e.license ?? '(sin licencia)'}`)
}
if (problems.length > 0) {
  console.error(
    `\n${problems.length} dependencia(s) con licencia desconocida o no permitida. Ver reports/license-report.md`,
  )
  process.exit(1)
}
console.log('\nTodas las dependencias usan licencias permitidas.')
