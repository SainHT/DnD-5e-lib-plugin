import type { NoteFoldersSettings } from '../../../platform'
import { mapSpell } from '../mappers/spellMapper'
import { fiveEToolsFolderFor } from '../index'
import type { FiveEToolsRecord, MappedNote } from '../types'
import { EntityImporter, type ImportCounts, type WritableVault } from './entityImporter'

export type SpellVault = WritableVault
export type SpellImportReport = ImportCounts

/**
 * Imports current spells from one 5etools JSON file.
 */
export class SpellImporter extends EntityImporter {
  protected readonly recordKeys = ['spell']
  protected readonly entityName = 'spell'

  protected map(record: FiveEToolsRecord): Promise<MappedNote> {
    return mapSpell(record)
  }

  /**
   * Resolves the configured spells folder.
   *
   * @returns Vault folder path for spells.
   */
  protected folderFor(): string {
    return fiveEToolsFolderFor('spell', this.folders)
  }
}

/**
 * Imports current spells from one 5etools JSON file.
 *
 * @param vault Writable vault adapter.
 * @param jsonPath Vault path to a spell JSON file.
 * @param folders Configured rules-folder settings.
 * @returns Import counts.
 */
export async function importSpells(
  vault: SpellVault,
  source: string | Record<string, unknown> | FiveEToolsRecord[],
  folders: NoteFoldersSettings,
  onRecord?: (done: number, total: number) => void,
): Promise<SpellImportReport> {
  return new SpellImporter(vault, folders).import(source, onRecord)
}
