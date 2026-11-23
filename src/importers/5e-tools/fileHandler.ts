import type { ImportCandidate, FiveEToolsCategory } from './types'

export interface VaultAdapter {
  exists(path: string, sensitive?: boolean): Promise<boolean>
  list(path: string): Promise<{ files: string[]; folders: string[] }>
  read(path: string): Promise<string>
}

export const IMPORT_CATEGORIES: readonly { value: FiveEToolsCategory; label: string }[] = [
  { value: 'spells', label: 'Spells' },
  { value: 'bestiary', label: 'Monsters' },
  { value: 'items', label: 'Items' },
  { value: 'feats', label: 'Feats' },
  { value: 'backgrounds', label: 'Backgrounds' },
]

/**
 * Maps top-level 5etools JSON array keys to their corresponding importer category.
 * Add new entity keys here as additional importers are supported.
 */
export const JSON_KEY_TO_CATEGORY: Readonly<Record<string, FiveEToolsCategory>> = {
  monster: 'bestiary',
  feat: 'feats',
  item: 'items',
  baseitem: 'items',
  spell: 'spells',
  background: 'backgrounds',
}

/**
 * Resolves a single .json file or recursively scans a directory for 5etools JSON files,
 * automatically detecting each file's importer category from its top-level JSON keys.
 */
export async function findImportFiles(
  adapter: VaultAdapter,
  inputPath: string,
  singleFileCategory?: FiveEToolsCategory,
): Promise<ImportCandidate[]> {
  const path = normalisePath(inputPath)
  if (!path) throw new Error('Enter a 5etools JSON file or folder path.')

  if (!(await adapter.exists(path, true))) {
    throw new Error(`The path was not found: ${path}`)
  }

  // Single-file mode
  if (isJson(path)) {
    const category = singleFileCategory ?? (await detectCategoryFromFile(adapter, path))
    if (!category) {
      throw new Error(`Could not detect a 5etools category for: ${path}`)
    }
    return [{ path, category }]
  }

  // Folder / Auto mode: recursively collect all .json files and classify by content
  const jsonFiles = await collectJsonFilesRecursively(adapter, path)
  const candidates: ImportCandidate[] = []

  for (const filePath of jsonFiles) {
    const category = await detectCategoryFromFile(adapter, filePath)
    if (category) {
      candidates.push({ path: filePath, category })
    }
  }

  if (candidates.length === 0) {
    throw new Error('The folder contains no recognized 5etools JSON files.')
  }

  return candidates
}

export async function readImportFiles(adapter: VaultAdapter, candidates: ImportCandidate[]) {
  return Promise.all(
    candidates.map(async candidate => ({
      ...candidate,
      records: recordsFromJson(await adapter.read(candidate.path), candidate.path),
    })),
  )
}

/**
 * Recursively traverses a folder and returns all `.json` file paths, skipping non-JSON files.
 */
async function collectJsonFilesRecursively(adapter: VaultAdapter, dirPath: string): Promise<string[]> {
  const listed = await adapter.list(dirPath)
  const results: string[] = listed.files.filter(isJson)

  for (const subFolder of listed.folders) {
    const nested = await collectJsonFilesRecursively(adapter, subFolder)
    results.push(...nested)
  }

  return results
}

/**
 * Reads a JSON file and determines its importer category by matching top-level
 * keys against `JSON_KEY_TO_CATEGORY`.
 */
export async function detectCategoryFromFile(
  adapter: VaultAdapter,
  filePath: string,
): Promise<FiveEToolsCategory | null> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await adapter.read(filePath))
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== 'object') return null
  const data = parsed as Record<string, unknown>

  for (const [key, category] of Object.entries(JSON_KEY_TO_CATEGORY)) {
    if (Array.isArray(data[key])) {
      return category
    }
  }

  return null
}

function isJson(path: string): boolean {
  return path.toLowerCase().endsWith('.json')
}

function recordsFromJson(text: string, path: string) {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(`Could not parse JSON: ${path}`)
  }
  if (!parsed || typeof parsed !== 'object') throw new Error(`The JSON file has no 5etools records: ${path}`)

  const data = parsed as Record<string, unknown>
  const knownKey = Object.keys(JSON_KEY_TO_CATEGORY).find(key => Array.isArray(data[key]))
  const records = knownKey
    ? data[knownKey]
    : Object.values(data).find(value => Array.isArray(value))

  if (!Array.isArray(records) || !records.every(record => record && typeof record === 'object' && typeof record.name === 'string')) {
    throw new Error(`The JSON file has no named 5etools records: ${path}`)
  }
  return records as { name: string; [key: string]: unknown }[]
}

function normalisePath(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
}