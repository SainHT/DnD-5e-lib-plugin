import { collectImportPaths, isJson, readImportFile, type VaultAdapter } from './fileHandler'
import { importFeats } from './importers/featImporter'
import { importSpells } from './importers/spellImporter'
import { importMonsters } from './importers/monsterImporter'
import { importItems } from './importers/itemImporter'
import type { ImportCounts, WritableVault } from './importers/entityImporter'
import { DEFAULT_NOTE_FOLDERS, type NoteFoldersSettings } from '../../platform'
import type { FiveEToolsCategory, FiveEToolsRecord } from './types'

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
  source: string | Record<string, unknown> | FiveEToolsRecord[],
  folders: NoteFoldersSettings,
  onRecord?: (done: number, total: number) => void,
) => Promise<ImportCounts>

const CATEGORY_IMPORTERS: Record<FiveEToolsCategory, CategoryImporter> = {
  feats: importFeats,
  spells: importSpells,
  bestiary: importMonsters,
  items: importItems,
}

export class FiveEToolsImportCoordinator {
  constructor(
    private readonly adapter: VaultAdapter,
    private readonly notify: (message: string) => void = () => {},
    private readonly folders: () => NoteFoldersSettings = () => DEFAULT_NOTE_FOLDERS,
  ) {}

  async import(path: string, category?: FiveEToolsCategory, onProgress?: (progress: ImportProgress) => void): Promise<ImportReport> {
    try {
      const paths = await collectImportPaths(this.adapter, path)
      const isSingleFile = paths.length === 1 && isJson(paths[0]) && isJson(path)
      let files = 0
      let items = 0

      for (const filePath of paths) {
        const parsed = await readImportFile(this.adapter, filePath, isSingleFile ? category : undefined)
        if (!parsed) {
          if (isSingleFile) throw new Error(`Could not detect a 5etools category for: ${filePath}`)
          continue
        }

        files += 1
        items += parsed.records.length

        if (isWritableVault(this.adapter)) {
          const importer = CATEGORY_IMPORTERS[parsed.category]
          if (importer) {
            const fileName = parsed.path.split('/').pop() ?? parsed.path
            onProgress?.({ file: fileName, current: 0, total: parsed.records.length })
            await importer(this.adapter, parsed.data, this.folders(), (fileDone, fileTotal) => {
              onProgress?.({ file: fileName, current: fileDone, total: fileTotal })
            })
          }
        }
      }

      if (files === 0) {
        throw new Error('The folder contains no recognized 5etools JSON files.')
      }

      const report: ImportReport = { files, items }
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
