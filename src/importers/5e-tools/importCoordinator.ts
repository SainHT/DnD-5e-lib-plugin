import { findImportFiles, readImportFiles, type VaultAdapter } from './fileHandler'
import { importFeats } from './importers/featImporter'
import { importSpells } from './importers/spellImporter'
import { importMonsters } from './importers/monsterImporter'
import { importItems } from './importers/itemImporter'
import { importBackgrounds } from './importers/backgroundImporter'
import type { ImportCounts, WritableVault } from './importers/entityImporter'
import { DEFAULT_NOTE_FOLDERS, type NoteFoldersSettings } from '../../platform'
import type { FiveEToolsCategory } from './types'

export interface ImportProgress {
  file: string
  current: number
  total: number
}

export interface ImportReport {
  files: number
  items: number
}

type CategoryImporter = (
  vault: WritableVault,
  path: string,
  folders: NoteFoldersSettings,
  onRecord?: (done: number, total: number) => void,
) => Promise<ImportCounts>

const CATEGORY_IMPORTERS: Record<FiveEToolsCategory, CategoryImporter> = {
  feats: importFeats,
  spells: importSpells,
  bestiary: importMonsters,
  items: importItems,
  backgrounds: importBackgrounds,
}

export class FiveEToolsImportCoordinator {
  constructor(
    private readonly adapter: VaultAdapter,
    private readonly notify: (message: string) => void = () => {},
    private readonly folders: () => NoteFoldersSettings = () => DEFAULT_NOTE_FOLDERS,
  ) {}

  async import(path: string, category?: FiveEToolsCategory, onProgress?: (progress: ImportProgress) => void): Promise<ImportReport> {
    try {
      const candidates = await findImportFiles(this.adapter, path, category)
      const files = await readImportFiles(this.adapter, candidates)
      const report: ImportReport = {
        files: files.length,
        items: files.reduce((count, file) => count + file.records.length, 0),
      }

      for (const file of files) {
        const fileName = file.path.split('/').pop() ?? file.path
        if (isWritableVault(this.adapter)) {
          const importer = CATEGORY_IMPORTERS[file.category]
          if (importer) {
            onProgress?.({ file: fileName, current: 0, total: file.records.length })
            await importer(this.adapter, file.path, this.folders(), (fileDone, fileTotal) => {
              onProgress?.({ file: fileName, current: fileDone, total: fileTotal })
            })
          }
        }
      }
      this.notify(
        `5etools data found: ${report.items} ${report.items === 1 ? 'item' : 'items'} in ${report.files} ${
          report.files === 1 ? 'JSON file' : 'JSON files'
        }.`,
      )
      return report
    } catch (cause) {
      const error = cause instanceof Error ? cause.message : String(cause)
      this.notify(`import failed: ${error}`)
      throw cause
    }
  }
}

/**
 * Checks whether an adapter supports note creation in the vault.
 *
 * @param adapter Candidate vault adapter.
 * @returns True when the adapter is a writable vault.
 */
export function isWritableVault(adapter: VaultAdapter): adapter is WritableVault {
  return 'create' in adapter && typeof adapter.create === 'function' && 'list' in adapter && typeof adapter.list === 'function'
}
