import type { ImportCandidate, FiveEToolsCategory } from './types'

export interface VaultAdapter {
  exists(path: string, sensitive?: boolean): Promise<boolean>
  list(path: string): Promise<{ files: string[]; folders: string[] }>
  read(path: string): Promise<string>
}

const CATEGORY_FOLDERS: Readonly<Record<string, FiveEToolsCategory>> = {
  spells: 'spells',
  spell: 'spells',
  bestiary: 'bestiary',
  monsters: 'bestiary',
  monster: 'bestiary',
  items: 'items',
  item: 'items',
  feats: 'feats',
  feat: 'feats',
}

export const IMPORT_CATEGORIES: readonly { value: FiveEToolsCategory; label: string }[] = [
  { value: 'spells', label: 'Spells' },
  { value: 'bestiary', label: 'Monsters' },
  { value: 'items', label: 'Items' },
  { value: 'feats', label: 'Feats' },
]

export function categoryForFolder(folder: string): FiveEToolsCategory | null {
  return CATEGORY_FOLDERS[folder.toLowerCase()] ?? null
}

export async function findImportFiles(
  adapter: VaultAdapter,
  inputPath: string,
  singleFileCategory?: FiveEToolsCategory,
): Promise<ImportCandidate[]> {
  const path = normalisePath(inputPath)
  if (!path) throw new Error('Enter a 5etools JSON file or folder path.')

  const isFile = path.toLowerCase().endsWith('.json')
  if (isFile) {
    if (!(await adapter.exists(path, true))) throw new Error(`The JSON file was not found: ${path}`)
    if (!singleFileCategory) throw new Error('Choose a category for a single JSON file.')
    return [{ path, category: singleFileCategory }]
  }

  if (!(await adapter.exists(path, true))) throw new Error(`The folder was not found: ${path}`)
  const listed = await adapter.list(path)
  const candidates: ImportCandidate[] = []
  for (const folder of listed.folders) {
    const category = categoryForFolder(folder.slice(path ? `${path}/`.length : 0).split('/')[0])
    if (!category) continue
    const files = await adapter.list(folder)
    candidates.push(...files.files.filter(isJson).map(file => ({ path: file, category })))
  }
  if (candidates.length === 0) throw new Error('The folder contains no 5etools JSON files in spells, bestiary, items, or feats.')
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
  const records = Object.values(parsed).find(value => Array.isArray(value))
  if (!Array.isArray(records) || !records.every(record => record && typeof record === 'object' && typeof record.name === 'string')) {
    throw new Error(`The JSON file has no named 5etools records: ${path}`)
  }
  return records as { name: string; [key: string]: unknown }[]
}

function normalisePath(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
}
