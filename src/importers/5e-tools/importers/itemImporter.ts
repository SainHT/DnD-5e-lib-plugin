/**
 * Reads 5etools item JSON and writes individual mundane or magic item notes.
 */
import { resolveRuleFolder, type NoteFoldersSettings } from '../../../platform'
import { slugForNote } from './../markdown'
import type { VaultAdapter } from './../fileHandler'
import { mapItem, shouldExcludeItem, isTreasureItem } from './../mappers/Items/itemMapper'
import type { FiveEToolsRecord } from './../types'

/** Writable vault contract required by item import. */
export interface ItemVault extends VaultAdapter {
  /** Creates a new note at a vault path. */
  create(path: string, content: string): Promise<unknown>
  /** Creates a folder when the adapter supports explicit folder creation. */
  createFolder?(path: string): Promise<unknown>
  /** Finds an existing folder by path when supported. */
  getFolderByPath?(path: string): unknown
}

/** Counts item import results. */
export interface ItemImportReport {
  /** Number of notes created. */
  imported: number
  /** Number of existing notes skipped. */
  skipped: number
}

/**
 * Imports records from one 5etools item JSON file.
 *
 * Mundane records are routed to the configured items folder and magic records
 * are routed to the configured magic-items folder.
 *
 * @param vault Writable vault adapter.
 * @param jsonPath Vault path to an item JSON file.
 * @param folders Configured rules-folder settings.
 * @returns Import counts.
 */
export async function importItems(
  vault: ItemVault,
  jsonPath: string,
  folders: NoteFoldersSettings,
): Promise<ItemImportReport> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await vault.read(jsonPath)) as unknown
  } catch {
    throw new Error(`Could not parse JSON: ${jsonPath}`)
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`The JSON file has no item records: ${jsonPath}`)
  }
  const container = parsed as Record<string, unknown>
  const recordsValue = Array.isArray(container.item)
    ? container.item
    : Array.isArray(container.items)
      ? container.items
      : null
  if (!recordsValue) throw new Error(`The JSON file has no item records: ${jsonPath}`)
  if (!recordsValue.every(record => record && typeof record === 'object'
    && typeof (record as Record<string, unknown>).name === 'string')) {
    throw new Error(`The JSON file has unnamed item records: ${jsonPath}`)
  }

  let imported = 0
  let skipped = 0
  for (const record of recordsValue.filter(isCurrentItem) as FiveEToolsRecord[]) {
    if (shouldExcludeItem(record) || isTreasureItem(record)) {
      skipped += 1
      continue
    }
    const note = mapItem(record)
    const folder = resolveRuleFolder(note.kind === 'magicItem' ? 'magic-items' : 'items', folders)
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
 * @param record Candidate item record.
 * @returns True when the record is current.
 */
function isCurrentItem(record: unknown): boolean {
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
async function ensureFolder(vault: ItemVault, folder: string): Promise<void> {
  if (!vault.createFolder || !vault.getFolderByPath) return
  const parts = folder.split('/')
  for (let index = 1; index <= parts.length; index += 1) {
    const path = parts.slice(0, index).join('/')
    if (!vault.getFolderByPath(path)) await vault.createFolder(path)
  }
}
