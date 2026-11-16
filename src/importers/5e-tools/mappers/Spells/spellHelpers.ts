/**
 * Pure parsing and normalization helpers for 5etools spell records.
 */
import { sha256 } from '../hash'

const SRD_SOURCE = 'SRD 5.2.1'

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
 * Resolves the canonical source label for a spell.
 *
 * @param record Raw spell record.
 * @returns SRD 5.2.1 for SRD-marked records, otherwise the source or Unknown.
 */
export function sourceForRecord(record: Record<string, unknown>): string {
  return record.srd52 === true || record.basicRules2024 === true ? SRD_SOURCE : stringValue(record.source) ?? 'Unknown'
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
 * Formats the first duration entry and preserves concentration metadata.
 *
 * @param value Raw 5etools duration array.
 * @returns Human-readable duration text.
 */
export function durationText(value: unknown): string {
  if (!Array.isArray(value) || !value[0] || typeof value[0] !== 'object') return ''
  const duration = value[0] as Record<string, unknown>
  const type = stringValue(duration.type) ?? ''
  if (type === 'instant') return 'Instantaneous'
  if (type === 'permanent') return 'Permanent'
  const amount = typeof duration.amount === 'number' ? String(duration.amount) : ''
  const unit = stringValue(duration.unit) ?? stringValue(duration.type) ?? ''
  return [amount, unit].filter(Boolean).join(' ') || unit
}

/**
 * Checks whether a spell duration is concentration-based.
 *
 * @param record Raw spell record.
 * @returns True when the record marks concentration.
 */
export function concentrationFromRecord(record: Record<string, unknown>): boolean {
  if (record.concentration === true) return true
  const duration = Array.isArray(record.duration) ? record.duration[0] : null
  return Boolean(duration && typeof duration === 'object' && (duration as Record<string, unknown>).concentration === true)
}

/**
 * Checks whether a spell is a ritual.
 *
 * @param record Raw spell record.
 * @returns True when the record marks ritual casting.
 */
export function ritualFromRecord(record: Record<string, unknown>): boolean {
  return record.ritual === true
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
    .replace(/\{@(?:hit|dc)\s+([^}]+)\}/gi, '$1')
    .replace(/\{@link\s+([^|}]+)(?:\|[^}]+)?\}/gi, '$1')
}

/**
 * Computes the short export fingerprint used in generated frontmatter.
 *
 * @param body Canonical generated body.
 * @returns SHA-256 metadata value.
 */
export function exportHash(body: string): string {
  return `sha256-${sha256(body).slice(0, 12)}`
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
 * Returns a trimmed string or null.
 *
 * @param value Unknown raw value.
 * @returns A trimmed string, or null.
 */
function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}
