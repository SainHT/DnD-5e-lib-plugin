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
        { name: 'Basic Rules Feat', basicRules2024: true, source: 'XPHB', category: 'G', entries: ['Basic'] },
        { name: 'SRD Bool Feat', srd52: true, source: 'XPHB', category: 'G', entries: ['SRD'] },
        { name: 'SRD Source Feat', source: 'srd52', category: 'G', entries: ['SRD'] },
        { name: 'Reprinted Feat', reprintedAs: ['Current Feat'], category: 'G', entries: ['Old'] },
      ],
    })
  }

  async create(path: string): Promise<void> {
    this.created.push(path)
  }
}

describe('feat importer', () => {
  it('skips feats that have been reprinted or belong to srd52 while keeping basicRules2024', async () => {
    const vault = new FixtureVault()

    await expect(importFeats(vault, 'feats.json', DEFAULT_NOTE_FOLDERS)).resolves.toEqual({ imported: 2, skipped: 2 })
    expect(vault.created).toEqual([
      'Homebrew/5etools/feats/current-feat.md',
      'Homebrew/5etools/feats/basic-rules-feat.md',
    ])
  })
})
