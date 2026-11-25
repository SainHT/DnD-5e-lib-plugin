/**
 * Shared normalization for every 5etools item kind.
 *
 * Kind helpers keep type names and kind-specific fields. Source labels, cost,
 * weight, slugs, tags, export hashes, and mundane entry text live here.
 */
import {
  exportHash,
  firstNumber,
  firstString,
  slug,
  sourceForRecord,
  stringValue,
} from './mapperHelpers'

export { firstNumber, stringValue, firstString }

export const itemSource = sourceForRecord
export const itemExportHash = exportHash
export const itemSlug = (value: string): string => slug(value, '-')

/**
 * Reads the type code before a 5etools `TYPE|source` separator.
 *
 * @param value Raw `type` field.
 * @returns Uppercase type code, or an empty string.
 */
export function itemTypeCode(value: unknown): string {
  return typeof value === 'string' ? value.split('|', 1)[0]?.trim().toUpperCase() ?? '' : ''
}

/**
 * Converts a 5etools value field into copper pieces.
 *
 * Explicit copper wins, then explicit gold. A bare number is copper unless a
 * unit says otherwise. Gold is 100 copper and silver is 10.
 *
 * @param record Raw 5etools item record.
 * @returns Cost in copper pieces, or `null` when no numeric value is available.
 */
export function itemCostCopper(record: Record<string, unknown>): number | null {
  const copper = firstNumber(record.valueCp, record.cp)
  if (copper !== null) return copper

  const gold = firstNumber(record.valueGp, record.gp)
  if (gold !== null) return gold * 100

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
 * Reads weight in pounds from an item record.
 *
 * @param record Raw 5etools item record.
 * @returns Numeric weight, or `null` when unavailable.
 */
export function itemWeight(record: Record<string, unknown>): number | null {
  return firstNumber(record.weight)
}

/**
 * Builds the base frontmatter tags shared by mundane items.
 *
 * @param itemType Human-readable item type.
 * @param source Canonical display source.
 * @returns Ordered frontmatter tags.
 */
export function itemTags(itemType: string, _source: string): string[] {
  return ['item', `item/${itemSlug(itemType)}`]
}

/**
 * Replaces 5etools inline markup with clean readable text.
 *
 * @param value Raw 5etools text.
 * @returns Plain text with inline tags removed.
 */
export function cleanItemTags(value: string): string {
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
 * Recursively renders nested 5etools entries as clean prose.
 *
 * @param entries Raw `entries` field.
 * @returns Clean readable text paragraphs.
 */
export function itemEntriesText(entries: unknown): string {
  return renderEntries(entries).replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Recursively cleans one nested entry value.
 *
 * @param value Raw nested entry value.
 * @returns Rendered text.
 */
function renderEntries(value: unknown): string {
  if (typeof value === 'string') return cleanItemTags(value)
  if (Array.isArray(value)) return value.map(renderEntries).filter(Boolean).join('\n\n')
  if (!value || typeof value !== 'object') return ''

  const entry = value as Record<string, unknown>
  const name = stringValue(entry.name)
  if (typeof entry.entry === 'string') {
    const text = cleanItemTags(entry.entry)
    return name ? `**${cleanItemTags(name)}.** ${text}` : text
  }
  if (typeof entry.items === 'string') return cleanItemTags(entry.items)
  if (Array.isArray(entry.items)) {
    return entry.items.map(item => `- ${typeof item === 'string' ? cleanItemTags(item) : renderEntries(item)}`).join('\n')
  }
  if (Array.isArray(entry.entries)) {
    const text = renderEntries(entry.entries)
    return name ? `**${cleanItemTags(name)}.** ${text}` : text
  }
  return ''
}


