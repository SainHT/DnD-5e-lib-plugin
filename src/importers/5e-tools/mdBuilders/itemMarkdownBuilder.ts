/**
 * Shared primitives and abstractions for all item subtype Markdown builders.
 */
import { yamlScalar, buildFrontmatter, buildHeading } from './baseMarkdownBuilder'

export { yamlScalar, buildHeading }

export interface ItemFrontmatterOptions {
  name: string
  source: string
  itemType: string
  prefixExtra?: string[]
  costCp?: number | null
  weight?: number | null
  extra?: string[]
  tags: string[]
  aliases?: string[]
  exportHash: string
  strictYaml?: boolean
}

/**
 * Builds frontmatter lines for an item note, automatically populating standard
 * item properties (item_type, prefixExtra, cost_cp, weight, extra, tags, aliases).
 */
export function buildItemFrontmatter(options: ItemFrontmatterOptions): string[] {
  const commonExtra: string[] = [
    `item_type: ${yamlScalar(options.itemType)}`,
    ...(options.prefixExtra ?? []),
    ...(typeof options.costCp === 'number' ? [`cost_cp: ${options.costCp}`] : []),
    ...(typeof options.weight === 'number' ? [`weight: ${options.weight}`] : []),
    ...(options.extra ?? []),
  ]

  return buildFrontmatter({
    title: options.name,
    source: options.source,
    extra: commonExtra,
    tags: options.tags,
    aliases: options.aliases ?? [options.name],
    exportHash: options.exportHash,
    strictYaml: options.strictYaml,
  })
}

/**
 * Wraps vault-item metadata lines in the ```vault-item fence.
 * Returns an empty array if lines are empty.
 */
export function buildVaultItemFence(lines: string[]): string[] {
  if (lines.length === 0) return []
  return ['```vault-item', ...lines, '```']
}

export interface ItemBodyOptions {
  name: string
  subtitle: string
  source: string
  bodyText?: string
  proseLines?: string[]
  customSections?: string[]
  vaultItemLines?: string[]
}

/**
 * Assembles a standard item body:
 * 1. # Title
 * 2. *Subtitle | Source: ...*
 * 3. Optional prose lines or bodyText
 * 4. Optional customSections
 * 5. Optional ```vault-item fence
 */
export function buildItemBody(options: ItemBodyOptions): string {
  const lines = [buildHeading(options.name, options.subtitle, options.source)]
  if (options.proseLines && options.proseLines.length > 0) {
    lines.push('', ...options.proseLines)
  }
  if (options.bodyText) {
    lines.push('', options.bodyText)
  }
  if (options.customSections && options.customSections.length > 0) {
    lines.push('', ...options.customSections)
  }
  const vaultBlock = buildVaultItemFence(options.vaultItemLines ?? [])
  if (vaultBlock.length > 0) {
    lines.push('', ...vaultBlock)
  }
  return lines.join('\n')
}

/**
 * Assembles frontmatter lines and body string into a complete Markdown note ending in newline.
 */
export function assembleItemNote(frontmatter: string[], body: string): string {
  return `${frontmatter.join('\n')}\n\n${body}\n`
}
