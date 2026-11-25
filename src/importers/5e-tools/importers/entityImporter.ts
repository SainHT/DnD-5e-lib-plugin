import type { NoteFoldersSettings } from '../../../platform'
import type { VaultAdapter } from '../fileHandler'
import { slugForNote } from '../helpers/mapperHelpers'
import type { FiveEToolsRecord, MappedNote } from '../types'

export { slugForNote }


export interface WritableVault extends VaultAdapter {
  create(path: string, content: string): Promise<unknown>
  createFolder?(path: string): Promise<unknown>
  getFolderByPath?(path: string): unknown
}


export interface ImportCounts {
  imported: number
  skipped: number
}

export abstract class EntityImporter {
  constructor(
    protected readonly vault: WritableVault,
    protected readonly folders: NoteFoldersSettings,
  ) {}

  protected abstract readonly recordKeys: readonly string[]
  protected abstract readonly entityName: string

  /**
   * Maps one current record to a vault note.
   *
   * @param record Named 5etools record.
   * @returns Mapped note.
   */
  protected abstract map(record: FiveEToolsRecord): Promise<MappedNote> | MappedNote

  /**
   * Resolves the destination folder for a mapped note.
   *
   * @param note Mapped note.
   * @returns Vault folder path.
   */
  protected abstract folderFor(note: MappedNote): string

  /**
   * Drops records that should not become notes and counts them as skipped.
   *
   * @param _record Candidate record that survived reprint filtering.
   * @returns True when the record should be skipped.
   */
  protected shouldSkip(_record: FiveEToolsRecord): boolean {
    return false
  }

  /**
   * Imports current records from one 5etools JSON file.
   *
   * @param jsonPath Vault path to a JSON file.
   * @returns Import counts.
   */
  async import(jsonPath: string, onRecord?: (done: number, total: number) => void): Promise<ImportCounts> {
    const records = await this.readRecords(jsonPath)
    let imported = 0
    let skipped = 0
    let processed = 0
    for (const record of records) {
      if (isSrd52Record(record) || this.shouldSkip(record)) {
        skipped += 1
        processed += 1
        onRecord?.(processed, records.length)
        continue
      }
      const note = await this.map(record)
      const folder = this.folderFor(note)
      const path = `${folder}/${slugForNote(note.name)}.md`
      if (await this.vault.exists(path)) {
        skipped += 1
        processed += 1
        onRecord?.(processed, records.length)
        continue
      }
      await this.ensureFolder(folder)
      await this.vault.create(path, note.markdown)
      imported += 1
      processed += 1
      onRecord?.(processed, records.length)
    }
    return { imported, skipped }
  }

  /**
   * Reads and validates the named record array.
   *
   * @param jsonPath Vault path to a JSON file.
   * @returns Current named records.
   */
  private async readRecords(jsonPath: string): Promise<FiveEToolsRecord[]> {
    let parsed: unknown
    try {
      parsed = JSON.parse(await this.vault.read(jsonPath)) as unknown
    } catch {
      throw new Error(`Could not parse JSON: ${jsonPath}`)
    }
    if (!parsed || typeof parsed !== 'object') {
      throw new Error(`The JSON file has no ${this.entityName} records: ${jsonPath}`)
    }
    const container = parsed as Record<string, unknown>
    const recordsValue = this.recordKeys
      .map(key => container[key])
      .find((value): value is unknown[] => Array.isArray(value))
    if (!recordsValue) throw new Error(`The JSON file has no ${this.entityName} records: ${jsonPath}`)
    if (!recordsValue.every(record => record && typeof record === 'object' && typeof (record as Record<string, unknown>).name === 'string')) {
      throw new Error(`The JSON file has unnamed ${this.entityName} records: ${jsonPath}`)
    }
    return recordsValue.filter(isCurrentRecord) as FiveEToolsRecord[]
  }

  /**
   * Creates every segment of a configured destination folder.
   *
   * @param folder Destination folder.
   * @returns Promise resolved when folder creation is complete.
   */
  private async ensureFolder(folder: string): Promise<void> {
    if (!this.vault.createFolder || !this.vault.getFolderByPath) return
    const parts = folder.split('/')
    for (let index = 1; index <= parts.length; index += 1) {
      const path = parts.slice(0, index).join('/')
      if (!this.vault.getFolderByPath(path)) await this.vault.createFolder(path)
    }
  }
}

/**
 * Excludes records superseded by a reprint.
 *
 * @param record Candidate record.
 * @returns True when the record is current.
 */
function isCurrentRecord(record: unknown): boolean {
  if (!record || typeof record !== 'object') return false
  const reprintedAs = (record as Record<string, unknown>).reprintedAs
  return Array.isArray(reprintedAs) ? reprintedAs.length === 0 : !reprintedAs
}

/**
 * Checks whether a record belongs to SRD 5.2.1 (already bundled by the plugin).
 *
 * @param record Candidate 5etools record.
 * @returns True when `srd52` is set on the record or `source` is `srd52`.
 */
function isSrd52Record(record: FiveEToolsRecord): boolean {
  if (record.srd52 === true) return true
  if (typeof record.srd52 === 'string' && record.srd52.trim().length > 0) return true
  return typeof record.source === 'string' && record.source.trim().toLowerCase() === 'srd52'
}
