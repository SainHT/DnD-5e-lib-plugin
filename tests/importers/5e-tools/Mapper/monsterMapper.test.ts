import { describe, expect, it } from 'vitest'
import { bodyHash } from '../../../../src/compendium'
import { DEFAULT_NOTE_FOLDERS, parseNote } from '../../../../src/platform'
import {
  importMonsters,
  mapMonster,
  preprocessMonsterTags,
  type MonsterVault,
} from '../../../../src/importers/5e-tools'

const lich = {
  name: 'Lich',
  source: 'XMM',
  srd52: true,
  basicRules2024: true,
  size: ['M'],
  type: { type: 'undead', tags: ['wizard'] },
  alignment: ['N', 'E'],
  ac: [20],
  hp: { average: 315, formula: '42d8 + 126' },
  speed: { walk: 30 },
  initiative: { proficiency: 2 },
  str: 11,
  dex: 16,
  con: 16,
  int: 21,
  wis: 14,
  cha: 16,
  save: { dex: '+10', con: '+10', int: '+12', wis: '+9' },
  skill: { arcana: '+19', history: '+12', insight: '+9', perception: '+9' },
  senses: ['Truesight 120 ft.'],
  passive: 19,
  resist: ['cold', 'lightning'],
  immune: ['necrotic', 'poison'],
  conditionImmune: ['charmed', 'exhaustion', 'frightened', 'paralyzed', 'poisoned'],
  languages: ['all'],
  cr: { cr: '21', xpLair: 41000 },
  gear: ['component pouch|xphb'],
  spellcasting: [
    {
      name: 'Spellcasting',
      headerEntries: ['The lich casts one of the following spells, using Intelligence as the spellcasting ability (spell save {@dc 20}):'],
      will: ['{@spell Detect Magic|XPHB}', '{@spell Detect Thoughts|XPHB}'],
      daily: { '2e': ['{@spell Animate Dead|XPHB}', '{@spell Dimension Door|XPHB}'], '1e': ['{@spell Chain Lightning|XPHB}'] },
      displayAs: 'action',
    },
    {
      name: 'Protective Magic',
      headerEntries: ['The lich casts {@spell Counterspell|XPHB} or {@spell Shield|XPHB} in response to the spell\'s trigger.'],
      will: ['{@spell Counterspell|XPHB}', '{@spell Shield|XPHB}'],
      displayAs: 'reaction',
      hidden: ['will'],
    },
  ],
  trait: [
    { name: 'Spirit Jar', entries: ['If destroyed, the lich reforms in {@dice 1d10} days if it has all its {@variantrule Hit Points|XPHB}.'] },
  ],
  action: [
    { name: 'Eldritch Burst', entries: ['{@atkr m,r} {@hit 12}, reach 5 ft. or range 120 ft. {@h}31 ({@damage 4d12 + 5}) Force damage.'] },
    { name: 'Paralyzing Touch', entries: ['{@atkr m} {@hit 12}. {@h}15 ({@damage 3d6 + 5}) Cold damage, and the target has the {@condition Paralyzed|XPHB} condition.'] },
  ],
  legendaryActionsLair: 4,
  legendary: [
    { name: 'Disrupt Life', entries: ['{@actSave con} {@dc 20}, in a 20-foot {@variantrule Emanation [Area of Effect]|XPHB|Emanation}. {@actSaveFail} 31 ({@damage 9d6}) Necrotic damage. {@actSaveSuccess} Half damage.'] },
  ],
}

describe('monster mapper', () => {
  it('renders Lich frontmatter and core statblock fields', async () => {
    const markdown = (await mapMonster(lich)).markdown

    expect(markdown).toContain('title: "Lich"')
    expect(markdown).toContain('source: "XMM"')
    expect(markdown).not.toContain('srd-5-2-1')
    expect(markdown).toContain('cr: 21')
    expect(markdown).toContain('xp: 33000')
    expect(markdown).toContain('xp_lair: 41000')
    expect(markdown).toContain('type: "undead"')
    expect(markdown).toContain('subtype: "wizard"')
    expect(markdown).toContain('size: "Medium"')
    expect(markdown).toContain('alignment: "Neutral Evil"')
    expect(markdown).toContain('stats: [11, 16, 16, 21, 14, 16]')
    expect(markdown).toContain('initiative: "+17 (27)"')
    expect(markdown).toContain('gear: "Component Pouch"')
    expect(markdown).toContain('resistances: Cold, Lightning')
    expect(markdown).toMatch(/export_hash: "sha256-[0-9a-f]{12}"/)
  })

  it('preprocesses tags and distributes spellcasting', async () => {
    const markdown = (await mapMonster(lich)).markdown

    expect(markdown).toContain('*Melee Attack Roll or Ranged Attack Roll:*')
    expect(markdown).toContain('*Melee Attack Roll:*')
    expect(markdown).toContain('*Hit:*')
    expect(markdown).toContain('1d10')
    expect(markdown).toContain('4d12 + 5')
    expect(markdown).toContain('[[conditions/paralyzed|Paralyzed]]')
    expect(markdown).toContain('*Constitution Saving Throw:* DC 20')
    expect(markdown).toContain('*Failure:*')
    expect(markdown).toContain('*Success:*')
    expect(markdown).toContain('[[variant-rules/emanation-area-of-effect|Emanation]]')
    expect(markdown).toContain('- **At Will:**')
    expect(markdown).toContain('[[spells/detect-magic|Detect Magic]], [[spells/detect-thoughts|Detect Thoughts]]')
    expect(markdown).toContain('- **2/Day Each:**')
    expect(markdown).toContain('- **1/Day Each:**')
    expect(markdown).toContain('name: "Protective Magic"')
  })

  it('preprocesses legacy atk tags and recharge tags while preserving atkr tags', () => {
    expect(preprocessMonsterTags('{@atk mw} {@hit 12}')).toBe('*Melee Attack Roll:* +12')
    expect(preprocessMonsterTags('{@atk rw} {@hit 12}')).toBe('*Ranged Attack Roll:* +12')
    expect(preprocessMonsterTags('{@atk mw,rw}')).toBe('*Melee Attack Roll or Ranged Attack Roll:*')
    expect(preprocessMonsterTags('{@atk ms}')).toBe('*Melee Attack Roll:*')
    expect(preprocessMonsterTags('{@atk rs}')).toBe('*Ranged Attack Roll:*')
    expect(preprocessMonsterTags('{@atk ms,rs}')).toBe('*Melee Attack Roll or Ranged Attack Roll:*')
    expect(preprocessMonsterTags('{@recharge 6}')).toBe('(Recharge 6)')
    expect(preprocessMonsterTags('{@recharge 5}')).toBe('(Recharge 5)')
    expect(preprocessMonsterTags('{@recharge}')).toBe('(Recharge 6)')
    expect(preprocessMonsterTags('{@atkr m} {@hit 12}')).toBe('*Melee Attack Roll:* +12')
    expect(preprocessMonsterTags('{@atkr r} {@hit 12}')).toBe('*Ranged Attack Roll:* +12')
    expect(preprocessMonsterTags('{@atkr m,r}')).toBe('*Melee Attack Roll or Ranged Attack Roll:*')
    expect(preprocessMonsterTags('{@spell cure wounds}')).toBe('[[spells/cure-wounds|cure wounds]]')
    expect(preprocessMonsterTags('{@spell Shield|XPHB|a shield}')).toBe('[[spells/shield|a shield]]')
    expect(preprocessMonsterTags('{@condition Grappled}')).toBe('[[conditions/grappled|Grappled]]')
    expect(preprocessMonsterTags('{@item bag of holding}')).toBe('[[bag-of-holding|bag of holding]]')
  })

  it('preprocesses recharge tags in trait and action names', async () => {
    const markdown = (await mapMonster({
      ...lich,
      trait: [{ name: 'Elemental Ward {@recharge}', entries: ['The ward restores at dawn.'] }],
      action: [{ name: 'Arcane Breath {@recharge 5}', entries: ['The creature breathes magic.'] }],
    })).markdown

    expect(markdown).toContain('name: "Elemental Ward (Recharge 6)"')
    expect(markdown).toContain('name: "Arcane Breath (Recharge 5)"')
  })

  it('renders standard monster reactions', async () => {
    const markdown = (await mapMonster({
      ...lich,
      spellcasting: undefined,
      reaction: [
        {
          name: 'Instinctive Charm',
          entries: [
            'When a creature within 60 feet makes an attack roll, it makes a {@dc 19} Wisdom saving throw.',
          ],
        },
      ],
    })).markdown

    expect(markdown).toContain('reactions:')
    expect(markdown).toContain('name: "Instinctive Charm"')
    expect(markdown).toContain('it makes a DC 19 Wisdom saving throw.')
  })

  it('renders spellcasting reactions', async () => {
    const markdown = (await mapMonster({
      ...lich,
      reaction: undefined,
    })).markdown

    expect(markdown).toContain('reactions:')
    expect(markdown).toContain('name: "Protective Magic"')
  })

  it('renders standard and spellcasting reactions together', async () => {
    const markdown = (await mapMonster({
      ...lich,
      reaction: [
        {
          name: 'Instinctive Charm',
          entries: ['The attacker makes a {@dc 19} Wisdom saving throw.'],
        },
      ],
    })).markdown

    expect(markdown).toContain('reactions:')
    expect(markdown).toContain('name: "Instinctive Charm"')
    expect(markdown).toContain('name: "Protective Magic"')
  })

  it('maps top-level bonus actions alongside regular actions', async () => {
    const markdown = (await mapMonster({
      ...lich,
      bonus: [
        {
          name: 'Shadow Step',
          entries: ['The creature teleports up to 30 feet.'],
        },
      ],
    })).markdown

    expect(markdown).toContain('name: "Shadow Step"')
  })

  it('writes monsters to the configured bestiary folder and skips existing notes', async () => {
    const created: string[] = []
    const vault: MonsterVault = {
      exists: async path => path.endsWith('lich.md'),
      list: async () => ({ files: [], folders: [] }),
      read: async () => JSON.stringify({ monster: [lich] }),
      create: async path => {
        created.push(path)
      },
    }

    await expect(importMonsters(vault, 'bestiary.json', DEFAULT_NOTE_FOLDERS)).resolves.toEqual({ imported: 0, skipped: 1 })
    expect(created).toEqual([])
  })

  it('quotes ambiguous YAML scalars and computes export_hash with compendium bodyHash', async () => {
    const markdown = (await mapMonster({
      ...lich,
      name: 'Yes',
      source: 'No',
      cr: '1/4',
    })).markdown

    const parsed = parseNote(markdown)
    expect(parsed.frontmatter.title).toBe('Yes')
    expect(parsed.frontmatter.source).toBe('No')
    expect(parsed.frontmatter.cr).toBe('1/4')
    expect(parsed.frontmatter.export_hash).toBe(await bodyHash(parsed.body))
    expect(await bodyHash('abc')).toMatch(/^sha256-ba7816bf/)
  })
})
