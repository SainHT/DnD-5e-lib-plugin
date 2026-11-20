import { describe, expect, it } from 'vitest'
import { DEFAULT_NOTE_FOLDERS } from '../../../../src/platform'
import { importSpells, mapSpell, type SpellVault } from '../../../../src/importers/5e-tools'

const acidArrow = {
  name: "Melf's Acid Arrow",
  source: 'XPHB',
  srd52: 'Acid Arrow',
  basicRules2024: true,
  level: 2,
  school: 'V',
  time: [{ number: 1, unit: 'action' }],
  range: { type: 'point', distance: { type: 'feet', amount: 90 } },
  components: { v: true, s: true, m: 'powdered rhubarb leaf' },
  duration: [{ type: 'instant' }],
  entries: [
    'A shimmering green arrow streaks toward a target within range and bursts in a spray of acid. Make a ranged spell attack against the target. On a hit, the target takes {@damage 4d4} Acid damage and {@damage 2d4} Acid damage at the end of its next turn.',
  ],
  entriesHigherLevel: [
    {
      type: 'entries',
      name: 'Using a Higher-Level Spell Slot',
      entries: ['The damage increases by {@scaledamage 4d4;2d4|2-9|1d4} for each spell slot level above 2.'],
    },
  ],
  damageInflict: ['acid'],
  classes: { from: [{ name: 'Wizard', source: 'XPHB' }] },
}

describe('spell mapper', () => {
  it('renders the requested metadata and preprocesses damage tags', () => {
    const markdown = mapSpell(acidArrow).markdown

    expect(markdown).toContain('title: "Acid Arrow"')
    expect(markdown).toContain('source: "SRD 5.2.1"')
    expect(markdown).toContain('school: "Evocation"')
    expect(markdown).toContain('range: "90 feet"')
    expect(markdown).toContain('components: "V, S, M (powdered rhubarb leaf)"')
    expect(markdown).toContain('duration: "Instantaneous"')
    expect(markdown).toContain('- "Wizard"')
    expect(markdown).toContain('damage_dice: "4d4"')
    expect(markdown).toContain('takes 4d4 Acid damage')
    expect(markdown).toContain('increases by 1d4')
    expect(markdown).toMatch(/export_hash: sha256-[0-9a-f]{12}/)
  })

  it('renders conditioned reaction casting time in frontmatter and body', () => {
    const markdown = mapSpell({
      ...acidArrow,
      name: 'Shield',
      srd52: 'Shield',
      level: 1,
      time: [
        {
          number: 1,
          unit: 'reaction',
          condition: 'which you take when a {@condition humanoid} you can see within 60 feet of you dies',
        },
      ],
    }).markdown

    const castingTime = '1 reaction, which you take when a humanoid you can see within 60 feet of you dies'
    expect(markdown).toContain(`casting_time: ${JSON.stringify(castingTime)}`)
    expect(markdown).toContain(`- **Casting Time:** ${castingTime}`)
    expect(markdown).not.toContain('{@condition')
  })

  it('unwraps timed durations and pluralizes their units', () => {
    const singular = mapSpell({ ...acidArrow, duration: [{ type: 'timed', duration: { type: 'round', amount: 1 } }] }).markdown
    const plural = mapSpell({ ...acidArrow, duration: [{ type: 'timed', duration: { type: 'minute', amount: 10 } }] }).markdown

    expect(singular).toContain('duration: "1 round"')
    expect(singular).toContain('- **Duration:** 1 round')
    expect(plural).toContain('duration: "10 minutes"')
    expect(plural).toContain('- **Duration:** 10 minutes')
  })

  it('formats timed concentration duration and preserves the frontmatter flag', () => {
    const markdown = mapSpell({
      ...acidArrow,
      duration: [{ type: 'timed', duration: { type: 'hour', amount: 1 }, concentration: true }],
    }).markdown

    expect(markdown).toContain('duration: "Concentration, up to 1 hour"')
    expect(markdown).toContain('- **Duration:** Concentration, up to 1 hour')
    expect(markdown).toContain('concentration: true')
  })

  it('joins multiple duration options and detects concentration on any option', () => {
    const markdown = mapSpell({
      ...acidArrow,
      duration: [
        { type: 'instant' },
        { type: 'timed', duration: { type: 'hour', amount: 1 } },
        { type: 'timed', duration: { type: 'minute', amount: 10 }, concentration: true },
      ],
    }).markdown

    expect(markdown).toContain('duration: "Instantaneous or 1 hour or Concentration, up to 10 minutes"')
    expect(markdown).toContain('- **Duration:** Instantaneous or 1 hour or Concentration, up to 10 minutes')
    expect(markdown).toContain('concentration: true')
  })

  it('reads ritual status from nested metadata and uses the vault ritual tag convention', () => {
    const ritualMarkdown = mapSpell({ ...acidArrow, meta: { ritual: true } }).markdown
    const nonRitualMarkdown = mapSpell(acidArrow).markdown

    expect(ritualMarkdown).toContain('ritual: true')
    expect(ritualMarkdown).toContain('- ritual')
    expect(nonRitualMarkdown).toContain('ritual: false')
    expect(nonRitualMarkdown).not.toContain('- ritual')
  })

  it('renders sorted cantrip scaling dice and higher-level entries', () => {
    const markdown = mapSpell({
      name: 'Acid Splash',
      source: 'XPHB',
      srd52: 'Acid Splash',
      basicRules2024: true,
      level: 0,
      school: 'C',
      time: [{ number: 1, unit: 'action' }],
      range: { type: 'point', distance: { type: 'feet', amount: 60 } },
      components: { v: true, s: true },
      duration: [{ type: 'instant' }],
      entries: ['You create an acidic bubble that deals {@damage 1d6} Acid damage in a {@variantrule Sphere [Area of Effect]|XPHB|Sphere}.'],
      entriesHigherLevel: [
        {
          type: 'entries',
          name: 'Cantrip Upgrade',
          entries: ['The damage increases by {@damage 1d6} when you reach levels 5 ({@damage 2d6}), 11 ({@damage 3d6}), and 17 ({@damage 4d6}).'],
        },
      ],
      scalingLevelDice: {
        label: 'Acid damage',
        scaling: { '11': '3d6', '1': '1d6', '17': '4d6', '5': '2d6' },
      },
    }).markdown

    expect(markdown).toContain('cantrip_dice:')
    expect(markdown).toContain('  - "1d6"\n  - "2d6"\n  - "3d6"\n  - "4d6"')
    expect(markdown).toContain('- spell/cantrip')
    expect(markdown).toContain('Cantrip Upgrade. The damage increases by 1d6 when you reach levels 5 (2d6), 11 (3d6), and 17 (4d6).')
    expect(markdown).toContain('in a Sphere')
  })

  it('writes current spells into the configured spells folder and skips existing notes', async () => {
    const created: string[] = []
    const vault: SpellVault = {
      exists: async path => path.endsWith('acid-arrow.md'),
      list: async () => ({ files: [], folders: [] }),
      read: async () => JSON.stringify({ spell: [acidArrow] }),
      create: async path => {
        created.push(path)
      },
    }

    await expect(importSpells(vault, 'spells.json', DEFAULT_NOTE_FOLDERS)).resolves.toEqual({ imported: 0, skipped: 1 })
    expect(created).toEqual([])
  })
})
