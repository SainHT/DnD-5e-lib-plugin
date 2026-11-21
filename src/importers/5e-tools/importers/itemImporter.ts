import type { NoteFoldersSettings } from '../../../platform'
import { mapItem, shouldExcludeItem, isTreasureItem } from '../mappers/Items/itemMapper'
import { fiveEToolsFolderFor } from '../index'
import type { FiveEToolsRecord, MappedNote } from '../types'
import { EntityImporter, type ImportCounts, type WritableVault } from './entityImporter'

export type ItemVault = WritableVault

export type ItemImportReport = ImportCounts

/**
 * Imports mundane and magic item records from one 5etools JSON file.
 *
 * Mundane records are routed to the configured items folder and magic records
 * are routed to the configured magic-items folder.
 */
export class ItemImporter extends EntityImporter {
  protected readonly recordKeys = ['item', 'items', 'baseitem']
  protected readonly entityName = 'item'

  protected map(record: FiveEToolsRecord): MappedNote {
    return mapItem(record)
  }

  protected folderFor(note: MappedNote): string {
    return fiveEToolsFolderFor(note.kind === 'magicItem' ? 'magicItem' : 'item', this.folders)
  }

  /**
   * Skips excluded eras and treasure records.
   *
   * @param record Current item record.
   * @returns True when the record should not become a note.
   */
  protected shouldSkip(record: FiveEToolsRecord): boolean {
    return shouldExcludeItem(record) || isTreasureItem(record)
  }
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
  return new ItemImporter(vault, folders).import(jsonPath)
}
