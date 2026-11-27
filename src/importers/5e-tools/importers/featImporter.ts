import type { NoteFoldersSettings } from '../../../platform'
import { mapFeat } from '../mappers/featMapper'
import { fiveEToolsFolderFor } from '../index'
import type { FiveEToolsRecord, MappedNote } from '../types'
import { EntityImporter, type ImportCounts, type WritableVault } from './entityImporter'

export type FeatVault = WritableVault

export type FeatImportReport = ImportCounts

/**
 * Imports current feats from one 5etools JSON file.
 */
export class FeatImporter extends EntityImporter {
  protected readonly recordKeys = ['feat']
  protected readonly entityName = 'feat'

  protected map(record: FiveEToolsRecord): Promise<MappedNote> {
    return mapFeat(record)
  }

  protected folderFor(): string {
    return fiveEToolsFolderFor('feat', this.folders)
  }
}

/**
 * Imports current feats from one 5etools JSON file.
 *
 * @param vault Writable vault adapter.
 * @param jsonPath Vault path to a feat JSON file.
 * @param folders Configured rules-folder settings.
 * @returns Import counts.
 */
export async function importFeats(
  vault: FeatVault,
  source: string | Record<string, unknown> | FiveEToolsRecord[],
  folders: NoteFoldersSettings,
  onRecord?: (done: number, total: number) => void,
): Promise<FeatImportReport> {
  return new FeatImporter(vault, folders).import(source, onRecord)
}
