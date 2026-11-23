/**
 * Pure parsing and normalization helpers for 5etools background records.
 *
 * This module deliberately has no Obsidian or vault dependencies. It owns
 * ability extraction, proficiencies parsing, starting equipment normalization,
 * entry filtering (skipping characteristics, contacts, fit-in), markdown table
 * conversion, traits building, and tag generation.
 */
import {
  ABILITY_NAMES,
  exportHash,
  slug,
  stringValue,
  SRD_SOURCE,
} from './mapperHelpers'

/** Re-export exportHash for consistency */
export { exportHash }

/** Structured trait for the vault-background YAML block. */
export interface BackgroundTrait {
  key: string
  name?: string
  text: string
}

/** Normalized background markdown input data. */
export interface BackgroundMarkdownData {
  name: string
  source: string
  edition: string
  originFeat?: string
  abilities: string[]
  skillProficiencies: string[]
  tags: string[]
  aliases: string[]
  overviewText: string
  bodySections: string[]
  traits: BackgroundTrait[]
  abilityOptions?: unknown
  skillProficienciesYaml?: unknown
  toolProficienciesYaml?: unknown
  languageProficienciesYaml?: unknown
  startingEquipmentYaml?: unknown
  additionalSpellsYaml?: unknown
}

const SKIPPED_ENTRY_NAMES = new Set([
  'suggested characteristics',
  'contacts',
  'how do i fit in?',
])

/**
 * Checks whether an entry section should be omitted from the output.
 */
export function isSkippedEntry(name: string): boolean {
  return SKIPPED_ENTRY_NAMES.has(name.trim().toLowerCase())
}

/**
 * Removes 5etools inline tags and resolves readable text.
 */
export function cleanInlineTags(value: string): string {
  let result = value
  result = result.replace(/\{@dc\s+([^}]+)\}/gi, 'DC $1')
  result = result.replace(/\{@chance\s+([^}]+)\}/gi, '$1%')
  result = result.replace(/\{@dice\s+([^}]+)\}/gi, '$1')
  result = result.replace(/\{@b\s+([^}]+)\}/gi, '**$1**')
  result = result.replace(/\{@i\s+([^}]+)\}/gi, '*$1*')
  result = result.replace(/\{@filter\s+([^|}]+)[^}]*\}/gi, '$1')
  result = result.replace(/\{@[^}\s]+\s+([^}]*)\}/gi, (_match, content: string) => {
    const parts = content.split('|').map(p => p.trim()).filter(Boolean)
    if (parts.length === 0) return ''
    if (parts.length >= 3) return parts[parts.length - 1] || parts[0]
    return parts[0]
  })
  return result.replace(/\s+/g, ' ').trim()
}

/**
 * Resolves the edition label for a background record.
 */
export function editionForRecord(record: Record<string, unknown>, source: string): string {
  if (source === SRD_SOURCE) return SRD_SOURCE
  if (record.edition === 'one') return '5.5e'
  return stringValue(record.edition) ?? '5e'
}

/**
 * Extracts normalized lowercase ability keys from a background record.
 */
export function abilitiesFromRecord(record: Record<string, unknown>): string[] {
  const abilities = new Set<string>()
  if (Array.isArray(record.ability)) {
    for (const item of record.ability) {
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>
        if (obj.choose && typeof obj.choose === 'object') {
          const choose = obj.choose as Record<string, unknown>
          if (choose.weighted && typeof choose.weighted === 'object') {
            const weighted = choose.weighted as Record<string, unknown>
            if (Array.isArray(weighted.from)) {
              for (const code of weighted.from) {
                if (typeof code === 'string') abilities.add(code.toLowerCase())
              }
            }
          } else if (Array.isArray(choose.from)) {
            for (const code of choose.from) {
              if (typeof code === 'string') abilities.add(code.toLowerCase())
            }
          }
        }
        for (const [key, val] of Object.entries(obj)) {
          if (key !== 'choose' && typeof val === 'number') {
            abilities.add(key.toLowerCase())
          }
        }
      }
    }
  }
  return [...abilities]
}

/**
 * Formats abilities into a slash-separated string of full names (e.g. "Dexterity/Constitution/Intelligence").
 */
export function formatAbilitiesSubtitle(abilities: string[]): string {
  return abilities
    .map(code => ABILITY_NAMES[code] ?? code.toUpperCase())
    .join('/')
}

/**
 * Extracts origin feat name from record.feats.
 */
export function originFeatFromRecord(record: Record<string, unknown>): string | undefined {
  if (!Array.isArray(record.feats) || record.feats.length === 0) return undefined
  for (const featObj of record.feats) {
    if (featObj && typeof featObj === 'object') {
      const keys = Object.keys(featObj)
      if (keys.length > 0) {
        const key = keys[0]
        const featName = key.split('|')[0].trim()
        if (featName) {
          // Capitalize words
          return featName.replace(/(?:^|\s)\S/g, l => l.toUpperCase())
        }
      }
    }
  }
  return undefined
}

/**
 * Extracts skill proficiencies list from record.skillProficiencies.
 */
export function skillProficienciesFromRecord(record: Record<string, unknown>): string[] {
  const skills = new Set<string>()
  if (Array.isArray(record.skillProficiencies)) {
    for (const entry of record.skillProficiencies) {
      if (entry && typeof entry === 'object') {
        const obj = entry as Record<string, unknown>
        if (obj.choose && typeof obj.choose === 'object') {
          const choose = obj.choose as Record<string, unknown>
          if (Array.isArray(choose.from)) {
            for (const s of choose.from) if (typeof s === 'string') skills.add(s.toLowerCase())
          }
        }
        for (const [key, val] of Object.entries(obj)) {
          if (key !== 'choose' && val === true) {
            skills.add(key.toLowerCase())
          }
        }
      }
    }
  }
  return [...skills]
}

/**
 * Normalizes starting equipment entries for the vault fence.
 */
export function startingEquipmentFromRecord(record: Record<string, unknown>): unknown {
  if (!Array.isArray(record.startingEquipment) || record.startingEquipment.length === 0) {
    return undefined
  }
  return record.startingEquipment
}

/**
 * Converts a 5etools table entry into a Markdown table string.
 */
export function renderTable(table: Record<string, unknown>): string {
  const colLabels = Array.isArray(table.colLabels)
    ? table.colLabels.map(label => cleanInlineTags(String(label)))
    : []
  if (colLabels.length === 0) return ''

  const rows: string[][] = []
  if (Array.isArray(table.rows)) {
    for (const row of table.rows) {
      if (Array.isArray(row)) {
        rows.push(row.map(cell => cleanInlineTags(String(cell))))
      }
    }
  }

  const headerLine = `| ${colLabels.join(' | ')} |`
  const sepLine = `| ${colLabels.map(() => '---').join(' | ')} |`
  const rowLines = rows.map(r => `| ${r.join(' | ')} |`)

  return [headerLine, sepLine, ...rowLines].join('\n')
}

/**
 * Formats entry items or nested entries into readable Markdown lines.
 */
export function renderEntry(entry: unknown, headingLevel = 2): string[] {
  if (typeof entry === 'string') {
    return [cleanInlineTags(entry)]
  }
  if (!entry || typeof entry !== 'object') return []

  const obj = entry as Record<string, unknown>
  const name = stringValue(obj.name)

  if (name && isSkippedEntry(name)) {
    return []
  }

  const lines: string[] = []

  if (obj.type === 'table') {
    if (name) {
      lines.push(`${'#'.repeat(headingLevel)} ${name}`, '')
    }
    const tableMd = renderTable(obj)
    if (tableMd) lines.push(tableMd)
    return lines
  }

  if (obj.type === 'list' && Array.isArray(obj.items)) {
    for (const item of obj.items) {
      if (typeof item === 'string') {
        lines.push(`- ${cleanInlineTags(item)}`)
      } else if (item && typeof item === 'object') {
        const itemObj = item as Record<string, unknown>
        const itemName = stringValue(itemObj.name)
        const itemEntry = stringValue(itemObj.entry) ?? ''
        if (itemName) {
          lines.push(`- **${itemName}** ${cleanInlineTags(itemEntry)}`.trim())
        } else if (itemEntry) {
          lines.push(`- ${cleanInlineTags(itemEntry)}`)
        }
      }
    }
    return lines
  }

  if (name) {
    lines.push(`${'#'.repeat(headingLevel)} ${name}`)
  }

  if (Array.isArray(obj.entries)) {
    for (const sub of obj.entries) {
      const subLines = renderEntry(sub, headingLevel + 1)
      if (subLines.length > 0) {
        lines.push('', ...subLines)
      }
    }
  }

  return lines
}

/**
 * Extracts overview text and extra body sections/traits from record.entries.
 */
export function extractEntriesData(record: Record<string, unknown>): {
  overviewText: string
  bodySections: string[]
  traits: BackgroundTrait[]
} {
  const traits: BackgroundTrait[] = []
  const bodySections: string[] = []
  let overviewText = ''

  if (!Array.isArray(record.entries)) {
    return { overviewText, bodySections, traits }
  }

  let isFirstList = true

  for (const entry of record.entries) {
    if (!entry || typeof entry !== 'object') continue
    const obj = entry as Record<string, unknown>
    const name = stringValue(obj.name)

    if (name && isSkippedEntry(name)) {
      continue
    }

    if (isFirstList && obj.type === 'list') {
      const listLines = renderEntry(obj)
      overviewText = listLines.join('\n')
      traits.push({
        key: 'overview',
        text: overviewText,
      })
      isFirstList = false
      continue
    }

    // Process other sections
    const lines = renderEntry(entry, 2)
    if (lines.length > 0) {
      bodySections.push(lines.join('\n'))
      if (name) {
        const traitKey = slug(name, '_')
        const entryTexts = Array.isArray(obj.entries)
          ? obj.entries
              .filter(e => typeof e === 'string')
              .map(e => cleanInlineTags(String(e)))
              .join('\n\n')
          : ''
        if (entryTexts) {
          traits.push({
            key: traitKey,
            name,
            text: entryTexts,
          })
        }
      }
    }
  }

  return { overviewText, bodySections, traits }
}

/**
 * Generates frontmatter tags for a background.
 */
export function backgroundTags(
  abilities: string[],
  originFeat: string | undefined,
  source: string,
): string[] {
  const tags: string[] = ['background']
  for (const ability of abilities) {
    tags.push(`ability/${ability}`)
  }
  if (originFeat) {
    tags.push(`feat/${slug(originFeat)}`)
  }
  const sourceSlug = slug(source)
  if (sourceSlug) {
    tags.push(sourceSlug)
  }
  return tags
}
