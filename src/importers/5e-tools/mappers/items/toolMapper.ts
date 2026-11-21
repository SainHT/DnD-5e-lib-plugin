/**
 * Coordinates transformation of one raw 5etools tool or instrument record.
 *
 * Parsing is delegated to `toolHelpers` and rendering to
 * `toolMarkdownBuilder`, keeping this mapper reusable and testable.
 */
import type { FiveEToolsRecord, MappedNote } from '../../types'
import { buildToolMarkdown } from '../../mdBuilders/items/toolMarkdownBuilder'
import {
  parseToolEntries,
  sourceForTool,
  toolCostCopper,
  toolTypeName,
  toolWeight,
  type ToolMarkdownData,
} from '../../helpers/items/toolHelpers'

/**
 * Maps a raw 5etools tool or instrument record to a standard mapped note.
 *
 * @param record Raw named 5etools tool record.
 * @returns Tool kind, name, and complete Markdown note.
 */
export function mapTool(record: FiveEToolsRecord): MappedNote {
  const details = parseToolEntries(record.entries)
  const data: ToolMarkdownData = {
    name: typeof record.name === 'string' ? record.name : 'Unnamed Tool',
    source: sourceForTool(record),
    itemType: toolTypeName(record.type),
    costCp: toolCostCopper(record),
    weight: toolWeight(record),
    ability: details.ability,
    utilizes: details.utilizes,
    crafts: details.crafts,
  }
  return {
    kind: 'item',
    name: data.name,
    markdown: buildToolMarkdown(data),
  }
}
