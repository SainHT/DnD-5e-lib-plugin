/**
 * Pure parsing and normalization helpers for 5etools feat records.
 *
 * No helper in this module performs I/O. The returned structures are consumed
 * by the Markdown builder and are intentionally straightforward to test.
 */
import { sha256 } from './hash'

/** A structured benefit rendered in a feat's body and `vault-feat` fence. */
export interface FeatBenefit {
  /** Stable key used by the feat effects and catalog readers. */
  key: string
  /** Optional human-readable benefit heading. */
  name?: string
  /** Plain or multiline benefit text. */
  text: string
  /** Optional structured effects associated with the benefit. */
  effects?: Record<string, unknown>[]
}

/** Ability-score increase information derived from a feat's `ability` field. */
export interface AbilityIncrease {
  /** Ability abbreviations exposed in the frontmatter `abilities` list. */
  options: string[]
  /** Synthetic benefit describing the increase. */
  benefit: FeatBenefit
}

/** Input accepted by the Markdown builder after helper normalization. */
export interface FeatMarkdownData {
  /** Feat display name. */
  name: string
  /** Full source or edition label. */
  source: string
  /** Normalized feat kind. */
  kind: string
  /** Formatted prerequisite text, or an empty string. */
  prerequisite: string
  /** Benefits to render in the body and fence. */
  benefits: FeatBenefit[]
  /** Optional ability increase metadata. */
  abilityIncrease: AbilityIncrease | null
}

const FEAT_KINDS: Readonly<Record<string, string>> = {
  G: 'general',
  O: 'origin',
  D: 'dragonmark',
  EB: 'epic_boon',
  DG: 'dark_gift',
  FS: 'fighting_style',
}

const SRD_SOURCE = 'SRD 5.2.1'

const ABILITY_NAMES: Readonly<Record<string, string>> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

/**
 * Resolves the canonical source label for a 5etools record.
 *
 * @param record Raw feat record whose edition flags and source are inspected.
 * @returns SRD 5.2.1 for SRD-marked records, otherwise the source or Unknown.
 */
export function sourceForRecord(record: Record<string, unknown>): string {
  return record.srd52 === true || record.basicRules2024 === true ? SRD_SOURCE : stringValue(record.source) ?? 'Unknown'
}

/**
 * Maps a 5etools category abbreviation to the repository's feat kind.
 *
 * @param value Raw category value such as `G`, `O`, or `FS`.
 * @returns Canonical kind text, with a normalized fallback for unknown codes.
 */
export function featKind(value: unknown): string {
  const category = stringValue(value) ?? ''
  return (FEAT_KINDS[category] ?? category.toLowerCase()) || 'general'
}

/**
 * Generates the flat tags used to classify a feat note.
 *
 * @param kind Canonical feat kind.
 * @param source Canonical source or edition label.
 * @returns Ordered tags beginning with the general feat tag.
 */
export function featTags(kind: string, source: string): string[] {
  return ['feat', `feat/${kind.replaceAll(' ', '-')}`, ...(source === SRD_SOURCE ? ['srd-5-2-1'] : [])]
}

/**
 * Converts all prerequisite alternatives into display text.
 *
 * @param value Raw 5etools prerequisite array.
 * @returns Human-readable prerequisite text joined across prerequisite groups.
 */
export function prerequisiteText(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .map(item => {
      if (!item || typeof item !== 'object') return ''
      const entry = item as Record<string, unknown>
      const parts: string[] = []
      if (typeof entry.level === 'number') parts.push(`Level ${entry.level}+`)
      if (Array.isArray(entry.ability)) {
        parts.push(
          entry.ability
            .map(requirement => {
              if (!requirement || typeof requirement !== 'object') return ''
              return Object.entries(requirement as Record<string, unknown>)
                .map(([ability, score]) => `${ABILITY_NAMES[ability] ?? ability} ${score}+`)
                .join(' or ')
            })
            .filter(Boolean)
            .join(', '),
        )
      }
      if (entry.spellcasting === true) parts.push('Spellcasting feature')
      for (const key of ['feature', 'race', 'background', 'proficiency', 'special']) {
        const text = prerequisiteValue(entry[key], key === 'feature')
        if (text) parts.push(text)
      }
      return parts.join(', ')
    })
    .filter(Boolean)
    .join('; ')
}

/**
 * Builds the benefit list, including a synthetic ability-score benefit.
 *
 * @param entries Raw feat entries containing strings, entry groups, or lists.
 * @param abilityIncrease Optional ability increase derived from the record.
 * @returns Ordered benefits suitable for body and fence rendering.
 */
export function benefitsFromEntries(entries: unknown, abilityIncrease: AbilityIncrease | null): FeatBenefit[] {
  const values = Array.isArray(entries) ? entries : []
  const overview: string[] = []
  const benefits: FeatBenefit[] = []
  for (const entry of values) {
    if (typeof entry === 'string') overview.push(entry)
    else if (isEntry(entry)) {
      const text = textFromEntries(entry.entries)
      if (entry.name) benefits.push({ key: slug(entry.name), name: entry.name, text })
      else overview.push(text)
    } else overview.push(textFromEntry(entry))
  }
  if (overview.length > 0) benefits.unshift({ key: 'overview', text: overview.join('\n\n') })
  if (abilityIncrease) benefits.unshift(abilityIncrease.benefit)
  return benefits.length > 0 ? benefits : [{ key: 'overview', text: '' }]
}

/**
 * Converts a 5etools ability field into selectable ability metadata and text.
 *
 * @param value Raw `ability` array from a feat record.
 * @returns Ability options and a synthetic benefit, or null when absent.
 */
export function abilityIncreaseFromRecord(value: unknown): AbilityIncrease | null {
  if (!Array.isArray(value)) return null
  const options: string[] = []
  let amount = 1
  let count = 1
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const entry = item as Record<string, unknown>
    if (entry.choose && typeof entry.choose === 'object') {
      const choose = entry.choose as Record<string, unknown>
      if (Array.isArray(choose.from)) options.push(...choose.from.filter((option): option is string => typeof option === 'string'))
      if (typeof choose.amount === 'number') amount = choose.amount
      if (typeof choose.count === 'number') count = choose.count
      continue
    }
    for (const [ability, rawAmount] of Object.entries(entry)) {
      if (typeof rawAmount !== 'number') continue
      options.push(ability)
      amount = rawAmount
    }
  }
  const uniqueOptions = [...new Set(options)]
  if (uniqueOptions.length === 0) return null
  const names = uniqueOptions.map(option => ABILITY_NAMES[option] ?? option)
  const target = names.length > 1 ? names.join(' or ') : names[0]
  const subject = count > 1 ? `${count} ability scores of your choice` : `${target} score`
  return {
    options: uniqueOptions,
    benefit: {
      key: 'ability_score_increase',
      name: 'Ability Score Increase',
      text: `Increase ${subject} by ${amount}, to a maximum of 20.`,
      effects: [{ type: 'ability_score_choice', options: uniqueOptions, amount, max: 20 }],
    },
  }
}

/**
 * Computes the export hash used to identify generated content.
 *
 * @param body Canonical generated body content.
 * @returns A short SHA-256 export fingerprint with its metadata prefix.
 */
export function exportHash(body: string): string {
  return `sha256-${sha256(body).slice(0, 12)}`
}

/**
 * Converts nested entry arrays to paragraphs or Markdown list items.
 *
 * @param entries Raw nested 5etools entries.
 * @returns Ordered text preserving list structure.
 */
function textFromEntries(entries: unknown): string {
  if (!Array.isArray(entries)) return ''
  return entries.map(textFromEntry).filter(Boolean).join('\n\n')
}

/**
 * Converts one raw entry node into text.
 *
 * @param value Raw string, entries node, or list node.
 * @returns Rendered text, including bullet prefixes for list items.
 */
function textFromEntry(value: unknown): string {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return ''
  const entry = value as Record<string, unknown>
  if (Array.isArray(entry.entries)) return textFromEntries(entry.entries)
  if (entry.type === 'list' && Array.isArray(entry.items)) {
    return entry.items
      .map(item => textFromEntry(item))
      .filter(Boolean)
      .map(item => `- ${item}`)
      .join('\n')
  }
  return ''
}

/**
 * Extracts a prerequisite value, optionally adding the feature suffix.
 *
 * @param value Raw prerequisite value.
 * @param feature Whether this value represents a named feature.
 * @returns Normalized prerequisite value.
 */
function prerequisiteValue(value: unknown, feature: boolean): string {
  if (typeof value === 'string') return feature ? `${value} feature` : value
  if (!Array.isArray(value)) return ''
  const text = value
    .map(item => {
      if (typeof item === 'string') return item
      if (!item || typeof item !== 'object') return ''
      const entry = item as Record<string, unknown>
      return stringValue(entry.name) ?? stringValue(entry.displayName) ?? ''
    })
    .filter(Boolean)
    .join(' or ')
  return feature && text ? `${text} feature` : text
}

/**
 * Serializes one value into a stable benefit key.
 *
 * @param value Benefit heading.
 * @returns Lowercase underscore-separated key.
 */
function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'benefit'
}

/**
 * Returns a non-empty trimmed string or null.
 *
 * @param value Unknown value from a JSON record.
 * @returns Trimmed string, or null for non-string/empty values.
 */
function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/**
 * Checks whether a value is a named or unnamed entries node.
 *
 * @param value Unknown raw entry.
 * @returns True when the value contains an entries array.
 */
function isEntry(value: unknown): value is { name?: string; entries: unknown } {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).entries))
}
