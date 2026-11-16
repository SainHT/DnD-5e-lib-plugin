/**
 * Builds the YAML frontmatter and readable body for an imported spell.
 */
import { exportHash } from './spellHelpers'

/**
 * Normalized values consumed by the spell Markdown builder.
 */
export interface SpellMarkdownData {
  /** Canonical spell title. */
  name: string
  /** Original source name used as an alias when it differs. */
  alias: string
  /** Canonical source label. */
  source: string
  /** Spell level. */
  level: number
  /** Full school name. */
  school: string
  /** Casting-time display text. */
  castingTime: string
  /** Range display text. */
  range: string
  /** Component display text. */
  components: string
  /** Duration display text. */
  duration: string
  /** Concentration flag. */
  concentration: boolean
  /** Ritual flag. */
  ritual: boolean
  /** Damage type metadata. */
  damageTypes: string[]
  /** First damage dice expression. */
  damageDice: string
  /** Classes that can prepare or learn the spell. */
  classes: string[]
  /** Rendered spell prose. */
  body: string
}

/**
 * Assembles a complete spell note with stable export hash metadata.
 *
 * @param data Normalized spell data.
 * @returns Markdown ending in a newline.
 */
export function buildSpellMarkdown(data: SpellMarkdownData): string {
  const body = buildBody(data)
  const tags = ['spell', `spell/level-${data.level}`, `spell/${data.school.toLowerCase()}`, ...(data.source === 'SRD 5.2.1' ? ['srd-5-2-1'] : [])]
  return [
    '---',
    `title: ${yaml(data.name)}`,
    `source: ${yaml(data.source)}`,
    `edition: ${yaml(data.source)}`,
    `level: ${data.level}`,
    `school: ${yaml(data.school)}`,
    `casting_time: ${yaml(data.castingTime)}`,
    `range: ${yaml(data.range)}`,
    `components: ${yaml(data.components)}`,
    `duration: ${yaml(data.duration)}`,
    `concentration: ${data.concentration}`,
    `ritual: ${data.ritual}`,
    ...(data.damageTypes.length ? ['damage_types:', ...data.damageTypes.map(type => `- ${type}`)] : []),
    ...(data.damageDice ? [`damage_dice: ${yaml(data.damageDice)}`] : []),
    ...(data.classes.length ? ['classes:', ...data.classes.map(value => `- ${yaml(value)}`)] : []),
    'tags:',
    ...tags.map(tag => `- ${tag}`),
    'aliases:',
    `- ${yaml(data.alias)}`,
    `export_hash: ${exportHash(body)}`,
    '---',
    body,
    '',
  ].join('\n')
}

/**
 * Builds the spell title line, metadata list, and prose body.
 *
 * @param data Normalized spell data.
 * @returns Body Markdown without frontmatter.
 */
function buildBody(data: SpellMarkdownData): string {
  const classes = data.classes.length ? ` (${data.classes.join(', ')})` : ''
  return [
    `# ${data.name}`,
    `*Level ${data.level} ${data.school}${classes} | Source: ${data.source}*`,
    ``,
    `- **Casting Time:** ${data.castingTime}`,
    `- **Range:** ${data.range}`,
    `- **Components:** ${data.components}`,
    `- **Duration:** ${data.duration}`,
    ``,
    ...(data.classes.length ? [`- Classes: ${data.classes.join(', ')}`] : []),
    data.body,
  ].join('\n')
}

/**
 * Serializes a string as a YAML-safe quoted scalar.
 *
 * @param value String to serialize.
 * @returns JSON-compatible quoted scalar.
 */
function yaml(value: string): string {
  return JSON.stringify(value)
}
