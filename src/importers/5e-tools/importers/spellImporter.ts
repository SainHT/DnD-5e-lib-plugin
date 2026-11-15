/**
 * Reads 5etools spell JSON and writes each current spell as a vault note.
 */
import { resolveRuleFolder, type NoteFoldersSettings } from '../../../platform'
import { slugForNote } from '../markdown'
import type { VaultAdapter } from '../fileHandler'
import { mapSpell } from '../mappers/Spells/spellMapper'
import type { FiveEToolsRecord } from '../types'

/**
 * Writable vault contract required by spell import.
 */
export interface SpellVault extends VaultAdapter {
  /** Creates a new note at a vault path. */
  create(path: string, content: string): Promise<unknown>
  /** Creates a folder when the adapter supports explicit folder creation. */
  createFolder?(path: string): Promise<unknown>
  /** Finds an existing folder by path when supported. */
  getFolderByPath?(path: string): unknown
}

/**
 * Counts spell import results.
 */
export interface SpellImportReport {
  /** Number of notes created. */
  imported: number
  /** Number of existing notes skipped. */
  skipped: number
}

/**
 * Imports current spells from one 5etools JSON file.
 *
 * @param vault Writable vault adapter.
 * @param jsonPath Vault path to a spell JSON file.
 * @param folders Configured rules-folder settings.
 * @returns Import counts.
 */
export async function importSpells(vault: SpellVault, jsonPath: string, folders: NoteFoldersSettings): Promise<SpellImportReport> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await vault.read(jsonPath)) as unknown
  } catch {
    throw new Error(`Could not parse JSON: ${jsonPath}`)
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as Record<string, unknown>).spell)) {
    throw new Error(`The JSON file has no spell records: ${jsonPath}`)
  }
  const records = (parsed as Record<string, unknown>).spell as unknown[]
  if (!records.every(record => record && typeof record === 'object' && typeof (record as Record<string, unknown>).name === 'string')) {
    throw new Error(`The JSON file has unnamed spell records: ${jsonPath}`)
  }
  const folder = resolveRuleFolder('spells', folders)
  let imported = 0
  let skipped = 0
  for (const record of records.filter(isCurrentSpell) as FiveEToolsRecord[]) {
    const note = mapSpell(record)
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

/**
 * Excludes records superseded by a reprint.
 *
 * @param record Candidate spell record.
 * @returns True when the record is current.
 */
function isCurrentSpell(record: unknown): boolean {
  if (!record || typeof record !== 'object') return false
  const reprintedAs = (record as Record<string, unknown>).reprintedAs
  return Array.isArray(reprintedAs) ? reprintedAs.length === 0 : !reprintedAs
}

/**
 * Creates every segment of a configured destination folder.
 *
 * @param vault Writable vault adapter.
 * @param folder Destination folder.
 * @returns Promise resolved when folder creation is complete.
 */
async function ensureFolder(vault: SpellVault, folder: string): Promise<void> {
  if (!vault.createFolder || !vault.getFolderByPath) return
  const parts = folder.split('/')
  for (let index = 1; index <= parts.length; index += 1) {
    const path = parts.slice(0, index).join('/')
    if (!vault.getFolderByPath(path)) await vault.createFolder(path)
  }
}
