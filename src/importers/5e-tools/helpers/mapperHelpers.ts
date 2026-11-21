/**
 * Central mapper helpers and normalization utilities shared across all 5etools entity mappers.
 */
import { sha256 } from './hash'

/** Canonical source label for SRD and 2024 basic-rules records. */
export const SRD_SOURCE = 'SRD 5.2.1'

/**
 * Standard ability names mapped from standard 3-letter abbreviations.
 */
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
export function exportHash(body: string): string {
  return `sha256-${sha256(body).slice(0, 12)}`
}

/**
 * Resolves the canonical source label for a 5etools record.
 * Handles `srd52` (boolean or string title), `basicRules2024`, and raw source.
 *
 * @param record Raw 5etools record.
 * @returns `SRD 5.2.1` when marked as SRD or basic rules, otherwise trimmed source or 'Unknown'.
 */
export function sourceForRecord(record: Record<string, unknown>): string {
  if (record.srd52 === true || record.basicRules2024 === true || typeof record.srd52 === 'string') {
    return SRD_SOURCE
  }
  return stringValue(record.source) ?? 'Unknown'
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
