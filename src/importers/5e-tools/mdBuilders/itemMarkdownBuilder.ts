/**
 * Shared primitives and abstractions for all item subtype Markdown builders.
 */
import { buildFrontmatter, buildHeading, renderEntityNote, toYaml } from './baseMarkdownBuilder'

export { buildHeading, toYaml }

export interface ItemFrontmatterOptions {
  name: string
  source: string
  itemType: string
  prefixExtra?: Record<string, unknown>
  costCp?: number | null
  weight?: number | null
  extra?: Record<string, unknown>
  tags: string[]
  aliases?: string[]
}

/**
 * Builds frontmatter object for an item note, automatically populating standard
 * item properties (`item_type`, `prefixExtra`, `cost_cp`, `weight`, `extra`, `tags`, `aliases`).
 */
export function buildItemFrontmatter(options: ItemFrontmatterOptions): Record<string, unknown> {
  const commonExtra: Record<string, unknown> = {
    item_type: options.itemType,
    ...options.prefixExtra,
    ...(typeof options.costCp === 'number' ? { cost_cp: options.costCp } : {}),
    ...(typeof options.weight === 'number' ? { weight: options.weight } : {}),
    ...options.extra,
  }

  return buildFrontmatter({
    title: options.name,
    source: options.source,
    extra: commonExtra,
    tags: options.tags,
    aliases: options.aliases ?? [options.name],
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

/**
 * Wraps a structured vault-item object in a ```vault-item YAML fence.
 * Returns an empty array when there are no defined fields.
 */
export function buildVaultItemYamlFence(data: Record<string, unknown>): string[] {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined)
  if (entries.length === 0) return []
  return ['```vault-item', toYaml(Object.fromEntries(entries)).trimEnd(), '```']
}

export interface ItemBodyOptions {
  name: string
  subtitle: string
  source: string
  bodyText?: string
  proseLines?: string[]
  customSections?: string[]
  vaultItemLines?: string[]
  vaultItemData?: Record<string, unknown>
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
  const vaultBlock = options.vaultItemData
    ? buildVaultItemYamlFence(options.vaultItemData)
    : buildVaultItemFence(options.vaultItemLines ?? [])
  if (vaultBlock.length > 0) {
    lines.push('', ...vaultBlock)
  }
  return lines.join('\n')
}

/**
 * Assembles frontmatter object and body string into a complete Markdown note ending in newline.
 */
export function assembleItemNote(frontmatter: Record<string, unknown>, body: string): Promise<string> {
  return renderEntityNote(frontmatter, body)
}
