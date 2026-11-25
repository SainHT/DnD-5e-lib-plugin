import { describe, expect, it } from 'vitest'
import { FiveEToolsImportCoordinator, type ImportProgress } from '../importCoordinator'
import type { VaultAdapter } from '../fileHandler'
import type { WritableVault } from '../importers/entityImporter'

class Adapter implements VaultAdapter {
  async exists(path: string): Promise<boolean> {
    return path === 'spells.json'
  }
  async list(): Promise<{ files: string[]; folders: string[] }> {
    return { files: [], folders: [] }
  }
  async read(): Promise<string> {
    return '{"spell":[{"name":"Light","level":0}]}'
  }
}

class WritableAdapter extends Adapter implements WritableVault {
  readonly created: string[] = []
  async exists(path: string): Promise<boolean> {
    return path === 'spells.json'
  }
  async create(path: string): Promise<void> {
    this.created.push(path)
  }
}

describe('5etools import pipeline', () => {
  it('reads and counts records without writing files', async () => {
    const notices: string[] = []
    const report = await new FiveEToolsImportCoordinator(new Adapter(), message => notices.push(message)).import('spells.json', 'spells')

    expect(report).toEqual({ files: 1, items: 1 })
    expect(notices).toEqual(['5etools data found: 1 item in 1 JSON file.'])
  })

  it('emits no progress updates for a read-only adapter', async () => {
    const progress: ImportProgress[] = []
    const notices: string[] = []
    await new FiveEToolsImportCoordinator(new Adapter(), message => notices.push(message)).import(
      'spells.json',
      'spells',
      p => progress.push(p),
    )

    expect(progress).toEqual([])
    expect(notices).toEqual(['5etools data found: 1 item in 1 JSON file.'])
  })

  it('emits per-file progress updates for a writable adapter and only overall notice at the end', async () => {
    const progress: ImportProgress[] = []
    const notices: string[] = []
    const adapter = new WritableAdapter()
    await new FiveEToolsImportCoordinator(adapter, message => notices.push(message)).import(
      'spells.json',
      'spells',
      p => progress.push(p),
    )

    expect(progress).toEqual([
      { file: 'spells.json', current: 0, total: 1 },
      { file: 'spells.json', current: 1, total: 1 },
    ])
    expect(notices).toEqual(['5etools data found: 1 item in 1 JSON file.'])
  })
})
