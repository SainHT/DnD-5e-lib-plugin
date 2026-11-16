import { describe, expect, it } from 'vitest'
import { DEFAULT_NOTE_FOLDERS } from '../../../src/platform'
import { importSpells, mapSpell, type SpellVault } from '../../../src/importers/5e-tools'

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
