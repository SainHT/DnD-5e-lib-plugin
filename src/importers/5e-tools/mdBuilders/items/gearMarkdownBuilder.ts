/**
 * Builds final Markdown for normalized 5etools gear and food/drink records.
 */
import { buildItemFrontmatter, buildItemBody, assembleItemNote } from '../itemMarkdownBuilder'
import { gearTags, type GearMarkdownData } from '../../helpers/items/gearHelpers'

/**
 * Assembles a complete gear or food/drink Markdown note.
 *
 * @param data Normalized gear values.
 * @returns Complete Markdown text ending with a newline.
 */
export async function buildGearMarkdown(data: GearMarkdownData): Promise<string> {
  const body = buildItemBody({
    name: data.name,
    subtitle: data.itemType,
    source: data.source,
    bodyText: data.bodyText,
    vaultItemLines: [
      ...(data.weight !== null ? [`weight: ${data.weight}`] : []),
    ],
  })

  return assembleItemNote(
    buildItemFrontmatter({
      name: data.name,
      source: data.source,
      itemType: data.itemType,
      costCp: data.costCp,
      weight: data.weight,
      tags: gearTags(data.itemType, data.source),
    }),
    body,
  )
}
