/**
 * Central mapper helpers and normalization utilities shared across all 5etools entity mappers.
 */
import { bodyHash } from '../../../compendium'

/** Canonical ability names mapped from standard 3-letter abbreviations. */
export const ABILITY_NAMES: Readonly<Record<string, string>> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

/**
 * Computes a deterministic SHA-256 export hash for generated content.
 *
 * @param body Note body to hash.
 * @returns SHA-256 fingerprint prefixed with `sha256-`.
 */
export function exportHash(body: string): Promise<string> {
  return bodyHash(body)
}

/**
 * Resolves the canonical source label for a 5etools record.
 *
 * @param record Raw 5etools record.
 * @returns Trimmed source or `'unknown'`.
 */
export function sourceForRecord(record: Record<string, unknown>): string {
  return stringValue(record.source) ?? 'unknown'
}

/**
 * Returns a trimmed string value, or null if empty or non-string.
 *
 * @param value Candidate unknown value.
 * @returns Trimmed non-empty string or null.
 */
export function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/**
 * Reads the first non-empty string among candidate values.
 *
 * @param candidates Candidate unknown values.
 * @returns First trimmed string, or null.
 */
export function firstString(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return null
}

/**
 * Reads the first finite number among candidate values (including numeric strings).
 *
 * @param candidates Candidate unknown values.
 * @returns First finite number, or null.
 */
export function firstNumber(...candidates: unknown[]): number | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
    if (typeof candidate === 'string' && candidate.trim()) {
      const parsed = Number(candidate.trim())
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

/**
 * Converts a label into a clean lowercase slug.
 * Removes apostrophes and replaces non-alphanumeric characters with the chosen delimiter.
 *
 * @param value Display text.
 * @param delimiter Delimiter character (default `-`).
 * @returns Clean slug string.
 */
export function slug(value: string, delimiter: '-' | '_' = '-'): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, delimiter)
    .replace(new RegExp(`^\\${delimiter}+|\\${delimiter}+$`, 'g'), '')
}

/**
 * Formats a title-cased string while preserving hyphen and slash separation.
 *
 * @param value Raw string.
 * @returns Title-cased text.
 */
export function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map(word => word ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}` : '')
    .join(' ')
}

const LINK_TAG_FOLDERS: Readonly<Record<string, string>> = {
  spell: 'spells',
  condition: 'conditions',
  creature: 'bestiary',
  feat: 'feats',
  variantrule: 'variant-rules',
}

/**
 * Generates a URL and filename safe slug for a note.
 *
 * @param name Note title or record name.
 * @returns Sluggified string safe for vault note filenames.
 */
export function slugForNote(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'unnamed'
  )
}

/**
 * Formats a 5etools reference tag body (`<name>[|<source>[|<display>]]`)
 * as an Obsidian wiki link or plain text for unsupported tags.
 *
 * @param tag Tag name without the `@` prefix (e.g. `spell`, `condition`, `item`).
 * @param content Raw tag body after the tag name.
 * @returns Formatted wiki link or plain-text label.
 */
export function fiveEToolsTagLink(tag: string, content: string): string {
  const segments = content.split('|')
  const baseName = segments[0]?.trim() ?? ''
  if (!baseName) return ''
  const label = segments[2]?.trim() || baseName
  const key = tag.trim().toLowerCase()
  const fileSlug = slugForNote(baseName)
  if (key === 'item') return `[[${fileSlug}|${label}]]`
  const folder = LINK_TAG_FOLDERS[key]
  return folder ? `[[${folder}/${fileSlug}|${label}]]` : label
}

/**
 * Replaces 5etools reference tags (`{@spell ...}`, `{@condition ...}`, etc.)
 * with Obsidian wiki links, keeping the original or display text as the label.
 *
 * @param value Raw 5etools prose.
 * @returns Text with supported reference tags converted to wiki links.
 */
export function replaceFiveEToolsLinks(value: string): string {
  return value.replace(
    /\{@(spell|condition|creature|feat|variantrule|item)\s+([^}]+)\}/gi,
    (_match, tag: string, content: string) => fiveEToolsTagLink(tag, content),
  )
}

/**
 * Formats a full ability name from a 5etools abbreviation.
 *
 * @param value Raw abbreviation (e.g. 'str', 'dex').
 * @returns Full name ('Strength', 'Dexterity') or title-cased fallback.
 */
export function abilityName(value: unknown): string {
  const key = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return ABILITY_NAMES[key] ?? titleCase(key)
}
