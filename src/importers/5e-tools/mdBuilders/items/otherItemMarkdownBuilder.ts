/**
 * Builds final Markdown for miscellaneous and fallback 5etools items.
 */
import { buildItemFrontmatter, buildItemBody, assembleItemNote } from '../itemMarkdownBuilder'
import { otherItemTags, type OtherItemMarkdownData } from '../../helpers/items/otherItemHelpers'

/**
 * Assembles a complete fallback item Markdown note.
 *
 * @param data Normalized fallback item values.
 * @returns Complete Markdown text ending with a newline.
 */
export async function buildOtherItemMarkdown(data: OtherItemMarkdownData): Promise<string> {
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
      extra: {
        ...(data.carryingCapacity ? { carrying_capacity: data.carryingCapacity } : {}),
        ...(data.speed ? { speed: data.speed } : {}),
      },
      tags: otherItemTags(data.itemType, data.source),
    }),
    body,
  )
}
