import { describe, expect, it } from 'vitest'
import {
  importItems,
  mapItem,
  type ItemVault,
} from '../../'
import { DEFAULT_NOTE_FOLDERS } from '../../../../platform'

const alchemistSupplies = {
  name: "Alchemist's Supplies",
  source: 'XPHB',
  srd52: true,
  basicRules2024: true,
  rarity: 'none',
  type: 'AT|XPHB',
  weight: 8,
  value: 5000,
  entries: [
    { type: 'entries', name: 'Ability', entries: ['Intelligence'] },
    {
      type: 'entries',
      name: 'Utilize',
      entries: [
        'Identify a substance ({@dc 15}), or start a fire ({@dc 15})',
      ],
    },
    {
      type: 'entries',
      name: 'Craft',
      entries: [
        '{@item Acid|XPHB}, {@item Alchemist\'s Fire|XPHB}, {@item Component Pouch|XPHB}, {@item Oil|XPHB}, {@item Paper|XPHB}, {@item Perfume|XPHB}',
      ],
    },
  ],
}

describe('tool mapper', () => {
  it('renders the Alchemist Supplies frontmatter and nested metadata', async () => {
    const markdown = (await mapItem(alchemistSupplies)).markdown

    expect(markdown).toContain('title: "Alchemist\'s Supplies"')
    expect(markdown).toContain('source: "XPHB"')
    expect(markdown).toContain('item_type: "Artisan\'s Tools"')
    expect(markdown).toContain('cost_cp: 5000')
    expect(markdown).toContain('weight: 8')
    expect(markdown).toContain('  - "item/artisans-tools"')
    expect(markdown).not.toContain('srd-5-2-1')
    expect(markdown).toContain('- Ability: Intelligence')
    expect(markdown).toContain('- Utilize: Identify a substance (DC 15), or start a fire (DC 15)')
    expect(markdown).toContain("- Craft: Acid, Alchemist's Fire, Component Pouch, Oil, Paper, Perfume")
    expect(markdown).toContain('```vault-item\nweight: 8\n```')
    expect(markdown).toMatch(/export_hash: "sha256-[0-9a-f]{12}"/)
  })

  it('maps tool type codes and nested entries', async () => {
    expect((await mapItem({ ...alchemistSupplies, name: 'Dice Set', type: 'GS|XPHB' })).markdown)
      .toContain('item_type: "Gaming Set"')
    expect((await mapItem({ ...alchemistSupplies, name: 'Lute', type: 'INS|XPHB' })).markdown)
      .toContain('item_type: "Musical Instrument"')
  })

  it('cleans inline tags and converts currency', async () => {
    const markdown = (await mapItem(alchemistSupplies)).markdown
    expect(markdown).not.toContain('{@dc')
    expect(markdown).not.toContain('{@item')
    expect(markdown).toContain('DC 15')
    expect(markdown).toContain('cost_cp: 5000')
  })

  it('routes mundane tools into items and imports them through the vault', async () => {
    expect((await mapItem(alchemistSupplies)).kind).toBe('item')
    expect((await mapItem(alchemistSupplies)).markdown).toContain('item_type: "Artisan\'s Tools"')

    const created: string[] = []
    const vault: ItemVault = {
      exists: async () => false,
      list: async () => ({ files: [], folders: [] }),
      read: async () => JSON.stringify({ item: [{ ...alchemistSupplies, srd52: undefined }] }),
      create: async path => {
        created.push(path)
      },
    }
    await expect(importItems(vault, 'items.json', DEFAULT_NOTE_FOLDERS)).resolves.toEqual({ imported: 1, skipped: 0 })
    expect(created).toEqual(['Homebrew/5etools/items/alchemists-supplies.md'])
  })
})
