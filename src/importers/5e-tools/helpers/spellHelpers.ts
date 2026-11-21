/**
 * Pure parsing and normalization helpers for 5etools spell records.
 */
import {
  exportHash,
  sourceForRecord,
  stringValue,
} from './mapperHelpers'

export { exportHash, sourceForRecord }

const SCHOOLS: Readonly<Record<string, string>> = {
  A: 'Abjuration',
  C: 'Conjuration',
  D: 'Divination',
  E: 'Enchantment',
  V: 'Evocation',
  I: 'Illusion',
  N: 'Necromancy',
  T: 'Transmutation',
}

/**
 * Converts a school abbreviation into its full school name.
 *
 * @param value Raw school abbreviation.
 * @returns Full school name or a readable fallback.
 */
export function schoolName(value: unknown): string {
  const school = stringValue(value) ?? ''
  return SCHOOLS[school.toUpperCase()] ?? (school || 'Unknown')
}

/**
 * Formats all casting-time entries, including optional reaction conditions.
 *
 * @param value Raw 5etools time array.
 * @returns Human-readable casting times joined with `or`.
 */
export function castingTimeText(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'))
    .map(entry => {
      const number = typeof entry.number === 'number' ? String(entry.number) : ''
      const unit = stringValue(entry.unit) ?? ''
      const base = [number, unit].filter(Boolean).join(' ')
      const condition = typeof entry.condition === 'string' ? preprocessTags(entry.condition.trim()) : ''
      return condition ? `${base}, ${condition}` : base
    })
    .filter(Boolean)
    .join(' or ')
}

/**
 * Formats a spell range.
 *
 * @param value Raw 5etools range object.
 * @returns Human-readable range text.
 */
export function rangeText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const range = value as Record<string, unknown>
  const distance = range.distance
  if (distance && typeof distance === 'object') {
    const data = distance as Record<string, unknown>
    const amount = typeof data.amount === 'number' ? String(data.amount) : ''
    const type = stringValue(data.type) ?? ''
    return [amount, type].filter(Boolean).join(' ') || 'Self'
  }
  return stringValue(range.type) ?? ''
}

/**
 * Formats verbal, somatic, and material components.
 *
 * @param value Raw 5etools components object.
 * @returns Comma-separated component text.
 */
export function componentsText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const components = value as Record<string, unknown>
  const result: string[] = []
  if (components.v === true) result.push('V')
  if (components.s === true) result.push('S')
  if (components.m === true) result.push('M')
  else if (typeof components.m === 'string') result.push(`M (${preprocessTags(components.m)})`)
  return result.join(', ')
}

/**
 * Formats every spell duration option, unwrapping timed duration details.
 *
 * @param value Raw 5etools duration array.
 * @returns Human-readable duration options joined with `or`.
 */
export function durationText(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'))
    .map(formatDurationEntry)
    .filter(Boolean)
    .join(' or ')
}

/**
 * Formats one spell duration option.
 *
 * @param entry Raw duration entry.
 * @returns Human-readable duration option.
 */
function formatDurationEntry(entry: Record<string, unknown>): string {
  const type = stringValue(entry.type) ?? ''
  if (type === 'instant') return 'Instantaneous'
  if (type === 'permanent') return 'Permanent'
  if (type === 'special') return 'Special'
  if (type !== 'timed' || !entry.duration || typeof entry.duration !== 'object') return type

  const timed = entry.duration as Record<string, unknown>
  const amount = typeof timed.amount === 'number' ? timed.amount : null
  const unit = stringValue(timed.type) ?? ''
  const formatted = formatTimedDuration(amount, unit)
  return entry.concentration === true ? `Concentration, up to ${formatted}` : formatted
}

/**
 * Checks whether a spell duration is concentration-based.
 *
 * @param record Raw spell record.
 * @returns True when the record marks concentration.
 */
export function concentrationFromRecord(record: Record<string, unknown>): boolean {
  if (record.concentration === true) return true
  return Array.isArray(record.duration) && record.duration.some(
    duration => Boolean(duration && typeof duration === 'object' && (duration as Record<string, unknown>).concentration === true),
  )
}

/**
 * Checks whether a spell is a ritual.
 *
 * @param record Raw spell record.
 * @returns True when the record marks ritual casting.
 */
export function ritualFromRecord(record: Record<string, unknown>): boolean {
  if (record.ritual === true) return true
  if (!record.meta || typeof record.meta !== 'object') return false
  return (record.meta as Record<string, unknown>).ritual === true
}

/**
 * Extracts damage types in their source order.
 *
 * @param value Raw damageInflict field.
 * @returns Lowercase unique damage types.
 */
export function damageTypesFromRecord(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === 'string').map(item => item.toLowerCase()))] : []
}

/**
 * Extracts the first damage die expression from nested spell prose.
 *
 * @param value Raw entries value.
 * @returns First damage expression or an empty string.
 */
export function damageDiceFromEntries(value: unknown): string {
  const text = textFromEntries(value)
  return text.match(/\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/i)?.[0] ?? ''
}

/**
 * Extracts cantrip scaling dice from one or more 5etools scaling objects.
 *
 * @param value Raw `scalingLevelDice` value.
 * @returns Dice expressions ordered by character level.
 */
export function cantripDiceFromRecord(value: unknown): string[] {
  const scalingObjects = Array.isArray(value) ? value : [value]
  const diceByLevel: { level: number; dice: string; order: number }[] = []
  let order = 0
  for (const scalingValue of scalingObjects) {
    if (!scalingValue || typeof scalingValue !== 'object') continue
    const scaling = (scalingValue as Record<string, unknown>).scaling
    if (!scaling || typeof scaling !== 'object') continue
    for (const [level, dice] of Object.entries(scaling as Record<string, unknown>)) {
      if (typeof dice !== 'string' || !Number.isFinite(Number(level))) continue
      diceByLevel.push({ level: Number(level), dice, order })
      order += 1
    }
  }
  return [...new Map(
    diceByLevel
      .sort((left, right) => left.level - right.level || left.order - right.order)
      .map(entry => [entry.dice, entry]),
  ).values()].map(entry => entry.dice)
}

/**
 * Extracts class names from the common 5etools class representation.
 *
 * @param value Raw classes field.
 * @returns Unique class names.
 */
export function classesFromRecord(value: unknown): string[] {
  if (!value || typeof value !== 'object') return []
  const classes = value as Record<string, unknown>
  const candidates = Array.isArray(value) ? value : Array.isArray(classes.from) ? classes.from : []
  return [...new Set(candidates.flatMap(classValue => {
    if (typeof classValue === 'string') return [classValue]
    if (!classValue || typeof classValue !== 'object') return []
    const entry = classValue as Record<string, unknown>
    return [stringValue(entry.name) ?? stringValue(entry.className)].filter((name): name is string => Boolean(name))
  }))]
}

/**
 * Renders nested 5etools entries and preprocesses inline tags.
 *
 * @param higherLevel Higher-level entries to append after the main entries.
 * @param entries Main spell entries.
 * @returns Paragraph-separated Markdown prose.
 */
export function textFromEntries(higherLevel: unknown, entries?: unknown): string {
  const paragraphs = flattenEntries(entries)
  const higher = flattenEntries(higherLevel).map(value => value.name ? `${value.name}. ${value.text}` : value.text)
  return [...paragraphs.map(value => value.text), ...higher].filter(Boolean).join('\n\n')
}

/**
 * Converts all supported 5etools inline tags into readable text.
 *
 * @param value Raw 5etools prose.
 * @returns Markdown-safe human-readable prose.
 */
export function preprocessTags(value: string): string {
  return value
    .replace(/\{@scaledamage\s+([^|}]+)\|[^|}]+\|([^}]+)\}/gi, '$2')
    .replace(/\{@damage\s+([^}]+)\}/gi, '$1')
    .replace(/\{@(?:b|bold)\s+([^}]+)\}/gi, '**$1**')
    .replace(/\{@(?:i|italic)\s+([^}]+)\}/gi, '*$1*')
    .replace(/\{@(?:spell|condition|item|creature|class|skill)\s+([^|}]+)(?:\|[^}]+)?\}/gi, '$1')
    .replace(/\{@variantrule\s+[^|}]+\|[^|}]+\|([^}]+)\}/gi, '$1')
    .replace(/\{@(?:hit|dc)\s+([^}]+)\}/gi, '$1')
    .replace(/\{@link\s+([^|}]+)(?:\|[^}]+)?\}/gi, '$1')
}

/**
 * Flattens entry strings and named entry groups.
 *
 * @param value Raw entries value.
 * @returns Text and optional heading pairs.
 */
function flattenEntries(value: unknown): { text: string; name?: string }[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(entry => {
    if (typeof entry === 'string') return [{ text: preprocessTags(entry) }]
    if (!entry || typeof entry !== 'object') return []
    const node = entry as Record<string, unknown>
    if (Array.isArray(node.entries)) return [{ text: textFromEntries(undefined, node.entries), name: stringValue(node.name) ?? undefined }]
    if (node.type === 'list' && Array.isArray(node.items)) return [{ text: node.items.map(item => `- ${flattenEntries([item]).map(value => value.text).join('\n')}`).join('\n') }]
    return []
  })
}

/**
 * Formats a timed duration and pluralizes its unit when needed.
 *
 * @param amount Numeric duration amount, or null when absent.
 * @param unit Raw duration unit.
 * @returns Human-readable timed duration.
 */
function formatTimedDuration(amount: number | null, unit: string): string {
  if (amount === null) return unit
  const displayUnit = amount === 1 || unit.endsWith('s') ? unit : `${unit}s`
  return `${amount} ${displayUnit}`.trim()
}
