/**
 * Builds final Markdown for normalized 5etools shield and armor records.
 */
import { buildItemFrontmatter, buildItemBody, assembleItemNote } from '../itemMarkdownBuilder'
import { armorExportHash, armorTags, type ArmorMarkdownData } from '../../helpers/items/armorHelpers'

/**
 * Assembles a complete armor or shield Markdown note.
 *
 * @param data Normalized armor or shield values.
 * @returns Complete Markdown text ending with a newline.
 */
export function buildArmorMarkdown(data: ArmorMarkdownData): string {
  const body = buildItemBody({
    name: data.name,
    subtitle: data.itemType,
    source: data.source,
    vaultItemLines: [
      ...(data.weight !== null ? [`weight: ${data.weight}`] : []),
      ...(data.ac !== null ? [`ac: ${data.ac}`] : []),
    ],
  })

  return assembleItemNote(
    buildItemFrontmatter({
      name: data.name,
      source: data.source,
      itemType: data.itemType,
      costCp: data.costCp,
      weight: data.weight,
      extra: [...(data.ac !== null ? [`ac: ${data.ac}`] : [])],
      tags: armorTags(data.itemType, data.source),
      exportHash: armorExportHash(body),
    }),
    body,
  )
}
