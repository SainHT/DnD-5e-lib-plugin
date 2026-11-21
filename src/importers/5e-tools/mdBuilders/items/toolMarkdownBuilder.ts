/**
 * Builds final Markdown for normalized 5etools tools and instruments.
 */
import { buildItemFrontmatter, buildItemBody, assembleItemNote } from '../itemMarkdownBuilder'
import { toolExportHash, toolTags, type ToolMarkdownData } from '../../helpers/items/toolHelpers'

/**
 * Assembles a complete tool or instrument Markdown note.
 *
 * @param data Normalized tool values.
 * @returns Complete Markdown text ending with a newline.
 */
export function buildToolMarkdown(data: ToolMarkdownData): string {
  const body = buildItemBody({
    name: data.name,
    subtitle: data.itemType,
    source: data.source,
    proseLines: [
      ...(data.ability ? [`- Ability: ${data.ability}`] : []),
      ...data.utilizes.map((value: string) => `- Utilize: ${value}`),
      ...data.crafts.map((value: string) => `- Craft: ${value}`),
    ],
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
      tags: toolTags(data.itemType, data.source),
      exportHash: toolExportHash(body),
    }),
    body,
  )
}
