import { describe, expect, it } from 'vitest'
import { mapFeat } from '../../../../src/importers/5e-tools'

describe('feat mapper', () => {
  it('maps metadata, prerequisites, tags, and nested benefits', async () => {
    const note = await mapFeat({
      name: 'Ability Score Improvement',
      source: 'XPHB',
      srd52: true,
      category: 'G',
      prerequisite: [{ level: 4 }],
      entries: [
        "Increase one ability score of your choice by 2, or increase two ability scores of your choice by 1.",
        { type: 'entries', name: 'Repeatable', entries: ['You can take this feat more than once.'] },
      ],
    })

    expect(note.kind).toBe('feat')
    expect(note.markdown).toContain('source: "XPHB"')
    expect(note.markdown).toContain('kind: "general"')
    expect(note.markdown).toContain('prerequisite: "Level 4+"')
    expect(note.markdown).toContain('  - "feat/general"')
    expect(note.markdown).not.toContain('srd-5-2-1')
    expect(note.markdown).toContain('**Repeatable.** You can take this feat more than once.')
    expect(note.markdown).toContain('  - key: repeatable')
    expect(note.markdown).toMatch(/export_hash: "sha256-[0-9a-f]{12}"/)
  })

  it('creates a stable overview benefit for plain text entries and falls back to unknown source', async () => {
    const markdown = (await mapFeat({ name: 'Alert', category: 'O', entries: ['You notice danger.'] })).markdown
    expect(markdown).toContain('source: "unknown"')
    expect(markdown).toContain('  - key: overview')
    expect(markdown).toContain('    text: "You notice danger."')
    expect(markdown).toContain('benefit_count: 1')
  })

  it('maps ability increases and compound prerequisites', async () => {
    const markdown = (await mapFeat({
      name: 'Actor',
      category: 'G',
      prerequisite: [{ level: 4, ability: [{ cha: 13 }] }, { feature: ['Spellcasting', 'Pact Magic'] }, { race: ['Human'] }],
      ability: [{ cha: 1 }],
      entries: ['You gain the following benefits.'],
    })).markdown

    expect(markdown).toContain('prerequisite: "Level 4+, Charisma 13+; Spellcasting or Pact Magic feature; Human"')
    expect(markdown).toContain('abilities:')
    expect(markdown).toContain('  - "cha"')
    expect(markdown).toContain('key: ability_score_increase')
    expect(markdown).toContain('text: "Increase Charisma score by 1, to a maximum of 20."')
    expect(markdown).toContain('type: "ability_score_choice"')
  })

  it('maps the 5etools fighting style category', async () => {
    const markdown = (await mapFeat({
      name: 'Archery',
      category: 'FS',
      prerequisite: [{ feature: 'Fighting Style' }],
      entries: ['You gain a +2 bonus to attack rolls you make with Ranged weapons.'],
    })).markdown

    expect(markdown).toContain('kind: "fighting_style"')
    expect(markdown).toContain('  - "feat/fighting_style"')
    expect(markdown).toContain('prerequisite: "Fighting Style feature"')
  })

  it('renders list entry items in the overview benefit', async () => {
    const markdown = (await mapFeat({
      name: 'Athlete',
      category: 'G',
      entries: [
        'You have undergone extensive physical training to gain the following benefits:',
        {
          type: 'list',
          items: ['Standing up uses only 5 feet of movement.', "Climbing doesn't cost extra movement."],
        },
      ],
    })).markdown

    expect(markdown).toContain('- Standing up uses only 5 feet of movement.')
    expect(markdown).toContain("- Climbing doesn't cost extra movement.")
    expect(markdown).toContain(
      `text: ${JSON.stringify(
        "You have undergone extensive physical training to gain the following benefits:\n\n- Standing up uses only 5 feet of movement.\n- Climbing doesn't cost extra movement.",
      )}`,
    )
  })

  it('converts feat inline reference and dice tags', async () => {
    const markdown = (await mapFeat({
      name: 'Tagged Feat',
      category: 'G',
      entries: [
        'Gain {@item Shield|XBHP}, cast {@spell Fireball|XPHB|a fireball}, and learn {@variantrule Proficiency|XPHB}.',
        'Roll {@dice 1d10} or {@dice 2d6 + 3}.',
        {
          type: 'entries',
          name: 'Emanation Benefit',
          entries: [
            'Use {@itemProperty T|XPHB|Thrown}.',
            { type: 'list', items: ['Carry {@item Shield|XPHB|a shield}.'] },
          ],
        },
      ],
    })).markdown

    expect(markdown).toContain('[[shield|Shield]]')
    expect(markdown).toContain('[[spells/fireball|a fireball]]')
    expect(markdown).toContain('[[variant-rules/proficiency|Proficiency]]')
    expect(markdown).toContain('Roll 1d10 or 2d6 + 3.')
    expect(markdown).toContain('Thrown')
    expect(markdown).toContain('- Carry [[shield|a shield]].')
  })

  it('resolves multi-word and foldered wiki links and strips unknown tags to plain text', async () => {
    const markdown = (await mapFeat({
      name: 'Link Coverage',
      category: 'G',
      entries: [
        'Cast {@spell cure wounds} or {@spell Shield|XPHB|a shield}.',
        'Avoid {@condition Grappled}, carry {@item bag of holding}, fight {@creature Adult Red Dragon|XMM}, take {@feat Tough|XPHB}.',
        'Ask your {@class Wizard|XPHB} about {@skill Perception|XPHB}.',
      ],
    })).markdown

    expect(markdown).toContain('[[spells/cure-wounds|cure wounds]]')
    expect(markdown).toContain('[[spells/shield|a shield]]')
    expect(markdown).toContain('[[conditions/grappled|Grappled]]')
    expect(markdown).toContain('[[bag-of-holding|bag of holding]]')
    expect(markdown).toContain('[[bestiary/adult-red-dragon|Adult Red Dragon]]')
    expect(markdown).toContain('[[feats/tough|Tough]]')
    expect(markdown).toContain('Ask your Wizard about Perception.')
  })
})
