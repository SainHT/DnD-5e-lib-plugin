/**
 * Routes raw 5etools item records to their rarity and item-kind mappers.
 *
 * Mundane rarity entries stay in the items pipeline; every other rarity is
 * routed to the magic-items pipeline. Within mundane items, weapons are fully
 * mapped while initial category helpers provide stable fallback routing.
 */
import type { FiveEToolsRecord, MappedNote } from '../../types'
import { mapWeapon } from './Weapons/weaponMapper'
import { mapArmorOrShield } from './Armor/armorMapper'
import { mapAdventuringGear } from './Gear/gearMapper'
import { mapTool } from './Tools/toolMapper'
import { mapOtherItem } from './Other/otherItemMapper'
import { mapMagicItem as mapMagicItemRecord } from './MagicItems/magicItemMapper'

/** Supported mundane item-kind categories. */
export type ItemKind =
  | 'Armor and Shield'
  | 'Weapons'
  | 'Adventuring gear'
  | 'Tools'
  | 'Treasure'
  | 'Other'

/** 5etools rule-set era labels that are outside the supported item importer. */
const EXCLUDED_ERAS: readonly string[] = ['futuristic', 'modern', 'renaissance']

/** 5etools type codes that identify weapons and ammunition. */
const WEAPON_TYPE_CODES: ReadonlySet<string> = new Set(['M', 'R', 'AF', 'A', 'FIREARM'])

/** 5etools type codes that identify body armor and shields. */
const ARMOR_TYPE_CODES: ReadonlySet<string> = new Set(['LA', 'MA', 'HA', 'S', 'SH'])

/** 5etools type codes that identify tools and instruments. */
const TOOL_TYPE_CODES: ReadonlySet<string> = new Set(['AT', 'GS', 'INS', 'T', 'TK'])

/** 5etools type codes that identify Adventuring Gear and related goods. */
const GEAR_TYPE_CODES: ReadonlySet<string> = new Set([
  'G', 'EXP', 'FD', 'FOOD', 'P', 'POT', 'RG', 'RD', 'SC', 'SCF', 'ST',
  'WD', 'WAND', 'AMMO', 'POTION', 'RING', 'ROD', 'SCROLL', 'STAFF',
])

/** 5etools type codes that identify treasure records. */
const TREASURE_TYPE_CODES: ReadonlySet<string> = new Set(['TB', 'TG', 'TA', 'TC', 'TGEM'])

/**
 * Maps one raw item and routes it by rarity and mundane item kind.
 *
 * @param record Raw named 5etools item record.
 * @returns A mapped mundane item or magic item note.
 */
export function mapItem(record: FiveEToolsRecord): MappedNote {
  if (isMagicItem(record)) return mapMagicItem(record)
  switch (itemKind(record)) {
    case 'Weapons':
      return mapWeapon(record)
    case 'Armor and Shield':
      return mapArmorOrShield(record)
    case 'Adventuring gear':
      return mapAdventuringGear(record)
    case 'Tools':
      return mapTool(record)
    case 'Other':
      return mapOtherItem(record)
  }
  return mapOtherItem(record)
}

/**
 * Maps a magic item record to the magic-item entity pipeline.
 *
 * @param record Raw magic-item record.
 * @returns A mapped magic-item note.
 */
export function mapMagicItem(record: FiveEToolsRecord): MappedNote {
  return mapMagicItemRecord(record)
}

/**
 * Determines whether a 5etools record belongs to the magic-items pipeline.
 *
 * @param record Raw 5etools item record.
 * @returns True unless rarity is the exact lowercase value `none`.
 */
export function isMagicItem(record: Record<string, unknown>): boolean {
  if (typeof record.rarity !== 'string') return false
  return record.rarity.trim().toLowerCase() !== 'none'
}

/**
 * Determines the user-facing kind of a mundane item record.
 *
 * @param record Raw 5etools item record.
 * @returns One of the supported mundane item categories.
 */
export function itemKind(record: Record<string, unknown>): ItemKind {
  const type = typeof record.type === 'string' ? record.type.split('|', 1)[0]?.trim().toUpperCase() ?? '' : ''
  if (TREASURE_TYPE_CODES.has(type) || isTreasureItem(record)) return 'Treasure'
  if (WEAPON_TYPE_CODES.has(type) || record.ammunition === true || record.firearm === true
      || typeof record.firearm === 'boolean' && record.firearm) {
    return 'Weapons'
  }
  if (ARMOR_TYPE_CODES.has(type) || typeof record.armor === 'boolean' && record.armor) {
    return 'Armor and Shield'
  }
  if (TOOL_TYPE_CODES.has(type)) return 'Tools'
  if (GEAR_TYPE_CODES.has(type)
    || typeof record.poison === 'boolean' && record.poison
    || typeof record.potion === 'boolean' && record.potion
    || typeof record.focus === 'boolean' && record.focus) {
    return 'Adventuring gear'
  }
  return 'Other'
}

/**
 * Determines whether a record belongs to a Treasure subcategory.
 *
 * @param record Raw 5etools item record.
 * @returns True for trade bars, trade goods, art objects, coinage, and gemstones.
 */
export function isTreasureItem(record: Record<string, unknown>): boolean {
  const type = typeof record.type === 'string' ? record.type.split('|', 1)[0]?.trim().toUpperCase() ?? '' : ''
  const treasureLabel = type.replace(/[^A-Z]/g, '')
  if (TREASURE_TYPE_CODES.has(type) || TREASURE_TYPE_CODES.has(treasureLabel)) return true
  if (/^(TRADE (BAR|GOOD)|TREASURE(?:\s*\(|$))/i.test(type)) return true

  const category = [
    record.category,
    record.subCategory,
    record.treasure,
  ].flatMap(value => typeof value === 'string' ? [value] : [])
  return category.some(value => /^(trade (bar|good)|treasure(?:\s*\(|$))/i.test(value.trim()))
}

/**
 * Returns the strict routing category for an item record.
 *
 * Excluded era records and Treasure records receive explicit routing outcomes
 * instead of being silently treated as generic items.
 *
 * @param record Raw 5etools item record.
 * @returns `Excluded`, `Treasure`, or one of the supported item-kind names.
 */
export function routeItemCategory(record: Record<string, unknown>): 'Excluded' | ItemKind {
  if (shouldExcludeItem(record)) return 'Excluded'
  return itemKind(record)
}

/**
 * Compatibility alias for routing an item to its strict category.
 *
 * @param record Raw 5etools item record.
 * @returns Strict routing category or `Excluded`.
 */
export function routeItemKind(record: Record<string, unknown>): 'Excluded' | ItemKind {
  return routeItemCategory(record)
}

/**
 * Checks whether an item belongs to a disallowed time period or rule set.
 *
 * Era exclusion is based only on the explicit `age` field.
 *
 * @param record Raw 5etools item record.
 * @returns True for Futuristic, Modern, or Renaissance content.
 */
export function shouldExcludeItem(record: Record<string, unknown>): boolean {
  if (typeof record.age !== 'string') return false
  return EXCLUDED_ERAS.includes(record.age.trim().toLowerCase())
}

/**
 * Compatibility alias for era-based item exclusion.
 *
 * @param record Raw 5etools item record.
 * @returns True when the item is Futuristic, Modern, or Renaissance.
 */
export function isExcludedItem(record: Record<string, unknown>): boolean {
  return shouldExcludeItem(record)
}
