/**
 * Pure normalization helpers for 5etools shield and armor records.
 *
 * The functions in this module have no vault or Obsidian dependencies and
 * provide the deterministic values consumed by armor Markdown rendering.
 */
import { sha256 } from '../../hash'

const SRD_SOURCE = 'SRD 5.2.1'

/**
 * Converts a 5etools armor type code into a human-readable item type.
 *
 * @param value Raw `type` field from a 5etools item record.
 * @returns `Shield`, `Light Armor`, `Medium Armor`, `Heavy Armor`, or `Armor`.
 */
export function armorTypeName(value: unknown): string {
  const code = typeof value === 'string' ? value.split('|', 1)[0]?.trim().toUpperCase() ?? '' : ''
  if (code === 'S') return 'Shield'
  if (code === 'LA') return 'Light Armor'
  if (code === 'MA') return 'Medium Armor'
  if (code === 'HA') return 'Heavy Armor'
  return 'Armor'
}

/**
 * Determines whether an armor or shield record represents a shield.
 *
 * @param record Raw 5etools item record.
 * @returns True when the record's type code is `S`.
 */
export function isShield(record: Record<string, unknown>): boolean {
  if (typeof record.type !== 'string') return false
  return record.type.split('|', 1)[0]?.trim().toUpperCase() === 'S'
}

/**
 * Resolves the display source label for an armor or shield record.
 *
 * @param record Raw 5etools item record.
 * @returns `SRD 5.2.1` for SRD/basic-rule records, otherwise its source label.
 */
export function sourceForArmor(record: Record<string, unknown>): string {
  if (record.srd52 === true || record.basicRules2024 === true) return SRD_SOURCE
  return stringValue(record.source) ?? 'Unknown'
}

/**
 * Reads a 5etools value and converts it to copper pieces.
 *
 * 5etools commonly stores mundane-item values in copper pieces. Numeric
 * values are therefore treated as copper by default. Records that explicitly
 * declare `gp` as a unit are converted at 100 copper pieces per gold piece.
 *
 * @param record Raw 5etools item record.
 * @returns Cost in copper pieces or `null` when no numeric value is available.
 */
export function costCopper(record: Record<string, unknown>): number | null {
  const explicitGold = firstNumber(record.valueGp, record.gp)
  if (explicitGold !== null) return explicitGold * 100

  const value = record.value
  if (typeof value === 'number' && Number.isFinite(value)) {
    const unit = firstString(record.valueUnit, record.currency, record.costUnit)?.toLowerCase()
    return unit === 'gp' || unit === 'gold' ? value * 100 : value
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
 * Reads numeric Armor Class metadata from a 5etools record.
 *
 * @param record Raw 5etools item record.
 * @returns Numeric AC or `null` when unavailable.
 */
export function armorAc(record: Record<string, unknown>): number | null {
  const ac = firstNumber(record.ac, record.armorClass)
  return ac
}

/**
 * Reads weight in pounds from a 5etools record.
 *
 * @param record Raw 5etools item record.
 * @returns Numeric weight or `null` when unavailable.
 */
export function armorWeight(record: Record<string, unknown>): number | null {
  return firstNumber(record.weight)
}

/**
 * Normalizes a 5etools item name.
 *
 * @param record Raw 5etools item record.
 * @returns Record name or `Unnamed Armor`.
 */
export function armorName(record: Record<string, unknown>): string {
  return stringValue(record.name) ?? 'Unnamed Armor'
}

/**
 * Builds stable tags for a normalized armor or shield record.
 *
 * @param itemType Human-readable armor item type.
 * @param source Canonical display source.
 * @returns Ordered frontmatter tags.
 */
export function armorTags(itemType: string, source: string): string[] {
  const tags = ['item', `item/${slug(itemType)}`]
  if (source === SRD_SOURCE) tags.push('srd-5-2-1')
  return tags
}

/**
 * Computes the stable export fingerprint for an armor body.
 *
 * @param body Markdown body excluding frontmatter.
 * @returns SHA-256 fingerprint prefixed with `sha256-`.
 */
export function armorExportHash(body: string): string {
  return `sha256-${sha256(body).slice(0, 12)}`
}

/**
 * Normalized data consumed by the armor Markdown builder.
 */
export interface ArmorMarkdownData {
  /** Canonical armor or shield name. */
  name: string
  /** Canonical source label. */
  source: string
  /** Human-readable item type. */
  itemType: string
  /** Cost in copper pieces. */
  costCp: number | null
  /** Weight in pounds. */
  weight: number | null
  /** Numeric Armor Class. */
  ac: number | null
}

/**
 * Converts a display label into a lowercase hyphenated slug.
 *
 * @param value Human-readable label.
 * @returns Lowercase URL-safe tag segment.
 */
export function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Reads the first finite number among candidate values.
 *
 * @param candidates Candidate unknown values.
 * @returns First finite number or `null`.
 */
function firstNumber(...candidates: unknown[]): number | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
    if (typeof candidate === 'string' && candidate.trim()) {
      const parsed = Number(candidate.trim())
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

/**
 * Reads the first non-empty string among candidate values.
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
