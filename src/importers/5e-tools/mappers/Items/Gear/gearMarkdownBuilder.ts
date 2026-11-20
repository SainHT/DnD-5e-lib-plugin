/**
 * Builds final Markdown for normalized 5etools gear and food/drink records.
 *
 * Frontmatter mirrors SRD gear notes. The vault-item fence is emitted only
 * when the item has persistent physical metadata such as weight.
 */
import { gearExportHash, gearTags, type GearMarkdownData } from './gearHelpers'

/**
 * Assembles a complete gear or food/drink Markdown note.
 *
 * @param data Normalized gear values.
 * @returns Complete Markdown text ending with a newline.
 */
export function buildGearMarkdown(data: GearMarkdownData): string {
  const body = buildGearBody(data)
  return [
    '---',
    `title: ${yamlScalar(data.name)}`,
    `source: ${yamlScalar(data.source)}`,
    `edition: ${yamlScalar(data.source)}`,
    `item_type: ${yamlScalar(data.itemType)}`,
    ...(data.costCp !== null ? [`cost_cp: ${data.costCp}`] : []),
    ...(data.weight !== null ? [`weight: ${data.weight}`] : []),
    'tags:',
    ...gearTags(data.itemType, data.source).map(tag => `  - ${tag}`),
    'aliases:',
    `  - ${yamlScalar(data.name)}`,
    `export_hash: ${gearExportHash(body)}`,
    '---',
    '',
    body,
    '',
  ].join('\n')
}

/**
 * Builds the readable gear heading, description, and conditional vault fence.
 *
 * @param data Normalized gear values.
 * @returns Markdown body excluding frontmatter.
 */
function buildGearBody(data: GearMarkdownData): string {
  const lines = [
    `# ${data.name}`,
    '',
    `*${data.itemType} | Source: ${data.source}*`,
  ]
  if (data.bodyText) lines.push('', data.bodyText)
  if (data.weight !== null) {
    lines.push('', '```vault-item', `weight: ${data.weight}`, '```')
  }
  return lines.join('\n')
}

/**
 * Serializes a gear scalar for YAML.
 *
 * @param value Scalar text.
 * @returns Plain scalar text or a JSON-compatible quoted scalar.
 */
function yamlScalar(value: string): string {
  if (/^[A-Za-z0-9][A-Za-z0-9 .,'()+/-]*$/.test(value)) return value
  return JSON.stringify(value)
}
