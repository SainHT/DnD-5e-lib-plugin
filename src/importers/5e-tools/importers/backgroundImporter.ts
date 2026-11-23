import type { NoteFoldersSettings } from '../../../platform'
import { mapBackground } from '../mappers/backgroundMapper'
import { fiveEToolsFolderFor } from '../index'
import type { FiveEToolsRecord, MappedNote } from '../types'
import { EntityImporter, type ImportCounts, type WritableVault } from './entityImporter'

export type BackgroundVault = WritableVault

export type BackgroundImportReport = ImportCounts

/**
 * Imports backgrounds from one 5etools JSON file.
 */
export class BackgroundImporter extends EntityImporter {
  protected readonly recordKeys = ['background']
  protected readonly entityName = 'background'

  protected map(record: FiveEToolsRecord): MappedNote {
    return mapBackground(record)
  }

  protected folderFor(): string {
    return fiveEToolsFolderFor('background', this.folders)
  }
}

/**
 * Imports backgrounds from one 5etools JSON file.
 *
 * @param vault Writable vault adapter.
 * @param jsonPath Vault path to a background JSON file.
 * @param folders Configured rules-folder settings.
 * @param onRecord Optional record-by-record progress callback.
 * @returns Import counts.
 */
export async function importBackgrounds(
  vault: BackgroundVault,
  jsonPath: string,
  folders: NoteFoldersSettings,
  onRecord?: (done: number, total: number) => void,
): Promise<BackgroundImportReport> {
  return new BackgroundImporter(vault, folders).import(jsonPath, onRecord)
}
