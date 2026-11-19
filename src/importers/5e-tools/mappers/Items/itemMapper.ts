/**
 * Routes raw 5etools item records to their rarity and item-kind mappers.
 *
 * Mundane rarity entries stay in the items pipeline; every other rarity is
 * routed to the magic-items pipeline. Within mundane items, weapons are fully
 * mapped while initial category helpers provide stable fallback routing.
 */
import { mappedNote } from '../../markdown'
import type { FiveEToolsRecord, MappedNote } from '../../types'
import { mapWeapon } from './Weapons/weaponMapper'
import { mapArmorOrShield } from './Armor/armorShieldMapper'
import { mapAdventuringGear } from './Gear/adventuringGearMapper'
import { mapTool } from './Tools/toolMapper'
import { mapOtherItem } from './otherMapper'

/** Supported mundane item-kind categories. */
export type ItemKind =
  | 'Armor and Shield'
  | 'Weapons'
  | 'Adventuring gear'
  | 'Tools'
  | 'Other'

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
  return mappedNote(record, 'magicItem')
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
  if (record.weapon === true || record.weaponCategory !== undefined) return 'Weapons'
  const type = typeof record.type === 'string' ? record.type.split('|', 1)[0]?.trim().toUpperCase() ?? '' : ''
  if (type === 'A' || type === 'S' || type === 'SH') return 'Armor and Shield'
  if (typeof record.armor === 'boolean' && record.armor) return 'Armor and Shield'
  if (typeof record.axe === 'boolean' || typeof record.bow === 'boolean') return 'Weapons'
  if (type === 'AT' || type === 'T' || type === 'INS' || type === 'GS') return 'Tools'
  if (type === 'G' || type === 'AMMO' || type === 'EXP' || type === 'FOOD' || type === 'P' || type === 'SC') {
    return 'Adventuring gear'
  }
  return 'Other'
}
