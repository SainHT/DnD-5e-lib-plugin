/**
 * Builds the YAML frontmatter and readable body for an imported spell.
 */
import { buildFrontmatter, buildHeading, renderEntityNote } from './baseMarkdownBuilder'

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
  /** Character-level scaling dice for cantrips. */
  cantripDice: string[]
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
export async function buildSpellMarkdown(data: SpellMarkdownData): Promise<string> {
  const body = buildBody(data)
  const tags = [
    'spell',
    data.level === 0 ? 'spell/cantrip' : `spell/level-${data.level}`,
    `spell/${data.school.toLowerCase()}`,
    ...(data.ritual ? ['ritual'] : []),
  ]
  return renderEntityNote(
    buildFrontmatter({
      title: data.name,
      source: data.source,
      extra: {
        level: data.level,
        school: data.school,
        casting_time: data.castingTime,
        range: data.range,
        components: data.components,
        duration: data.duration,
        concentration: data.concentration,
        ritual: data.ritual,
        ...(data.damageTypes.length ? { damage_types: data.damageTypes } : {}),
        ...(data.damageDice ? { damage_dice: data.damageDice } : {}),
        ...(data.cantripDice.length ? { cantrip_dice: data.cantripDice } : {}),
        ...(data.classes.length ? { classes: data.classes } : {}),
      },
      tags,
      aliases: [data.alias],
    }),
    body,
  )
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
    buildHeading(data.name, `Level ${data.level} ${data.school}${classes}`, data.source),
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
