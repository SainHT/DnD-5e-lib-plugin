/**
 * Coordinates transformation of fallback, miscellaneous, and mount-like items.
 */
import type { FiveEToolsRecord, MappedNote } from '../../../types'
import { buildOtherItemMarkdown } from './otherItemMarkdownBuilder'
import {
  otherItemCostCopper,
  otherItemCarryingCapacity,
  otherItemEntriesText,
  otherItemSpeed,
  otherItemTypeName,
  otherItemWeight,
  sourceForOtherItem,
  type OtherItemMarkdownData,
} from './otherItemHelpers'

/**
 * Maps one miscellaneous item record through the generic item note format.
 *
 * @param record Raw named 5etools miscellaneous item record.
 * @returns A mapped mundane item note.
 */
export function mapOtherItem(record: FiveEToolsRecord): MappedNote {
  const data: OtherItemMarkdownData = {
    name: typeof record.name === 'string' ? record.name : 'Unnamed Item',
    source: sourceForOtherItem(record),
    itemType: otherItemTypeName(record.type),
    costCp: otherItemCostCopper(record),
    weight: otherItemWeight(record),
    carryingCapacity: otherItemCarryingCapacity(record),
    speed: otherItemSpeed(record),
    bodyText: otherItemEntriesText(record.entries),
  }
  return {
    kind: 'item',
    name: data.name,
    markdown: buildOtherItemMarkdown(data),
  }
}
