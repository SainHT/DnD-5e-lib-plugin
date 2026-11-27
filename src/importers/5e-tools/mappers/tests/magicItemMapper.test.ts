import { describe, expect, it } from 'vitest'
import {
  cleanMagicItemInlineTags,
  importItems,
  mapItem,
  mapMagicItemRecord,
  type ItemVault,
} from '../../'
import { DEFAULT_NOTE_FOLDERS } from '../../../../platform'

const bagOfHolding = {
  name: 'Bag of Holding',
  source: 'XDMG',
  srd52: true,
  basicRules2024: true,
  rarity: 'uncommon',
  wondrous: true,
  weight: 15,
  entries: ['This bag has an extradimensional space.'],
}

const staffOfPower = {
  name: 'Staff of Power',
  source: 'XDMG',
  srd52: true,
  basicRules2024: true,
  type: 'M|XPHB',
  rarity: 'very rare',
  reqAttune: 'by a sorcerer, warlock, or wizard',
  reqAttuneTags: [
    { class: 'sorcerer' },
    { class: 'warlock' },
    { class: 'wizard' },
  ],
  weight: 4,
  weaponCategory: 'simple',
  dmg1: '1d6',
  dmgType: 'B',
  dmg2: '1d8',
  bonusWeapon: '+2',
  bonusSpellAttack: '+2',
  bonusAc: '+2',
  bonusSavingThrow: '+2',
  recharge: 'dawn',
  rechargeAmount: '{@dice 2d8 + 4}',
  charges: 20,
  staff: true,
  entries: [
    'This staff has 20 charges and grants a +2 bonus to {@variantrule Armor Class|XPHB}.',
    {
      type: 'entries',
      name: 'Spells',
      entries: ['Cast {@spell Fireball|XPHB} using {@dc 17} or spend {@chance 50} chance.'],
    },
  ],
  attachedSpells: {
    charges: {
      1: ['magic missile|xphb', 'ray of enfeeblement|xphb'],
      5: ['fireball|xphb', 'cone of cold|xphb'],
    },
  },
}

const beltOfGiantStrength = {
  name: 'Belt of Giant Strength',
  source: 'XDMG',
  srd52: true,
  basicRules2024: true,
  rarity: 'varies',
  reqAttune: true,
  wondrous: true,
  entries: [{
    type: 'table',
    colLabels: ['Belt', 'Str.', 'Rarity'],
    colStyles: ['col-8', 'col-2 text-center', 'col-2'],
    rows: [
      ['{@item Belt of Hill Giant Strength|XDMG}', '21', 'Rare'],
      ['{@item Belt of Frost Giant Strength|XDMG}', '23', 'Very Rare'],
    ],
  }],
  items: [
    'Belt of Cloud Giant Strength|XDMG',
    'Belt of Fire Giant Strength|XDMG',
  ],
  itemsHidden: true,
}

describe('magic item mapper', () => {
  it('maps standard magic items with frontmatter and vault-item metadata', async () => {
    const mapped = await mapItem(bagOfHolding)
    const markdown = mapped.markdown
    expect(mapped.kind).toBe('magicItem')
    expect(markdown).toContain('title: "Bag of Holding"')
    expect(markdown).toContain('source: "XDMG"')
    expect(markdown).toContain('item_type: "Wondrous Item"')
    expect(markdown).toContain('rarity: "uncommon"')
    expect(markdown).toContain('requires_attunement: false')
    expect(markdown).toContain('wondrous: true')
    expect(markdown).toContain('weight: 15')
    expect(markdown).toContain('  - "magic-item"')
    expect(markdown).not.toContain('  - "item"\n')
    expect(markdown).not.toContain('item/magic')
    expect(markdown).not.toContain('srd-5-2-1')
    expect(markdown).toContain('*Uncommon | Source: XDMG*')
    expect(markdown).toContain('This bag has an extradimensional space.')
    expect(markdown).toContain('```vault-item\nweight: 15\n```')
    expect(markdown).toMatch(/export_hash: "sha256-[0-9a-f]{12}"/)
  })

  it('maps Staff of Power charges, restrictions, bonuses, spells, and inline tags', async () => {
    const markdown = (await mapMagicItemRecord(staffOfPower)).markdown
    expect(markdown).toContain('rarity: "very rare"')
    expect(markdown).toContain('requires_attunement: true')
    expect(markdown).toContain('attunement_restriction:')
    expect(markdown).toContain('charges: 20')
    expect(markdown).toContain('recharge: "dawn"')
    expect(markdown).toContain('recharge_amount: "2d8 + 4"')
    expect(markdown).toContain('bonus_ac: "+2"')
    expect(markdown).toContain('bonus_weapon: "+2"')
    expect(markdown).toContain('bonus_saving_throw: "+2"')
    expect(markdown).toContain('bonus_spell_attack: "+2"')
    expect(markdown).toContain('| Spell | Charge Cost |')
    expect(markdown).toContain('| Magic Missile | 1 |')
    expect(markdown).toContain('| Cone Of Cold | 5 |')
    expect(markdown).toContain('Armor Class')
    expect(markdown).toContain('DC 17')
    expect(markdown).toContain('50% chance')
    expect(markdown).not.toContain('{@')
  })

  it('maps variable-rarity item groups and table variants', async () => {
    const markdown = (await mapMagicItemRecord(beltOfGiantStrength)).markdown
    expect(markdown).toContain('item_type: "Item Group"')
    expect(markdown).toContain('rarity: "varies"')
    expect(markdown).toContain('requires_attunement: true')
    expect(markdown).toContain('| Belt | Str. | Rarity |')
    expect(markdown).toContain('| Belt of Hill Giant Strength | 21 | Rare |')
    expect(markdown).toContain('Belt of Cloud Giant Strength')
  })

  it('imports magic items into the configured magic-items folder', async () => {
    const created: string[] = []
    const vault: ItemVault = {
      exists: async () => false,
      list: async () => ({ files: [], folders: [] }),
      read: async () => JSON.stringify({
        item: [
          { ...bagOfHolding, srd52: undefined },
          { ...bagOfHolding, name: 'Skipped SRD Item', srd52: true },
        ],
      }),
      create: async path => {
        created.push(path)
      },
    }
    await expect(importItems(vault, 'items.json', DEFAULT_NOTE_FOLDERS)).resolves.toEqual({ imported: 1, skipped: 1 })
    expect(created).toEqual(['Homebrew/5etools/magic-items/bag-of-holding.md'])
  })

  it('cleans inline tags and accepts direct builder use', () => {
    expect(cleanMagicItemInlineTags('{@variantrule Armor Class|XPHB}')).toBe('Armor Class')
    expect(cleanMagicItemInlineTags('{@dice 2d8 + 4}')).toBe('2d8 + 4')
  })

  it('recursively renders Very Cool Tattoo named entries and nested lists', async () => {
    const tattoo = {
      name: 'Very Cool Tattoo',
      source: 'XDMG',
      rarity: 'legendary',
      wondrous: true,
      entries: [{
        type: 'entries',
        name: 'Impresive Strikes',
        entries: [
          'Once on each of your turns, you can deal extra damage.',
          {
            type: 'list',
            items: [
              'The attack deals {@damage 4d6} extra damage.',
              'The tattoo sheds bright light.',
            ],
          },
        ],
      }],
    }

    const markdown = (await mapMagicItemRecord(tattoo)).markdown

    expect(markdown).toContain('**Impresive Strikes.**')
    expect(markdown).toContain('Once on each of your turns, you can deal extra damage.')
    expect(markdown).toContain('- The attack deals 4d6 extra damage.')
    expect(markdown).toContain('- The tattoo sheds bright light.')
  })

  it('maps Great Goggles curse true with charges and recharge metadata', async () => {
    const goggles = {
      name: 'Great Goggles',
      source: 'XDMG',
      rarity: 'rare',
      curse: true,
      wondrous: true,
      charges: 3,
      recharge: 'dawn',
      rechargeAmount: '{@dice 1d3}',
      entries: ['A curse consumes the wearers sight.'],
    }

    const markdown = (await mapMagicItemRecord(goggles)).markdown

    expect(markdown).toContain('cursed: true')
    expect(markdown).toContain('  - "cursed"')
    expect(markdown).toContain('charges: 3')
    expect(markdown).toContain('recharge: "dawn"')
    expect(markdown).toContain('recharge_amount: "1d3"')
  })
})
