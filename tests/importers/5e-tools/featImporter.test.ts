import { describe, expect, it } from 'vitest'
import { DEFAULT_NOTE_FOLDERS } from '../../../src/platform'
import { importFeats, type FeatVault } from '../../../src/importers/5e-tools/importers/featImporter'

class FixtureVault implements FeatVault {
  readonly created: string[] = []

  async exists(): Promise<boolean> {
    return false
  }

  async list(): Promise<{ files: string[]; folders: string[] }> {
    return { files: [], folders: [] }
  }

  async read(): Promise<string> {
    return JSON.stringify({
      feat: [
        { name: 'Current Feat', category: 'G', entries: ['Current'] },
        { name: 'Reprinted Feat', reprintedAs: ['Current Feat'], category: 'G', entries: ['Old'] },
      ],
    })
  }

  async create(path: string): Promise<void> {
    this.created.push(path)
  }
}

describe('feat importer', () => {
  it('skips feats that have been reprinted', async () => {
    const vault = new FixtureVault()

    await expect(importFeats(vault, 'feats.json', DEFAULT_NOTE_FOLDERS)).resolves.toEqual({ imported: 1, skipped: 0 })
    expect(vault.created).toEqual(['SRD 5.2.1/feats/current-feat.md'])
  })
})
