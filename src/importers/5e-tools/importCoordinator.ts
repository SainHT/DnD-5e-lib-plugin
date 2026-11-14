import { findImportFiles, readImportFiles, type VaultAdapter } from './fileHandler'
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
}
