/**
 * Builds final Markdown for normalized 5etools tools and instruments.
 *
 * The frontmatter mirrors SRD item notes and the body contains readable
 * Ability, Utilize, and Craft statements plus a `vault-item` weight block.
 */
import { toolExportHash, toolTags, type ToolMarkdownData } from './toolHelpers'

/**
 * Assembles a complete tool or instrument Markdown note.
 *
 * @param data Normalized tool values.
 * @returns Complete Markdown text ending with a newline.
 */
export function buildToolMarkdown(data: ToolMarkdownData): string {
  const body = buildToolBody(data)
  return [
    '---',
    `title: ${yamlScalar(data.name)}`,
    `source: ${yamlScalar(data.source)}`,
    `edition: ${yamlScalar(data.source)}`,
    `item_type: ${yamlScalar(data.itemType)}`,
    ...(data.costCp !== null ? [`cost_cp: ${data.costCp}`] : []),
    ...(data.weight !== null ? [`weight: ${data.weight}`] : []),
    'tags:',
    ...toolTags(data.itemType, data.source).map(tag => `  - ${tag}`),
    'aliases:',
    `  - ${yamlScalar(data.name)}`,
    `export_hash: ${toolExportHash(body)}`,
    '---',
    '',
    body,
    '',
  ].join('\n')
}

/**
 * Builds the readable heading, metadata list, and vault-item fence.
 *
 * @param data Normalized tool values.
 * @returns Markdown body excluding frontmatter.
 */
function buildToolBody(data: ToolMarkdownData): string {
  return [
    `# ${data.name}`,
    '',
    `*${data.itemType} | Source: ${data.source}*`,
    '',
    ...(data.ability ? [`- Ability: ${data.ability}`] : []),
    ...data.utilizes.map(value => `- Utilize: ${value}`),
    ...data.crafts.map(value => `- Craft: ${value}`),
    '',
    '```vault-item',
    ...(data.weight !== null ? [`weight: ${data.weight}`] : []),
    '```',
  ].join('\n')
}

/**
 * Serializes a tool scalar for YAML.
 *
 * @param value Scalar text.
 * @returns Plain scalar text or a JSON-compatible quoted scalar.
 */
function yamlScalar(value: string): string {
  if (/^[A-Za-z0-9][A-Za-z0-9 .,'()+/-]*$/.test(value)) return value
  return JSON.stringify(value)
}
