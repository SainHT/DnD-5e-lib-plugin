/**
 * Pure parsing and normalization helpers for 5etools tool and instrument records.
 *
 * This module has no Obsidian or vault dependencies so nested-entry parsing,
 * inline-tag cleanup, currency conversion, and tag generation remain deterministic.
 */
import { sha256 } from '../../hash'

const SRD_SOURCE = 'SRD 5.2.1'

/** Structured tool details extracted from nested 5etools entries. */
export interface ToolDetails {
  /** Ability associated with the tool. */
  ability: string
  /** Use statements available to the tool. */
  utilizes: string[]
  /** Craft statements or item names. */
  crafts: string[]
}

/** Normalized values consumed by the tool Markdown builder. */
export interface ToolMarkdownData {
  /** Canonical tool name. */
  name: string
  /** Canonical source label. */
  source: string
  /** Human-readable tool category. */
  itemType: string
  /** Cost in copper pieces. */
  costCp: number | null
  /** Weight in pounds. */
  weight: number | null
  /** Associated ability. */
  ability: string
  /** Utilize statements. */
  utilizes: string[]
  /** Craft statements. */
  crafts: string[]
}

/**
 * Converts a 5etools tool type code into a readable item type.
 *
 * @param value Raw `type` field.
 * @returns A canonical tool, instrument, or gaming-set label.
 */
export function toolTypeName(value: unknown): string {
  const code = typeof value === 'string' ? value.split('|', 1)[0]?.trim().toUpperCase() ?? '' : ''
  if (code === 'AT') return "Artisan's Tools"
  if (code === 'GS') return 'Gaming Set'
  if (code === 'INS') return 'Musical Instrument'
  if (code === 'TK' || code === 'T') return 'Tools'
  return 'Tools'
}

/**
 * Resolves a stable display source label for a tool record.
 *
 * @param record Raw 5etools tool record.
 * @returns `SRD 5.2.1` for SRD/basic-rule records, otherwise its source label.
 */
export function sourceForTool(record: Record<string, unknown>): string {
  if (record.srd52 === true || record.basicRules2024 === true) return SRD_SOURCE
  return stringValue(record.source) ?? 'Unknown'
}

/**
 * Converts a 5etools value or currency field into copper pieces.
 *
 * @param record Raw 5etools tool record.
 * @returns Cost in copper pieces or `null` when unavailable.
 */
export function toolCostCopper(record: Record<string, unknown>): number | null {
  const value = record.value
  if (typeof value === 'number' && Number.isFinite(value)) {
    const unit = firstString(record.valueUnit, record.currency, record.costUnit)?.toLowerCase()
    return unit === 'gp' || unit === 'gold' ? value * 100 : value
  }
  if (typeof value === 'string') {
    const match = value.trim().match(/^([\d,.]+)\s*(gp|cp|sp)?$/i)
    if (!match) return null
    const amount = Number(match[1].replace(/,/g, ''))
    if (!Number.isFinite(amount)) return null
    const unit = (match[2] ?? 'cp').toLowerCase()
    if (unit === 'gp') return amount * 100
    if (unit === 'sp') return amount * 10
    return amount
  }
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>
    const amount = firstNumber(object.amount, object.value)
    if (amount === null) return null
    const unit = firstString(object.unit, object.currency)?.toLowerCase()
    if (unit === 'gp' || unit === 'gold') return amount * 100
    if (unit === 'sp' || unit === 'silver') return amount * 10
    return amount
  }
  const gp = firstNumber(record.valueGp, record.gp)
  return gp === null ? null : gp * 100
}

/**
 * Reads tool weight in pounds.
 *
 * @param record Raw 5etools tool record.
 * @returns Numeric weight or `null`.
 */
export function toolWeight(record: Record<string, unknown>): number | null {
  return firstNumber(record.weight)
}

/**
 * Recursively parses Ability, Utilize, and Craft statements from nested entries.
 *
 * @param entries Raw `entries` field from a 5etools tool record.
 * @returns Normalized tool details.
 */
export function parseToolEntries(entries: unknown): ToolDetails {
  const result: ToolDetails = { ability: '', utilizes: [], crafts: [] }
  visitEntries(entries, result)
  return result
}

/**
 * Recursively visits nested tool entries and extracts labeled statements.
 *
 * @param value Unknown nested entry value.
 * @param output Mutable normalized output.
 * @returns No return value.
 */
function visitEntries(value: unknown, output: ToolDetails): void {
  if (Array.isArray(value)) {
    for (const entry of value) visitEntries(entry, output)
    return
  }
  if (typeof value === 'string') {
    addInlineStatement(value, output)
    return
  }
  if (!value || typeof value !== 'object') return
  const entry = value as Record<string, unknown>
  const label = stringValue(entry.name)?.replace(/:$/, '').trim() ?? ''
  if (label) addLabeledEntry(label, entry.entries, output)
  else if (typeof entry.entry === 'string') addInlineStatement(entry.entry, output)
  if (Array.isArray(entry.entries) && !label) {
    for (const child of entry.entries) visitEntries(child, output)
  }
}

/**
 * Adds a labeled named entry to normalized tool details.
 *
 * @param label Entry label such as `Ability`, `Utilize`, or `Craft`.
 * @param entries Nested entry content.
 * @param output Mutable normalized output.
 * @returns No return value.
 */
function addLabeledEntry(label: string, entries: unknown, output: ToolDetails): void {
  const clean = cleanInlineTags(flattenEntryText(entries)).replace(/^:\s*/, '').trim()
  if (!clean) return
  const normalizedLabel = label.toLowerCase()
  if (normalizedLabel === 'ability') output.ability = clean
  else if (normalizedLabel === 'utilize' || normalizedLabel === 'utilizes') output.utilizes.push(clean)
  else if (normalizedLabel === 'craft' || normalizedLabel === 'crafts') output.crafts.push(clean)
}

/**
 * Extracts label/text pairs from plain tool statements.
 *
 * @param text Raw statement text.
 * @param output Mutable normalized output.
 * @returns No return value.
 */
function addInlineStatement(text: string, output: ToolDetails): void {
  const clean = cleanInlineTags(text).trim()
  const match = clean.match(/^(Ability|Utilize|Utilizes|Craft|Crafts)\s*:?\s*(.*)$/i)
  if (!match || !match[2].trim()) return
  const label = match[1].toLowerCase()
  const value = match[2].trim()
  if (label === 'ability') output.ability = value
  else if (label === 'utilize' || label === 'utilizes') output.utilizes.push(value)
  else output.crafts.push(value)
}

/**
 * Flattens nested entries into one readable text string.
 *
 * @param value Raw nested entry value.
 * @returns Clean plain text.
 */
function flattenEntryText(value: unknown): string {
  if (typeof value === 'string') return cleanInlineTags(value)
  if (Array.isArray(value)) return value.map(flattenEntryText).filter(Boolean).join(' ')
  if (!value || typeof value !== 'object') return ''
  const entry = value as Record<string, unknown>
  if (typeof entry.entry === 'string') return cleanInlineTags(entry.entry)
  if (Array.isArray(entry.entries)) return flattenEntryText(entry.entries)
  return ''
}

/**
 * Removes 5etools inline tags and preserves readable display text.
 *
 * @param value Raw 5etools text.
 * @returns Plain readable text.
 */
export function cleanInlineTags(value: string): string {
  return value
    .replace(/\{@dc\s+([^}]+)\}/gi, 'DC $1')
    .replace(/\{@(?:item|spell|condition|creature|skill|variantrule)\s+([^}|]+)(?:\|[^}|]*)*\|?([^}]*)\}/gi,
      (_match, name: string, display: string) => display?.trim() || name.trim())
    .replace(/\{@[^|\s}]+\s+([^}|]+)(?:\|[^}]*)?\}/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Builds stable tags for one tool or instrument.
 *
 * @param itemType Human-readable item type.
 * @param source Canonical source label.
 * @returns Ordered frontmatter tags.
 */
export function toolTags(itemType: string, source: string): string[] {
  const tagSlug = itemType === "Artisan's Tools"
    ? 'artisans-tools'
    : itemType === 'Gaming Set'
      ? 'gaming-set'
      : itemType === 'Musical Instrument'
        ? 'musical-instrument'
        : slug(itemType)
  const tags = ['item', `item/${tagSlug}`]
  if (source === SRD_SOURCE) tags.push('srd-5-2-1')
  return tags
}

/**
 * Computes a stable export fingerprint for a tool body.
 *
 * @param body Markdown body excluding frontmatter.
 * @returns SHA-256 fingerprint prefixed with `sha256-`.
 */
export function toolExportHash(body: string): string {
  return `sha256-${sha256(body).slice(0, 12)}`
}

/**
 * Converts a display label into a lowercase hyphenated slug.
 *
 * @param value Human-readable label.
 * @returns Lowercase URL-safe tag segment.
 */
export function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Reads a trimmed string field.
 *
 * @param value Unknown field value.
 * @returns Trimmed string or `null`.
 */
function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/**
 * Reads the first finite numeric candidate.
 *
 * @param candidates Candidate unknown values.
 * @returns First finite number or `null`.
 */
function firstNumber(...candidates: unknown[]): number | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  }
  return null
}

/**
 * Reads the first non-empty string candidate.
 *
 * @param candidates Candidate unknown values.
 * @returns First trimmed string or `null`.
 */
function firstString(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return null
}
