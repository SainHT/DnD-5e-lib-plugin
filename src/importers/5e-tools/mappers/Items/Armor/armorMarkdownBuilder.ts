/**
 * Builds final Markdown for normalized 5etools shield and armor records.
 *
 * The output format mirrors the repository's SRD armor notes, including the
 * frontmatter fields and `vault-item` YAML block consumed by the catalog.
 */
import { armorExportHash, armorTags, type ArmorMarkdownData } from './armorHelpers'

/**
 * Assembles a complete armor or shield Markdown note.
 *
 * @param data Normalized armor or shield values.
 * @returns Complete Markdown text ending with a newline.
 */
export function buildArmorMarkdown(data: ArmorMarkdownData): string {
  const body = buildArmorBody(data)
  return [
    '---',
    `title: ${yamlScalar(data.name)}`,
    `source: ${yamlScalar(data.source)}`,
    `edition: ${yamlScalar(data.source)}`,
    `item_type: ${yamlScalar(data.itemType)}`,
    ...(data.costCp !== null ? [`cost_cp: ${data.costCp}`] : []),
    ...(data.weight !== null ? [`weight: ${data.weight}`] : []),
    ...(data.ac !== null ? [`ac: ${data.ac}`] : []),
    'tags:',
    ...armorTags(data.itemType, data.source).map(tag => `  - ${tag}`),
    'aliases:',
    `  - ${yamlScalar(data.name)}`,
    `export_hash: ${armorExportHash(body)}`,
    '---',
    '',
    body,
    '',
  ].join('\n')
}

/**
 * Builds the readable armor heading and structured vault-item block.
 *
 * @param data Normalized armor or shield values.
 * @returns Markdown body excluding frontmatter.
 */
function buildArmorBody(data: ArmorMarkdownData): string {
  return [
    `# ${data.name}`,
    '',
    `*${data.itemType} | Source: ${data.source}*`,
    '',
    '```vault-item',
    ...(data.weight !== null ? [`weight: ${data.weight}`] : []),
    ...(data.ac !== null ? [`ac: ${data.ac}`] : []),
    '```',
  ].join('\n')
}

/**
 * Serializes an armor scalar for YAML.
 *
 * @param value Scalar text.
 * @returns Plain scalar text or a JSON-compatible quoted scalar.
 */
function yamlScalar(value: string): string {
  if (/^[A-Za-z0-9][A-Za-z0-9 .,+()/-]*$/.test(value)) return value
  return JSON.stringify(value)
}
