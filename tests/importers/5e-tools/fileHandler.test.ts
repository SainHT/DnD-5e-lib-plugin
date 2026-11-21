import { describe, expect, it } from 'vitest'
import { findImportFiles, readImportFiles, type VaultAdapter } from '../../../src/importers/5e-tools/fileHandler'

class FixtureAdapter implements VaultAdapter {
  constructor(private readonly files: Record<string, string>, private readonly folders: string[]) {}

  async exists(path: string): Promise<boolean> {
    return path in this.files || this.folders.includes(path)
  }

  async list(path: string) {
    const prefix = path ? `${path}/` : ''
    return {
      files: Object.keys(this.files).filter(file => file.startsWith(prefix) && !file.slice(prefix.length).includes('/')),
      folders: this.folders.filter(folder => folder.startsWith(prefix) && !folder.slice(prefix.length).includes('/')),
    }
  }

  async read(path: string): Promise<string> {
    return this.files[path]
  }
}

describe('5etools file handling', () => {
  it('filters directory imports to JSON files in standard categories', async () => {
    const adapter = new FixtureAdapter(
      {
        'data/spells/spells.json': '{"spell":[{"name":"Light"}]}',
        'data/spells/readme.txt': 'ignore',
        'data/bestiary/monsters.json': '{"monster":[{"name":"Goblin"}]}',
      },
      ['data', 'data/spells', 'data/bestiary'],
    )

    await expect(findImportFiles(adapter, 'data')).resolves.toEqual([
      { path: 'data/spells/spells.json', category: 'spells' },
      { path: 'data/bestiary/monsters.json', category: 'bestiary' },
    ])
  })

  it('auto-detects or accepts an explicit category for a single JSON file', async () => {
    const adapter = new FixtureAdapter(
      {
        'data/items.json': '{"item":[{"name":"Torch"}]}',
        'data/unknown.json': '{"fluff":[{"name":"Torch"}]}',
      },
      ['data'],
    )

    // Auto-detects category from top-level key when no manual category is passed
    await expect(findImportFiles(adapter, 'data/items.json')).resolves.toEqual([
      { path: 'data/items.json', category: 'items' },
    ])

    // Explicit category override still works
    await expect(findImportFiles(adapter, 'data/items.json', 'items')).resolves.toEqual([
      { path: 'data/items.json', category: 'items' },
    ])

    // Rejects when category cannot be auto-detected and none is provided
    await expect(findImportFiles(adapter, 'data/unknown.json')).rejects.toThrow(
      'Could not detect a 5etools category',
    )
  })

  it('rejects non-JSON files', async () => {
    const adapter = new FixtureAdapter({ 'data/items.txt': '{}' }, ['data'])
    await expect(findImportFiles(adapter, 'data/items.txt')).rejects.toThrow('The folder contains no recognized 5etools JSON files.')
  })

  it('reads named records from a 5etools file', async () => {
    const adapter = new FixtureAdapter({ 'spells.json': '{"spell":[{"name":"Light"}]}' }, [])
    await expect(readImportFiles(adapter, [{ path: 'spells.json', category: 'spells' }])).resolves.toEqual([
      { path: 'spells.json', category: 'spells', records: [{ name: 'Light' }] },
    ])
  })
})
