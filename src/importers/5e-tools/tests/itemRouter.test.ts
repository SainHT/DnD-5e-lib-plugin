import { describe, expect, it } from 'vitest'
import {
  importItems,
  itemKind,
  routeItemCategory,
  shouldExcludeItem,
  type ItemVault,
} from '../'
import { DEFAULT_NOTE_FOLDERS } from '../../../platform'  

describe('item category router', () => {
  it('excludes Futuristic, Modern, and Renaissance records', () => {
    expect(shouldExcludeItem({ age: 'renaissance' })).toBe(true)
    expect(shouldExcludeItem({ age: 'modern' })).toBe(true)
    expect(shouldExcludeItem({ age: 'futuristic' })).toBe(true)
    expect(shouldExcludeItem({ age: 'medieval' })).toBe(false)
    expect(shouldExcludeItem({ source: 'Futuristic' })).toBe(false)
    expect(shouldExcludeItem({ edition: 'Modern' })).toBe(false)
    expect(shouldExcludeItem({ category: 'Renaissance Weapons' })).toBe(false)
    expect(shouldExcludeItem({ tags: ['modern'] })).toBe(false)
  })

  it('routes weapons, armor, tools, gear, treasure, and other categories', () => {
    expect(itemKind({ type: 'M|XPHB', weapon: true })).toBe('Weapons')
    expect(itemKind({ type: 'R|XPHB', firearm: true })).toBe('Weapons')
    expect(itemKind({ type: 'A|XPHB' })).toBe('Weapons')
    expect(itemKind({ type: 'LA|XPHB' })).toBe('Armor and Shield')
    expect(itemKind({ type: 'MA|XPHB' })).toBe('Armor and Shield')
    expect(itemKind({ type: 'HA|XPHB' })).toBe('Armor and Shield')
    expect(itemKind({ type: 'S|XPHB' })).toBe('Armor and Shield')
    expect(itemKind({ type: 'AT|XPHB' })).toBe('Tools')
    expect(itemKind({ type: 'GS|XPHB' })).toBe('Tools')
    expect(itemKind({ type: 'INS|XPHB' })).toBe('Tools')
    expect(itemKind({ type: 'G|XPHB' })).toBe('Adventuring gear')
    expect(itemKind({ type: 'POT|XPHB' })).toBe('Adventuring gear')
    expect(itemKind({ type: 'SCF|XPHB' })).toBe('Adventuring gear')
    expect(itemKind({ type: 'TGEM|XPHB' })).toBe('Treasure')
    expect(itemKind({ type: 'GV|XPHB' })).toBe('Other')
  })

  it('supports treasure routing and unknown-item fallback', () => {
    expect(routeItemCategory({ type: 'Treasure (Gemstone)|XPHB' })).toBe('Treasure')
    expect(routeItemCategory({ type: 'Trade Good|XPHB' })).toBe('Treasure')
    expect(routeItemCategory({ type: 'Unknown|XPHB' })).toBe('Other')
    expect(routeItemCategory({ age: 'modern', type: 'M|DMG' })).toBe('Excluded')
    expect(routeItemCategory({ source: 'Modern', type: 'M|DMG' })).toBe('Weapons')
  })

  it('skips excluded eras and treasure during item import', async () => {
    const created: string[] = []
    const vault: ItemVault = {
      exists: async () => false,
      list: async () => ({ files: [], folders: [] }),
      read: async () => JSON.stringify({
        item: [
          { name: 'Modern Rifle', age: 'modern', source: 'DMG', type: 'R|DMG', weapon: true, rarity: 'none' },
          { name: 'Diamond', source: 'XPHB', type: 'Treasure (Gemstone)|XPHB', rarity: 'none' },
          { name: 'Unknown Token', source: 'XPHB', type: 'GV|XPHB', rarity: 'none' },
        ],
      }),
      create: async path => {
        created.push(path)
      },
    }

    await expect(importItems(vault, 'items.json', DEFAULT_NOTE_FOLDERS)).resolves.toEqual({ imported: 1, skipped: 2 })
    expect(created).toEqual(['Homebrew/5etools/items/unknown-token.md'])
  })

  it('imports magic items through the magic-items folder', async () => {
    const created: string[] = []
    const vault: ItemVault = {
      exists: async () => false,
      list: async () => ({ files: [], folders: [] }),
      read: async () => JSON.stringify({
        item: [
          { name: 'Shield', source: 'XPHB', type: 'S|XPHB', rarity: 'none' },
          { name: 'Shield of Test', source: 'XPHB', type: 'S|XPHB', rarity: 'rare' },
        ],
      }),
      create: async path => {
        created.push(path)
      },
    }

    await expect(importItems(vault, 'items.json', DEFAULT_NOTE_FOLDERS)).resolves.toEqual({ imported: 2, skipped: 0 })
    expect(created).toEqual([
      'Homebrew/5etools/items/shield.md',
      'Homebrew/5etools/magic-items/shield-of-test.md',
    ])
  })
})
