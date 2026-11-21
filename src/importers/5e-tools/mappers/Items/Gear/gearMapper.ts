/**
 * Coordinates transformation of one raw 5etools gear or food/drink record.
 *
 * Parsing is delegated to `gearHelpers` and rendering to
 * `gearMarkdownBuilder`, keeping this mapper reusable and testable.
 */
import type { FiveEToolsRecord, MappedNote } from '../../../types'
import { buildGearMarkdown } from '../../../mdBuilders/items/gearMarkdownBuilder'
import {
  gearCostCopper,
  gearEntriesText,
  gearTypeName,
  gearWeight,
  isConsumableGear,
  sourceForGear,
  type GearMarkdownData,
} from './gearHelpers'

/**
 * Maps a raw 5etools gear record to a standard mapped note.
 *
 * @param record Raw named 5etools gear or food/drink record.
 * @returns Item kind, name, and complete Markdown note.
 */
export function mapGear(record: FiveEToolsRecord): MappedNote {
  const data: GearMarkdownData = {
    name: typeof record.name === 'string' ? record.name : 'Unnamed Gear',
    source: sourceForGear(record),
    itemType: gearTypeName(record.type),
    costCp: gearCostCopper(record),
    weight: gearWeight(record),
    consumable: isConsumableGear(record),
    bodyText: gearEntriesText(record.entries),
  }
  return {
    kind: 'item',
    name: data.name,
    markdown: buildGearMarkdown(data),
  }
}

/**
 * Compatibility alias for the Adventuring Gear category route.
 *
 * @param record Raw named 5etools gear record.
 * @returns Standard mapped gear note.
 */
export function mapAdventuringGear(record: FiveEToolsRecord): MappedNote {
  return mapGear(record)
}
