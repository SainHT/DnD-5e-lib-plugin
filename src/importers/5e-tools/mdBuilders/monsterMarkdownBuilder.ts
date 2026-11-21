/**
 * Builds the exact frontmatter and statblock fence used by monster import notes.
 */
import { yamlStrict as yaml, buildFrontmatter } from './baseMarkdownBuilder'
import { exportHash, type MonsterEntry } from '../mappers/Beastiary/monsterHelpers'

/** Normalized fields consumed while assembling a monster Markdown note. */
export interface MonsterMarkdownData {
  name: string
  source: string
  cr: string
  xp: number
  xpLair?: number
  type: string
  subtype: string
  size: string
  ac: number | ''
  hp: number | ''
  speed: number | ''
  hitDice: string
  initiative: string
  alignment: string
  stats: number[]
  saves: Array<Record<string, number>>
  skills: Array<Record<string, number>>
  gear: string
  resistances: string
  immunities: string
  conditionImmunities: string
  senses: string
  passive: number | ''
  languages: string
  traits: MonsterEntry[]
  actions: MonsterEntry[]
  reactions: MonsterEntry[]
  legendaryDescription?: string
  legendaryActions: MonsterEntry[]
  legendary: boolean
  spellcasting: boolean
  tags: string[]
}

/**
 * Assembles monster YAML frontmatter and the Fantasy Statblocks YAML fence.
 *
 * @param data Fully normalized monster fields.
 * @returns Complete Markdown ending in a newline.
 */
export function buildMonsterMarkdown(data: MonsterMarkdownData): string {
  const body = buildStatblock(data)
  const crLine = /^\d+$/.test(data.cr) ? data.cr : yaml(data.cr)
  const frontmatter = buildFrontmatter({
    title: data.name,
    source: data.source,
    strictYaml: true,
    extra: [
      'statblock: inline',
      `cr: ${crLine}`,
      `xp: ${data.xp}`,
      ...(typeof data.xpLair === 'number' ? [`xp_lair: ${data.xpLair}`] : []),
      ...(data.type ? [`type: ${yaml(data.type)}`] : []),
      ...(data.subtype ? [`subtype: ${yaml(data.subtype)}`] : []),
      ...(data.size ? [`size: ${yaml(data.size)}`] : []),
      ...(typeof data.ac === 'number' ? [`ac: ${data.ac}`] : []),
      ...(typeof data.hp === 'number' ? [`hp: ${data.hp}`] : []),
      ...(typeof data.speed === 'number' ? [`speed: ${data.speed}`] : []),
      `legendary: ${data.legendary}`,
      `spellcasting: ${data.spellcasting}`,
    ],
    tags: data.tags,
    aliases: [data.name],
    exportHash: exportHash(body),
  })
  return `${frontmatter.join('\n')}\n\n${body}\n`
}

/**
 * Builds the `statblock` YAML fence.
 *
 * @param data Normalized monster fields.
 * @returns Fenced YAML body.
 */
function buildStatblock(data: MonsterMarkdownData): string {
  const lines = [
    '```statblock',
    'columns: 2',
    'forceColumns: true',
    `name: ${yaml(data.name)}`,
    `source: ${yaml(data.source)}`,
    ...(data.size ? [`size: ${yaml(data.size)}`] : []),
    ...(data.type ? [`type: ${yaml(data.type)}`] : []),
    ...(data.subtype ? [`subtype: ${yaml(data.subtype)}`] : []),
    ...(data.alignment ? [`alignment: ${yaml(data.alignment)}`] : []),
    ...(typeof data.ac === 'number' ? [`ac: ${data.ac}`] : []),
    ...(typeof data.hp === 'number' ? [`hp: ${data.hp}`] : []),
    ...(data.hitDice ? [`hit_dice: ${yaml(data.hitDice)}`] : []),
    ...(typeof data.speed === 'number' ? [`speed: ${yaml(`${data.speed} ft.`)}`] : []),
    ...(data.initiative ? [`initiative: ${yaml(data.initiative)}`] : []),
    `stats: [${data.stats.join(', ')}]`,
  ]
  if (data.saves.length) {
    lines.push('saves:')
    for (const row of data.saves) {
      for (const [name, value] of Object.entries(row)) lines.push(`  - ${name}: ${value}`)
    }
  }
  if (data.skills.length) {
    lines.push('skillsaves:')
    for (const row of data.skills) {
      for (const [name, value] of Object.entries(row)) lines.push(`  - ${name}: ${value}`)
    }
  }
  if (data.gear) lines.push(`gear: ${yaml(data.gear)}`)
  if (data.resistances) lines.push(`resistances: ${data.resistances}`)
  if (data.immunities) lines.push(`immunities: ${data.immunities}`)
  if (data.conditionImmunities) lines.push(`condition_immunities: ${data.conditionImmunities}`)
  if (data.senses) lines.push(`senses: ${data.senses}`)
  if (typeof data.passive === 'number') lines.push(`passive: ${data.passive}`)
  if (data.languages) lines.push(`languages: ${data.languages}`)
  lines.push(`cr: ${yaml(data.cr)}`)
  appendEntries(lines, 'traits', data.traits)
  appendEntries(lines, 'actions', data.actions)
  appendEntries(lines, 'reactions', data.reactions)
  if (data.legendaryDescription) lines.push(`legendary_description: ${yaml(data.legendaryDescription)}`)
  appendEntries(lines, 'legendary_actions', data.legendaryActions)
  lines.push('```')
  return lines.join('\n')
}

/**
 * Appends a named list of statblock entries.
 *
 * @param lines Output line array.
 * @param key YAML key.
 * @param entries Named entries to append.
 * @returns Nothing; mutates lines.
 */
function appendEntries(lines: string[], key: string, entries: MonsterEntry[]): void {
  if (entries.length === 0) return
  lines.push(`${key}:`)
  for (const entry of entries) {
    lines.push(`  - name: ${yaml(entry.name)}`)
    lines.push(`    desc: ${yaml(entry.desc)}`)
  }
}
