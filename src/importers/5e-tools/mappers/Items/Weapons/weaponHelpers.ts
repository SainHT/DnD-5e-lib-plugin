/**
 * Pure normalization helpers for 5etools weapon records.
 *
 * These helpers intentionally have no Obsidian or vault dependencies so
 * weapon mapping remains deterministic and directly unit-testable.
 */
import { sha256 } from '../../hash'

const SRD_SOURCE = 'SRD 5.2.1'

const DAMAGE_TYPES: Readonly<Record<string, string>> = {
  A: 'Acid',
  B: 'Bludgeoning',
  C: 'Cold',
  F: 'Fire',
  FC: 'Force',
  L: 'Lightning',
  N: 'Necrotic',
  P: 'Piercing',
  R: 'Radiant',
  S: 'Slashing',
  T: 'Thunder',
  V: 'Poison',
  Y: 'Psychic',
}

const PROPERTY_NAMES: Readonly<Record<string, string>> = {
  '2H': 'Two-Handed',
  A: 'Ammunition',
  AF: 'Arcane Focus',
  BF: 'Bonus Firearm',
  DF: 'Druidic Focus',
  EM: 'Energy Source',
  F: 'Finesse',
  H: 'Heavy',
  L: 'Light',
  LD: 'Loading',
  R: 'Reach',
  RC: 'Reinforcement',
  RCH: 'Reload',
  S: 'Special',
  SP: 'Silvered',
  T: 'Thrown',
  V: 'Versatile',
}

/**
 * Normalized data consumed by the weapon Markdown builder.
 */
export interface WeaponMarkdownData {
  /** Canonical weapon name. */
  name: string
  /** 5etools source label, normalized for SRD records. */
  source: string
  /** Human-readable weapon type, such as `Melee Weapon`. */
  itemType: string
  /** Simple or martial weapon category. */
  weaponCategory: string
  /** Cost in copper pieces. */
  costCp: number | null
  /** Weight in pounds. */
  weight: number | null
  /** Primary damage dice. */
  damage: string
  /** Human-readable damage type. */
  damageType: string
  /** Versatile damage dice, when present. */
  versatileDamage: string
  /** Range or thrown/ammunition range text. */
  range: string
  /** Human-readable weapon properties. */
  properties: string[]
  /** Human-readable weapon mastery name. */
  mastery: string
  /** Human-readable group names associated with the item. */
  groups: string[]
}

/**
 * Resolves the source label used in weapon frontmatter.
 *
 * @param record Raw 5etools item record.
 * @returns `SRD 5.2.1` for SRD/basic-rule records, otherwise the source name.
 */
export function sourceForWeapon(record: Record<string, unknown>): string {
  return record.srd52 === true || record.basicRules2024 === true
    ? SRD_SOURCE
    : stringValue(record.source) ?? 'Unknown'
}

/**
 * Converts a 5etools weapon type code into a readable item type.
 *
 * @param value Raw `type` field.
 * @returns `Melee Weapon`, `Ranged Weapon`, or `Weapon`.
 */
export function weaponTypeName(value: unknown): string {
  const code = typeof value === 'string' ? value.split('|', 1)[0]?.trim().toUpperCase() : ''
  if (code === 'M') return 'Melee Weapon'
  if (code === 'R') return 'Ranged Weapon'
  return 'Weapon'
}

/**
 * Converts 5etools property abbreviations into readable labels.
 *
 * @param value Raw `property` array.
 * @returns Ordered unique property names.
 */
export function weaponProperties(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.flatMap(entry => {
    const code = typeof entry === 'string' ? entry.split('|', 1)[0]?.trim().toUpperCase() : ''
    if (!code) return []
    return [PROPERTY_NAMES[code] ?? titleCase(code)]
  }))]
}

/**
 * Extracts and normalizes the weapon mastery name.
 *
 * @param value Raw `mastery` array or string.
 * @returns A mastery name or an empty string.
 */
export function weaponMastery(value: unknown): string {
  const entries = Array.isArray(value) ? value : [value]
  for (const entry of entries) {
    if (typeof entry !== 'string') continue
    const name = entry.split('|', 1)[0]?.trim()
    if (name) return name
  }
  return ''
}

/**
 * Converts a 5etools damage code into a human-readable damage type.
 *
 * @param value Raw `dmgType` field.
 * @returns Full damage type name or an empty string.
 */
export function weaponDamageType(value: unknown): string {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return DAMAGE_TYPES[code] ?? (code ? titleCase(code) : '')
}

/**
 * Formats a 5etools range value for frontmatter and vault-item metadata.
 *
 * @param value Raw `range` field.
 * @returns Range text, or an empty string when unavailable.
 */
export function weaponRange(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : ''
}

/**
 * Extracts human-readable item-group names used for focus, tool, and item tags.
 *
 * @param record Raw 5etools item record.
 * @returns Ordered unique group names.
 */
export function weaponGroups(record: Record<string, unknown>): string[] {
  const raw = record.group ?? record.groups
  const values = Array.isArray(raw) ? raw : raw !== undefined ? [raw] : []
  return [...new Set(values.flatMap(value => {
    if (typeof value !== 'string') return []
    const name = value.split('|', 1)[0]?.trim()
    return name ? [name] : []
  }))]
}

/**
 * Builds stable weapon tags for frontmatter categorization.
 *
 * @param data Normalized weapon data.
 * @returns Ordered tag list.
 */
export function weaponTags(data: WeaponMarkdownData): string[] {
  const tags = [
    'item',
    `item/${data.itemType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  ]
  if (data.weaponCategory) tags.push(`weapon/${data.weaponCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
  if (data.source === SRD_SOURCE) tags.push('srd-5-2-1')
  for (const group of data.groups) tags.push(`group/${slug(group)}`)
  return tags
}

/**
 * Reads a numeric record field and rejects non-finite values.
 *
 * @param value Unknown field value.
 * @returns Finite number or `null`.
 */
export function weaponNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Reads a string record field and trims surrounding whitespace.
 *
 * @param value Unknown field value.
 * @returns Trimmed string or `null`.
 */
export function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/**
 * Computes the stable export fingerprint for a weapon body.
 *
 * @param body Complete Markdown body excluding frontmatter.
 * @returns A SHA-256 fingerprint prefixed with `sha256-`.
 */
export function exportHash(body: string): string {
  return `sha256-${sha256(body).slice(0, 12)}`
}

/**
 * Converts a display label into a lowercase URL-safe tag segment.
 *
 * @param value Human-readable label.
 * @returns Lowercase hyphenated slug.
 */
export function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Converts a short uppercase code into title case.
 *
 * @param value Raw code or label.
 * @returns Readable title-cased text.
 */
function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(?:^|\s)[a-z]/g, letter => letter.toUpperCase())
}
