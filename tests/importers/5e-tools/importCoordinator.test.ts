import { describe, expect, it } from 'vitest'
import { FiveEToolsImportCoordinator } from '../../../src/importers/5e-tools'
import type { VaultAdapter } from '../../../src/importers/5e-tools/fileHandler'

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

describe('5etools import pipeline', () => {
  it('reads and counts records without writing files', async () => {
    const notices: string[] = []
    const report = await new FiveEToolsImportCoordinator(new Adapter(), message => notices.push(message)).import('spells.json', 'spells')

    expect(report).toEqual({ files: 1, items: 1 })
    expect(notices.at(-1)).toBe('5etools data found: 1 item in 1 JSON file.')
  })
})
