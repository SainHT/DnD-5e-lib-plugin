import type { NoteFoldersSettings } from '../../../platform'
import { mapMonster } from '../mappers/monsterMapper'
import { fiveEToolsFolderFor } from '../index'
import type { FiveEToolsRecord, MappedNote } from '../types'
import { EntityImporter, type ImportCounts, type WritableVault } from './entityImporter'

export type MonsterVault = WritableVault

export type MonsterImportReport = ImportCounts

/**
 * Imports monster records from one 5etools bestiary JSON file.
 */
export class MonsterImporter extends EntityImporter {
  protected readonly recordKeys = ['monster']
  protected readonly entityName = 'monster'

  protected map(record: FiveEToolsRecord): Promise<MappedNote> {
    return mapMonster(record)
  }

  /**
   * Resolves the configured bestiary folder.
   *
   * @returns Vault folder path for monsters.
   */
  protected folderFor(): string {
    return fiveEToolsFolderFor('monster', this.folders)
  }
}

/**
 * Imports monster records from one 5etools bestiary JSON file.
 *
 * @param vault Writable vault adapter.
 * @param jsonPath Vault path to a bestiary JSON file.
 * @param folders Configured rules-folder settings.
 * @returns Import counts.
 */
export async function importMonsters(
  vault: MonsterVault,
  jsonPath: string,
  folders: NoteFoldersSettings,
  onRecord?: (done: number, total: number) => void,
): Promise<MonsterImportReport> {
  return new MonsterImporter(vault, folders).import(jsonPath, onRecord)
}
