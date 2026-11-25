import { type App, normalizePath } from 'obsidian'

import type { WritableVault } from '../5e-tools/importers/entityImporter'

/**
 * Builds the vault adapter the 5e-tools importer uses to read JSON and write notes.
 *
 * @param app Obsidian app.
 * @returns Writable vault backed by the app vault.
 */
export function writableVaultFromApp(app: App): WritableVault {
  return {
    exists: async path => Boolean(app.vault.getAbstractFileByPath(normalizePath(path))),
    list: path => app.vault.adapter.list(normalizePath(path)),
    read: async path => {
      const file = app.vault.getFileByPath(normalizePath(path))
      if (!file) throw new Error(`The JSON file was not found: ${path}`)
      return app.vault.read(file)
    },
    create: (path, content) => app.vault.create(normalizePath(path), content),
    createFolder: path => app.vault.createFolder(normalizePath(path)),
    getFolderByPath: path => app.vault.getFolderByPath(normalizePath(path)),
  }
}
