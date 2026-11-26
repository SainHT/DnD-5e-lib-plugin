import { describe, expect, it, vi } from 'vitest'
import { collectImportPaths, readImportFile, type VaultAdapter } from '../fileHandler'

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
  it('collects JSON paths in directories without reading file contents', async () => {
    const adapter = new FixtureAdapter(
      {
        'data/spells/spells.json': '{"spell":[{"name":"Light"}]}',
        'data/spells/readme.txt': 'ignore',
        'data/bestiary/monsters.json': '{"monster":[{"name":"Goblin"}]}',
      },
      ['data', 'data/spells', 'data/bestiary'],
    )
    const readSpy = vi.spyOn(adapter, 'read')

    await expect(collectImportPaths(adapter, 'data')).resolves.toEqual([
      'data/spells/spells.json',
      'data/bestiary/monsters.json',
    ])
    expect(readSpy).not.toHaveBeenCalled()
  })

  it('reads and detects category from a single JSON file in one pass', async () => {
    const adapter = new FixtureAdapter(
      {
        'data/items.json': '{"item":[{"name":"Torch"}]}',
        'data/unknown.json': '{"fluff":[{"name":"Torch"}]}',
      },
      ['data'],
    )

    await expect(readImportFile(adapter, 'data/items.json')).resolves.toEqual({
      path: 'data/items.json',
      category: 'items',
      data: { item: [{ name: 'Torch' }] },
      records: [{ name: 'Torch' }],
    })

    await expect(readImportFile(adapter, 'data/items.json', 'items')).resolves.toEqual({
      path: 'data/items.json',
      category: 'items',
      data: { item: [{ name: 'Torch' }] },
      records: [{ name: 'Torch' }],
    })

    await expect(readImportFile(adapter, 'data/unknown.json')).resolves.toBeNull()
  })

  it('rejects folders with no JSON files', async () => {
    const adapter = new FixtureAdapter({ 'data/items.txt': '{}' }, ['data'])
    await expect(collectImportPaths(adapter, 'data/items.txt')).rejects.toThrow(
      'The folder contains no recognized 5etools JSON files.',
    )
  })
})
