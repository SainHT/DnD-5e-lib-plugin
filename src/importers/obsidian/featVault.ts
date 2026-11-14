import { type App, normalizePath } from 'obsidian'

import type { FeatVault } from '../5e-tools/importers/featImporter'

export function featVaultFromApp(app: App): FeatVault {
  return {
    exists: async path => Boolean(app.vault.getAbstractFileByPath(normalizePath(path))),
    list: path => app.vault.adapter.list(normalizePath(path)),
    read: async path => {
      const file = app.vault.getFileByPath(normalizePath(path))
      if (!file) throw new Error(`The JSON file was not found: ${path}`)
      return app.vault.read(file)
    },
    create: (path, content) => app.vault.create(normalizePath(path), content),
    modify: async (path, content) => {
      const file = app.vault.getFileByPath(normalizePath(path))
      if (!file) throw new Error(`The feat file was not found: ${path}`)
      return app.vault.modify(file, content)
    },
    createFolder: path => app.vault.createFolder(normalizePath(path)),
    getFolderByPath: path => app.vault.getFolderByPath(normalizePath(path)),
  }
}
