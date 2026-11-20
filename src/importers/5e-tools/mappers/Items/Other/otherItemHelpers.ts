/**
 * Pure parsing helpers for miscellaneous, mount, vehicle, and fallback items.
 *
 * This module is independent of Obsidian and vault APIs so fallback metadata
 * normalization remains deterministic and unit-testable.
 */
import { sha256 } from '../../hash'

const SRD_SOURCE = 'SRD 5.2.1'

/**
 * Normalized values consumed by the fallback item Markdown builder.
 */
export interface OtherItemMarkdownData {
  /** Canonical item name. */
  name: string
  /** Canonical display source. */
  source: string
  /** Human-readable fallback item type. */
  itemType: string
  /** Cost in copper pieces. */
  costCp: number | null
  /** Weight in pounds. */
  weight: number | null
  /** Carrying capacity, when available. */
  carryingCapacity: string
  /** Movement speed, when available. */
  speed: string
  /** Clean description text from nested 5etools entries. */
  bodyText: string
}

/**
 * Maps a miscellaneous 5etools type code to a readable item type.
 *
 * @param value Raw `type` field.
 * @returns A readable fallback type or `Other`.
 */
export function otherItemTypeName(value: unknown): string {
  const code = typeof value === 'string' ? value.split('|', 1)[0]?.trim().toUpperCase() ?? '' : ''
  const names: Readonly<Record<string, string>> = {
    MNT: 'Mount',
    TAH: 'Tack and Harness',
    AIR: 'Vehicle (Air)',
    LAND: 'Vehicle (Land)',
    SEA: 'Vehicle (Water)',
    SPACE: 'Vehicle (Space)',
    VEHICLE: 'Vehicle',
    GV: 'Generic Variant',
    TAT: 'Tattoo',
  }
  return names[code] ?? 'Other'
}

/**
 * Resolves the display source label for a fallback item.
 *
 * @param record Raw 5etools item record.
 * @returns `SRD 5.2.1` for SRD/basic-rule records, otherwise the source label.
 */
export function sourceForOtherItem(record: Record<string, unknown>): string {
  if (record.srd52 === true || record.basicRules2024 === true) return SRD_SOURCE
  return stringValue(record.source) ?? 'Unknown'
}

/**
 * Converts a fallback item value field into copper pieces.
 *
 * @param record Raw 5etools item record.
 * @returns Cost in copper pieces or `null` when absent.
 */
export function otherItemCostCopper(record: Record<string, unknown>): number | null {
  const cp = firstNumber(record.valueCp, record.cp)
  if (cp !== null) return cp

  const gp = firstNumber(record.valueGp, record.gp)
  if (gp !== null) return gp * 100

  const value = record.value
  if (typeof value === 'number' && Number.isFinite(value)) {
    const unit = firstString(record.valueUnit, record.currency, record.costUnit)?.toLowerCase()
    if (unit === 'gp' || unit === 'gold') return value * 100
    if (unit === 'sp' || unit === 'silver') return value * 10
    return value
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
 * Reads weight in pounds from a fallback item.
 *
 * @param record Raw 5etools item record.
 * @returns Numeric weight or `null`.
 */
export function otherItemWeight(record: Record<string, unknown>): number | null {
  return firstNumber(record.weight)
}

/**
 * Extracts carrying capacity from common 5etools fields.
 *
 * @param record Raw 5etools item record.
 * @returns Carrying-capacity text or an empty string.
 */
export function otherItemCarryingCapacity(record: Record<string, unknown>): string {
  const value = record.carryingCapacity ?? record.capacity
  if (typeof value === 'number' && Number.isFinite(value)) return `${value} lb.`
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

/**
 * Extracts walking or general speed from a fallback item.
 *
 * @param record Raw 5etools item record.
 * @returns Speed text or an empty string.
 */
export function otherItemSpeed(record: Record<string, unknown>): string {
  const value = record.speed
  if (typeof value === 'number' && Number.isFinite(value)) return `${value} ft.`
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (value && typeof value === 'object') {
    const walk = (value as Record<string, unknown>).walk
    if (typeof walk === 'number' && Number.isFinite(walk)) return `${walk} ft.`
  }
  return ''
}

/**
 * Recursively converts fallback item entries to clean plain text.
 *
 * @param entries Raw `entries` field.
 * @returns Clean readable text.
 */
export function otherItemEntriesText(entries: unknown): string {
  return renderEntries(entries).replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Recursively renders one nested fallback entry value.
 *
 * @param value Raw nested entry.
 * @returns Clean rendered text.
 */
function renderEntries(value: unknown): string {
  if (typeof value === 'string') return cleanOtherItemTags(value)
  if (Array.isArray(value)) return value.map(renderEntries).filter(Boolean).join('\n\n')
  if (!value || typeof value !== 'object') return ''
  const entry = value as Record<string, unknown>
  const name = stringValue(entry.name)
  if (typeof entry.entry === 'string') {
    const text = cleanOtherItemTags(entry.entry)
    return name ? `**${cleanOtherItemTags(name)}.** ${text}` : text
  }
  if (Array.isArray(entry.entries)) {
    const text = renderEntries(entry.entries)
    return name ? `**${cleanOtherItemTags(name)}.** ${text}` : text
  }
  return ''
}

/**
 * Removes 5etools inline markup while preserving readable values.
 *
 * @param value Raw 5etools text.
 * @returns Plain readable text.
 */
export function cleanOtherItemTags(value: string): string {
  return value
    .replace(/\{@dc\s+([^}]+)\}/gi, 'DC $1')
    .replace(/\{@(?:item|spell|action|condition|creature|skill|damage|hazard|variantrule)\s+([^}|]+)(?:\|[^}|]*)*\|?([^}]*)\}/gi,
      (_match, name: string, display: string) => display?.trim() || name.trim())
    .replace(/\{@[^|\s}]+\s+([^}|]+)(?:\|[^}]*)?\}/gi, '$1')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Builds stable tags for a fallback item.
 *
 * @param itemType Human-readable item type.
 * @param source Canonical source label.
 * @returns Ordered tag list.
 */
export function otherItemTags(itemType: string, source: string): string[] {
  return [
    'item',
    `item/${otherItemSlug(itemType)}`,
    ...(source === SRD_SOURCE ? ['srd-5-2-1'] : []),
  ]
}

/**
 * Converts a fallback item type into a lowercase hyphenated slug.
 *
 * @param value Human-readable item type.
 * @returns Lowercase URL-safe tag segment.
 */
export function otherItemSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Computes a stable export fingerprint for fallback item body text.
 *
 * @param body Markdown body excluding frontmatter.
 * @returns SHA-256 fingerprint prefixed with `sha256-`.
 */
export function otherItemExportHash(body: string): string {
  return `sha256-${sha256(body).slice(0, 12)}`
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
