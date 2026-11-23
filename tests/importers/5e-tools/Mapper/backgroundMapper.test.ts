import { describe, expect, it } from 'vitest'
import { mapBackground } from '../../../../src/importers/5e-tools/mappers/backgroundMapper'
import type { FiveEToolsRecord } from '../../../../src/importers/5e-tools/types'

describe('backgroundMapper', () => {
  it('maps a 2024 / SRD background (Criminal) with abilities, feat, and equipment choices', () => {
    const record: FiveEToolsRecord = {
      name: 'Criminal',
      source: 'XPHB',
      page: 180,
      srd52: true,
      basicRules2024: true,
      edition: 'one',
      ability: [
        {
          choose: {
            weighted: {
              from: ['dex', 'con', 'int'],
              weights: [2, 1],
            },
          },
        },
        {
          choose: {
            weighted: {
              from: ['dex', 'con', 'int'],
              weights: [1, 1, 1],
            },
          },
        },
      ],
      feats: [
        {
          'alert|xphb': true,
        },
      ],
      skillProficiencies: [
        {
          'sleight of hand': true,
          stealth: true,
        },
      ],
      toolProficiencies: [
        {
          "thieves' tools": true,
        },
      ],
      startingEquipment: [
        {
          A: [
            {
              item: 'dagger|xphb',
              quantity: 2,
            },
            {
              item: "thieves' tools|xphb",
            },
            {
              item: 'crowbar|xphb',
            },
            {
              item: 'pouch|xphb',
              quantity: 2,
            },
            {
              item: "traveler's clothes|xphb",
            },
            {
              value: 1600,
            },
          ],
          B: [
            {
              value: 5000,
            },
          ],
        },
      ],
      entries: [
        {
          type: 'list',
          style: 'list-hang-notitle',
          items: [
            {
              type: 'item',
              name: 'Ability Scores:',
              entry: 'Dexterity, Constitution, Intelligence',
            },
            {
              type: 'item',
              name: 'Feat:',
              entry: '{@feat Alert|XPHB}',
            },
            {
              type: 'item',
              name: 'Skill Proficiencies:',
              entry: '{@skill Sleight of Hand|XPHB}, {@skill Stealth|XPHB}',
            },
            {
              type: 'item',
              name: 'Tool Proficiency:',
              entry: "{@item Thieves' Tools|XPHB}",
            },
            {
              type: 'item',
              name: 'Equipment:',
              entry: "Choose A or B: (A) {@item Dagger|XPHB|2 Daggers}, {@item Thieves' Tools|XPHB}, {@item Crowbar|XPHB}, {@item Pouch|XPHB|2 Pouches}, {@item Traveler's Clothes|XPHB}, 16 GP; or (B) 50 GP",
            },
          ],
        },
      ],
    }

    const note = mapBackground(record)

    expect(note.kind).toBe('background')
    expect(note.name).toBe('Criminal')
    expect(note.markdown).toContain('title: Criminal')
    expect(note.markdown).toContain('source: SRD 5.2.1')
    expect(note.markdown).toContain('edition: SRD 5.2.1')
    expect(note.markdown).toContain('origin_feat: Alert')
    expect(note.markdown).toContain('- con')
    expect(note.markdown).toContain('- dex')
    expect(note.markdown).toContain('- int')
    expect(note.markdown).toContain('- sleight of hand')
    expect(note.markdown).toContain('- stealth')
    expect(note.markdown).toContain('tags:\n  - background')
    expect(note.markdown).toContain('  - ability/con')
    expect(note.markdown).toContain('  - feat/alert')
    expect(note.markdown).toContain('  - srd-5-2-1')
    expect(note.markdown).toContain('# Criminal')
    expect(note.markdown).toContain('*Dexterity/Constitution/Intelligence · Alert | Source: SRD 5.2.1*')
    expect(note.markdown).toContain('- **Ability Scores:** Dexterity, Constitution, Intelligence')
    expect(note.markdown).toContain('- **Feat:** Alert')
    expect(note.markdown).toContain('- **Skill Proficiencies:** Sleight of Hand, Stealth')
    expect(note.markdown).toContain("- **Tool Proficiency:** Thieves' Tools")
    expect(note.markdown).toContain('```vault-background')
    expect(note.markdown).toContain('key: overview')
    expect(note.markdown).toContain('ability_options:')
    expect(note.markdown).toContain('skill_proficiencies:')
    expect(note.markdown).toContain("tool_proficiencies:")
    expect(note.markdown).toContain('starting_equipment:')
  })

  it('maps a 2014 / setting background (Boros Legionnaire) skipping characteristics/contacts and formatting tables', () => {
    const record: FiveEToolsRecord = {
      name: 'Boros Legionnaire',
      source: 'GGR',
      page: 40,
      skillProficiencies: [
        {
          athletics: true,
          intimidation: true,
        },
      ],
      languageProficiencies: [
        {
          choose: {
            from: ['celestial', 'draconic', 'goblin', 'other'],
          },
        },
      ],
      toolProficiencies: [
        {
          anyGamingSet: 1,
        },
      ],
      startingEquipment: [
        {
          _: [
            {
              special: 'Boros insignia',
            },
            {
              special: "feather from an angel's wing",
            },
            {
              special: 'tattered piece of a Boros banner (a souvenir from a famous battle)',
            },
            'common clothes|phb',
            {
              item: 'pouch|phb',
              containsValue: 200,
            },
          ],
        },
      ],
      additionalSpells: [
        {
          expanded: {
            s0: ['fire bolt#c', 'sacred flame#c'],
            s1: ['guiding bolt', 'heroism'],
          },
        },
      ],
      entries: [
        {
          type: 'list',
          style: 'list-hang-notitle',
          items: [
            {
              type: 'item',
              name: 'Skill Proficiencies:',
              entry: '{@skill Athletics}, {@skill Intimidation}',
            },
            {
              type: 'item',
              name: 'Tool Proficiencies:',
              entry: 'One type of {@filter gaming set|items|source=phb|miscellaneous=mundane|type=gaming set}',
            },
            {
              type: 'item',
              name: 'Languages:',
              entry: 'Choose one of Celestial, Draconic, Goblin, or Minotaur',
            },
            {
              type: 'item',
              name: 'Equipment:',
              entry: 'A Boros insignia, a feather from an angel\'s wing, a tattered piece of a Boros banner (a souvenir from a famous battle), a set of {@item common clothes|phb}, and a belt {@item pouch|phb} containing 2 gp (Boros-minted 1-zino coins)',
            },
          ],
        },
        {
          type: 'entries',
          name: 'Feature: Legion Station',
          entries: [
            'You have an established place in the hierarchy of the Boros Legion. You can requisition simple equipment for temporary use, and you can gain access to any Boros garrison in Ravnica.',
          ],
          data: {
            isFeature: true,
          },
        },
        {
          type: 'entries',
          name: 'Boros Guild Spells',
          entries: [
            'For you, the spells on the Boros Guild Spells table are added to the spell list of your spellcasting class.',
            {
              type: 'table',
              caption: 'Boros Guild Spells',
              colLabels: ['Spell Level', 'Spells'],
              rows: [
                ['Cantrip', '{@spell fire bolt}, {@spell sacred flame}'],
                ['1st', '{@spell guiding bolt}, {@spell heroism}'],
              ],
            },
          ],
        },
        {
          type: 'entries',
          name: 'Suggested Characteristics',
          entries: [
            'The Boros Legion is a zealous army.',
            {
              type: 'table',
              caption: 'Personality Traits',
              colLabels: ['d8', 'Personality Trait'],
              rows: [['1', 'I approach every task with the same high degree of military precision.']],
            },
          ],
        },
        {
          type: 'entries',
          name: 'Contacts',
          entries: [
            'The ordered structure offers abundant opportunities.',
            {
              type: 'table',
              caption: 'Boros Contacts',
              colLabels: ['d8', 'Contact'],
              rows: [['1', 'A former comrade in arms.']],
            },
          ],
        },
        {
          type: 'entries',
          name: 'How Do I Fit In?',
          entries: [
            'As a member of the Boros Legion, you are subject to the orders of your superior officers.',
          ],
        },
      ],
    }

    const note = mapBackground(record)

    expect(note.kind).toBe('background')
    expect(note.name).toBe('Boros Legionnaire')
    expect(note.markdown).toContain('title: Boros Legionnaire')
    expect(note.markdown).toContain('source: GGR')
    expect(note.markdown).toContain('edition: 5e')
    expect(note.markdown).toContain('- athletics')
    expect(note.markdown).toContain('- intimidation')
    expect(note.markdown).toContain('tags:\n  - background\n  - ggr')
    expect(note.markdown).toContain('# Boros Legionnaire')
    expect(note.markdown).toContain('*Background | Source: GGR*')
    expect(note.markdown).toContain('## Feature: Legion Station')
    expect(note.markdown).toContain('## Boros Guild Spells')
    expect(note.markdown).toContain('| Spell Level | Spells |')
    expect(note.markdown).toContain('| Cantrip | fire bolt, sacred flame |')
    expect(note.markdown).toContain('| 1st | guiding bolt, heroism |')

    // Verifies skipped entries
    expect(note.markdown).not.toContain('Suggested Characteristics')
    expect(note.markdown).not.toContain('Personality Trait')
    expect(note.markdown).not.toContain('Contacts')
    expect(note.markdown).not.toContain('Boros Contacts')
    expect(note.markdown).not.toContain('How Do I Fit In?')

    // Verifies YAML block
    expect(note.markdown).toContain('key: overview')
    expect(note.markdown).toContain('key: feature_legion_station')
    expect(note.markdown).toContain('name: Feature: Legion Station')
    expect(note.markdown).toContain('additional_spells:')
    expect(note.markdown).toContain('starting_equipment:')
  })
})
