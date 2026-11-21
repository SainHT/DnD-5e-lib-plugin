/**
 * Coordinates 5etools armor and shield mapping.
 *
 * This module distinguishes shield records (`S`) from body armor records
 * (`LA`, `MA`, `HA`) and delegates rendering to the shared armor builder.
 */
import type { FiveEToolsRecord, MappedNote } from '../../../types'
import { buildArmorMarkdown } from '../../../mdBuilders/items/armorMarkdownBuilder'
import {
  armorAc,
  armorName,
  armorTypeName,
  armorWeight,
  costCopper,
  isShield,
  sourceForArmor,
  type ArmorMarkdownData,
} from './armorHelpers'

/**
 * Routes an armor-category record to its shield or body-armor mapper.
 *
 * @param record Raw named 5etools armor or shield record.
 * @returns Standard mapped-note data for the items pipeline.
 */
export function mapArmorItem(record: FiveEToolsRecord): MappedNote {
  if (isShield(record)) return mapShield(record)
  return mapArmor(record)
}

/**
 * Maps one armor or shield record through the Armor and Shield item kind.
 *
 * @param record Raw named 5etools armor or shield record.
 * @returns Standard mapped-note data for the items pipeline.
 */
export function mapArmorOrShield(record: FiveEToolsRecord): MappedNote {
  return mapArmorItem(record)
}

/**
 * Transforms one raw shield record into a mapped vault note.
 *
 * @param record Raw named 5etools shield record.
 * @returns Standard mapped-note data for the items pipeline.
 */
export function mapShield(record: FiveEToolsRecord): MappedNote {
  const data: ArmorMarkdownData = {
    name: armorName(record),
    source: sourceForArmor(record),
    itemType: 'Shield',
    costCp: costCopper(record),
    weight: armorWeight(record),
    ac: armorAc(record) ?? 2,
  }
  return {
    kind: 'item',
    name: data.name,
    markdown: buildArmorMarkdown(data),
  }
}

/**
 * Transforms one raw body-armor record into a mapped vault note.
 *
 * @param record Raw named 5etools body-armor record.
 * @returns Standard mapped-note data for the items pipeline.
 */
export function mapArmor(record: FiveEToolsRecord): MappedNote {
  const data: ArmorMarkdownData = {
    name: armorName(record),
    source: sourceForArmor(record),
    itemType: armorTypeName(record.type),
    costCp: costCopper(record),
    weight: armorWeight(record),
    ac: armorAc(record),
  }
  return {
    kind: 'item',
    name: data.name,
    markdown: buildArmorMarkdown(data),
  }
}
