/**
 * Builds final Markdown for miscellaneous and fallback 5etools items.
 */
import { otherItemExportHash, otherItemTags, type OtherItemMarkdownData } from './otherItemHelpers'

/**
 * Assembles a complete fallback item Markdown note.
 *
 * @param data Normalized fallback item values.
 * @returns Complete Markdown text ending with a newline.
 */
export function buildOtherItemMarkdown(data: OtherItemMarkdownData): string {
  const body = buildOtherItemBody(data)
  return [
    '---',
    `title: ${yamlScalar(data.name)}`,
    `source: ${yamlScalar(data.source)}`,
    `edition: ${yamlScalar(data.source)}`,
    `item_type: ${yamlScalar(data.itemType)}`,
    ...(data.costCp !== null ? [`cost_cp: ${data.costCp}`] : []),
    ...(data.weight !== null ? [`weight: ${data.weight}`] : []),
    ...(data.carryingCapacity ? [`carrying_capacity: ${yamlScalar(data.carryingCapacity)}`] : []),
    ...(data.speed ? [`speed: ${yamlScalar(data.speed)}`] : []),
    'tags:',
    ...otherItemTags(data.itemType, data.source).map(tag => `  - ${tag}`),
    'aliases:',
    `  - ${yamlScalar(data.name)}`,
    `export_hash: ${otherItemExportHash(body)}`,
    '---',
    '',
    body,
    '',
  ].join('\n')
}

/**
 * Builds the fallback item's heading, subtitle, description, and metadata block.
 *
 * @param data Normalized fallback item values.
 * @returns Markdown body excluding frontmatter.
 */
function buildOtherItemBody(data: OtherItemMarkdownData): string {
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
 * Serializes a fallback-item scalar for YAML.
 *
 * @param value Scalar text.
 * @returns Plain scalar text or a JSON-compatible quoted scalar.
 */
function yamlScalar(value: string): string {
  if (/^[A-Za-z0-9][A-Za-z0-9 .,'()+/-]*$/.test(value)) return value
  return JSON.stringify(value)
}
