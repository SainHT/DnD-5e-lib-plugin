/**
 * Coordinates transformation of one raw 5etools weapon record.
 *
 * Parsing stays in `weaponHelpers` and rendering stays in
 * `weaponMarkdownBuilder`, keeping this mapper useful for both imports and tests.
 */
import type { FiveEToolsRecord, MappedNote } from '../../../types'
import { buildWeaponMarkdown } from '../../../mdBuilders/items/weaponMarkdownBuilder'
import {
  sourceForWeapon,
  stringValue,
  weaponDamageType,
  weaponGroups,
  weaponMastery,
  weaponNumber,
  weaponProperties,
  weaponRange,
  weaponTypeName,
  type WeaponMarkdownData,
} from './weaponHelpers'

/**
 * Maps a raw 5etools weapon record to the standard importer note shape.
 *
 * @param record Raw named 5etools item record.
 * @returns Item kind, weapon name, and complete Markdown note.
 */
export function mapWeapon(record: FiveEToolsRecord): MappedNote {
  const source = sourceForWeapon(record)
  const itemType = weaponTypeName(record.type)
  const weaponCategory = stringValue(record.weaponCategory)?.toLowerCase() ?? ''
  const data: WeaponMarkdownData = {
    name: record.name,
    source,
    itemType,
    weaponCategory,
    costCp: weaponNumber(record.value),
    weight: weaponNumber(record.weight),
    damage: stringValue(record.dmg1) ?? '',
    damageType: weaponDamageType(record.dmgType),
    versatileDamage: stringValue(record.dmg2) ?? '',
    range: weaponRange(record.range),
    properties: weaponProperties(record.property),
    mastery: weaponMastery(record.mastery),
    groups: weaponGroups(record),
  }

  return {
    kind: 'item',
    name: record.name,
    markdown: buildWeaponMarkdown(data),
  }
}
