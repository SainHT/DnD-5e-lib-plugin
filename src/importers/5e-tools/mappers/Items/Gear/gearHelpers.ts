/**
 * Pure parsing and normalization helpers for 5etools gear and food records.
 *
 * These helpers intentionally avoid Obsidian and vault dependencies so gear
 * mapping remains deterministic and directly unit-testable.
 */
import { sha256 } from '../../hash'

const SRD_SOURCE = 'SRD 5.2.1'

/**
 * Normalized gear values consumed by the Markdown builder.
 */
export interface GearMarkdownData {
  /** Canonical gear name. */
  name: string
  /** Canonical display source. */
  source: string
  /** Human-readable gear category. */
  itemType: string
  /** Cost in copper pieces. */
  costCp: number | null
  /** Weight in pounds. */
  weight: number | null
  /** Whether the item is consumable. */
  consumable: boolean
  /** Clean rendered description text. */
  bodyText: string
}

/**
 * Converts a 5etools gear type code into a human-readable item type.
 *
 * @param value Raw `type` field.
 * @returns `Food and Drink`, `Adventuring Gear`, or a suitable gear fallback.
 */
export function gearTypeName(value: unknown): string {
  const code = typeof value === 'string' ? value.split('|', 1)[0]?.trim().toUpperCase() ?? '' : ''
  if (code === 'FD' || code === 'FOOD') return 'Food and Drink'
  if (code === 'G' || code === 'GEAR') return 'Adventuring Gear'
  if (code === 'EXP') return 'Explosives'
  if (code === 'MNT') return 'Mount'
  if (code === 'P' || code === 'POTION') return 'Potion'
  if (code === 'RG' || code === 'RING') return 'Ring'
  if (code === 'RD' || code === 'ROD') return 'Rod'
  if (code === 'SC' || code === 'SCROLL') return 'Scroll'
  if (code === 'SCF') return 'Spellcasting Focus'
  if (code === 'ST' || code === 'STAFF') return 'Staff'
  if (code === 'TAH') return 'Tack and Harness'
  if (code === 'WD' || code === 'WAND') return 'Wand'
  return 'Adventuring Gear'
}

/**
 * Resolves the display source label for a gear record.
 *
 * @param record Raw 5etools gear record.
 * @returns `SRD 5.2.1` for SRD/basic-rule records, otherwise the source label.
 */
export function sourceForGear(record: Record<string, unknown>): string {
  if (record.srd52 === true || record.basicRules2024 === true) return SRD_SOURCE
  return stringValue(record.source) ?? 'Unknown'
}

/**
 * Converts a 5etools value field into copper pieces.
 *
 * @param record Raw 5etools gear record.
 * @returns Cost in copper pieces or `null` when value is absent.
 */
export function gearCostCopper(record: Record<string, unknown>): number | null {
  const explicit = firstNumber(record.valueCp, record.cp)
  if (explicit !== null) return explicit

  const gp = firstNumber(record.valueGp, record.gp)
  if (gp !== null) return gp * 100

  const value = record.value
  if (typeof value === 'number' && Number.isFinite(value)) {
    const unit = firstString(record.valueUnit, record.currency, record.costUnit)?.toLowerCase()
    return unit === 'gp' || unit === 'gold' ? value * 100 : unit === 'sp' || unit === 'silver' ? value * 10 : value
  }
  if (typeof value === 'string') {
    const match = value.trim().match(/^([\d,.]+)\s*(gp|cp|sp)?$/i)
    if (!match) return null
    const amount = Number(match[1].replace(/,/g, ''))
    if (!Number.isFinite(amount)) return null
    const unit = (match[2] ?? 'cp').toLowerCase()
    if (unit === 'gp') return amount * 100
    if (unit === 'sp') return amount * 10
    return amount
  }
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>
    const amount = firstNumber(object.amount, object.value)
    if (amount === null) return null
    const unit = firstString(object.unit, object.currency)?.toLowerCase()
    if (unit === 'gp' || unit === 'gold') return amount * 100
    if (unit === 'sp' || unit === 'silver') return amount * 10
    return amount
  }
  return null
}

/**
 * Reads weight in pounds from a gear record.
 *
 * @param record Raw 5etools gear record.
 * @returns Numeric weight or `null`.
 */
export function gearWeight(record: Record<string, unknown>): number | null {
  return firstNumber(record.weight)
}

/**
 * Detects whether a gear item is consumable.
 *
 * @param record Raw 5etools gear record.
 * @returns True when explicit or conventional consumable fields are set.
 */
export function isConsumableGear(record: Record<string, unknown>): boolean {
  if (record.consumable === true || record.expendable === true) return true
  return typeof record.entries === 'object'
    && Array.isArray(record.entries)
    && record.entries.some(entry => typeof entry === 'string' && /\bconsume\b|expend|single use/i.test(entry))
}

/**
 * Recursively renders nested 5etools entries as clean prose.
 *
 * @param entries Raw `entries` field.
 * @returns Clean readable text paragraphs.
 */
export function gearEntriesText(entries: unknown): string {
  return renderEntries(entries).replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Recursively cleans one nested entry value.
 *
 * @param value Raw nested entry value.
 * @returns Rendered text.
 */
function renderEntries(value: unknown): string {
  if (typeof value === 'string') return cleanGearTags(value)
  if (Array.isArray(value)) return value.map(renderEntries).filter(Boolean).join('\n\n')
  if (!value || typeof value !== 'object') return ''

  const entry = value as Record<string, unknown>
  const name = stringValue(entry.name)
  if (typeof entry.entry === 'string') {
    const text = cleanGearTags(entry.entry)
    return name ? `**${cleanGearTags(name)}.** ${text}` : text
  }
  if (typeof entry.items === 'string') return cleanGearTags(entry.items)
  if (Array.isArray(entry.items)) {
    return entry.items.map(item => `- ${typeof item === 'string' ? cleanGearTags(item) : renderEntries(item)}`).join('\n')
  }
  if (Array.isArray(entry.entries)) {
    const text = renderEntries(entry.entries)
    return name ? `**${cleanGearTags(name)}.** ${text}` : text
  }
  return ''
}

/**
 * Replaces 5etools inline markup with clean readable text.
 *
 * @param value Raw 5etools text.
 * @returns Plain text with DC, damage, action, item, and hazard tags cleaned.
 */
export function cleanGearTags(value: string): string {
  return value
    .replace(/\{@dc\s+([^}]+)\}/gi, 'DC $1')
    .replace(/\{@(?:damage|skill|spell|condition|creature|action|item|hazard|variantrule)\s+([^}|]+)(?:\|[^}|]*)*\|?([^}]*)\}/gi,
      (_match, name: string, display: string) => display?.trim() || name.trim())
    .replace(/\{@[^|\s}]+\s+([^}|]+)(?:\|[^}]*)?\}/gi, '$1')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Builds stable frontmatter tags for a gear item.
 *
 * @param itemType Human-readable gear item type.
 * @param source Canonical source label.
 * @returns Ordered tag list.
 */
export function gearTags(itemType: string, source: string): string[] {
  return [
    'item',
    `item/${slug(itemType)}`,
    ...(source === SRD_SOURCE ? ['srd-5-2-1'] : []),
  ]
}

/**
 * Computes a stable export fingerprint for a gear body.
 *
 * @param body Markdown body excluding frontmatter.
 * @returns SHA-256 fingerprint prefixed with `sha256-`.
 */
export function gearExportHash(body: string): string {
  return `sha256-${sha256(body).slice(0, 12)}`
}

/**
 * Converts a gear display label into a lowercase hyphenated slug.
 *
 * @param value Human-readable label.
 * @returns Lowercase URL-safe tag segment.
 */
export function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Reads the first finite numeric candidate.
 *
 * @param candidates Candidate unknown values.
 * @returns First finite number or `null`.
 */
function firstNumber(...candidates: unknown[]): number | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  }
  return null
}

/**
 * Reads the first non-empty string candidate.
 *
 * @param candidates Candidate unknown values.
 * @returns First trimmed string or `null`.
 */
function firstString(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return null
}

/**
 * Reads a trimmed string field.
 *
 * @param value Unknown field value.
 * @returns Trimmed string or `null`.
 */
function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}
