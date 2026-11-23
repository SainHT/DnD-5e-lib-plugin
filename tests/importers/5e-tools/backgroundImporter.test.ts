import { describe, expect, it, vi } from 'vitest'
import { importBackgrounds } from '../../../src/importers/5e-tools/importers/backgroundImporter'
import { FiveEToolsImportCoordinator } from '../../../src/importers/5e-tools/importCoordinator'
import { findImportFiles } from '../../../src/importers/5e-tools/fileHandler'
import { DEFAULT_NOTE_FOLDERS } from '../../../src/platform'

describe('BackgroundImporter', () => {
  it('imports backgrounds into the configured backgrounds folder', async () => {
    const createdNotes: { path: string; content: string }[] = []
    const mockVault = {
      read: vi.fn(async () =>
        JSON.stringify({
          background: [
            {
              name: 'Acolyte',
              source: 'PHB',
              entries: [
                {
                  type: 'list',
                  items: [
                    {
                      type: 'item',
                      name: 'Skill Proficiencies:',
                      entry: '{@skill Insight}, {@skill Religion}',
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ),
      create: vi.fn(async (path: string, content: string) => {
        createdNotes.push({ path, content })
        return {}
      }),
      list: vi.fn(async () => ({ files: [], folders: [] })),
      exists: vi.fn(async (path?: string) => {
        // If checking note destination path, return false so it gets created
        if (path && path.endsWith('.md')) return false
        return true
      }),
    }

    const progressReports: [number, number][] = []
    const report = await importBackgrounds(
      mockVault as any,
      'test/backgrounds.json',
      DEFAULT_NOTE_FOLDERS,
      (done, total) => progressReports.push([done, total]),
    )

    expect(report.imported).toBe(1)
    expect(report.skipped).toBe(0)
    expect(createdNotes).toHaveLength(1)
    expect(createdNotes[0].path).toBe('SRD 5.2.1/backgrounds/acolyte.md')
    expect(createdNotes[0].content).toContain('title: Acolyte')
    expect(progressReports).toEqual([[1, 1]])
  })

  it('detects background category and imports via FiveEToolsImportCoordinator', async () => {
    const mockAdapter = {
      exists: vi.fn(async (path?: string) => {
        // If checking note destination path, return false so it gets created
        if (path && path.endsWith('.md')) return false
        return true
      }),
      list: vi.fn(async () => ({ files: ['test/backgrounds.json'], folders: [] })),
      read: vi.fn(async () =>
        JSON.stringify({
          background: [
            {
              name: 'Folk Hero',
              source: 'PHB',
            },
          ],
        }),
      ),
      create: vi.fn(async () => ({})),
    }

    const candidates = await findImportFiles(mockAdapter as any, 'test/backgrounds.json')
    expect(candidates).toEqual([{ path: 'test/backgrounds.json', category: 'backgrounds' }])

    const notices: string[] = []
    const coordinator = new FiveEToolsImportCoordinator(mockAdapter as any, msg => notices.push(msg))
    const report = await coordinator.import('test/backgrounds.json')

    expect(report.files).toBe(1)
    expect(report.items).toBe(1)
    expect(notices[0]).toContain('5etools data found: 1 item in 1 JSON file.')
  })
})
