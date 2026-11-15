import { mapFeat } from '../mappers/Feats/featMapper'
import { slugForNote } from '../markdown'
import { resolveRuleFolder, type NoteFoldersSettings } from '../../../platform'
import type { FiveEToolsRecord } from '../types'
import type { VaultAdapter } from '../fileHandler'

export interface FeatVault extends VaultAdapter {
  create(path: string, content: string): Promise<unknown>
  modify?(path: string, content: string): Promise<unknown>
  createFolder?(path: string): Promise<unknown>
  getFolderByPath?(path: string): unknown
}

export interface FeatImportReport {
  imported: number
  skipped: number
}

export async function importFeats(
  vault: FeatVault,
  jsonPath: string,
  folders: NoteFoldersSettings,
): Promise<FeatImportReport> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await vault.read(jsonPath)) as unknown
  } catch {
    throw new Error(`Could not parse JSON: ${jsonPath}`)
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as Record<string, unknown>).feat)) {
    throw new Error(`The JSON file has no feat records: ${jsonPath}`)
  }
  const records = (parsed as Record<string, unknown>).feat as unknown[]
  if (!records.every(record => record && typeof record === 'object' && typeof (record as Record<string, unknown>).name === 'string')) {
    throw new Error(`The JSON file has unnamed feat records: ${jsonPath}`)
  }
  const folder = resolveRuleFolder('feats', folders)
  let imported = 0
  let skipped = 0
  for (const record of records.filter(isCurrentFeat) as FiveEToolsRecord[]) {
    const note = mapFeat(record)
    const path = `${folder}/${slugForNote(note.name)}.md`
    if (await vault.exists(path)) {
      skipped += 1
      continue
    }
    await ensureFolder(vault, folder)
    await vault.create(path, note.markdown)
    imported += 1
  }
  return { imported, skipped }
}

function isCurrentFeat(record: unknown): boolean {
  if (!record || typeof record !== 'object') return false
  const reprintedAs = (record as Record<string, unknown>).reprintedAs
  if (Array.isArray(reprintedAs)) return reprintedAs.length === 0
  return !reprintedAs
}

async function ensureFolder(vault: FeatVault, folder: string): Promise<void> {
  if (!vault.createFolder || !vault.getFolderByPath) return
  const parts = folder.split('/')
  for (let index = 1; index <= parts.length; index += 1) {
    const path = parts.slice(0, index).join('/')
    if (!vault.getFolderByPath(path)) await vault.createFolder(path)
  }
}
