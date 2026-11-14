import { findImportFiles, readImportFiles, type VaultAdapter } from './fileHandler'
import { importFeats, type FeatVault } from './importers/featImporter'
import { DEFAULT_NOTE_FOLDERS, type NoteFoldersSettings } from '../../platform'
import type { FiveEToolsCategory } from './types'

export interface ImportProgress {
  done: number
  total: number
}

export interface ImportReport {
  files: number
  items: number
}

export class FiveEToolsImportCoordinator {
  constructor(
    private readonly adapter: VaultAdapter,
    private readonly notify: (message: string) => void = () => {},
    private readonly folders: () => NoteFoldersSettings = () => DEFAULT_NOTE_FOLDERS,
  ) {}

  async import(path: string, category?: FiveEToolsCategory, onProgress?: (progress: ImportProgress) => void): Promise<ImportReport> {
    try {
      this.notify('Scanning data…')
      const candidates = await findImportFiles(this.adapter, path, category)
      const files = await readImportFiles(this.adapter, candidates)
      const report: ImportReport = {
        files: files.length,
        items: files.reduce((count, file) => count + file.records.length, 0),
      }
      const total = report.items
      let done = 0

      for (const file of files) {
        if (file.category === 'feats') await this.importFeats(file.path)
        for (let index = 0; index < file.records.length; index += 1) {
          done += 1
          onProgress?.({ done, total })
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

  private async importFeats(path: string): Promise<void> {
    if (!isFeatVault(this.adapter)) throw new Error('Feat imports require a writable Obsidian vault.')
    await importFeats(this.adapter, path, this.folders())
  }
}

function isFeatVault(adapter: VaultAdapter): adapter is FeatVault {
  return 'create' in adapter && typeof adapter.create === 'function' && 'list' in adapter && typeof adapter.list === 'function'
}
