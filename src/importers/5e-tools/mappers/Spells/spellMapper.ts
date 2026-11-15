/**
 * Coordinates conversion of a raw 5etools spell record into a mapped note.
 *
 * Record interpretation stays in `spellHelpers`, while Markdown assembly stays
 * in `spellMarkdownBuilder`, making this coordinator useful in isolation.
 */
import type { MappedNote, FiveEToolsRecord } from '../../types'
import { buildSpellMarkdown, type SpellMarkdownData } from './spellMarkdownBuilder'
import {
  classesFromRecord,
  componentsText,
  damageDiceFromEntries,
  damageTypesFromRecord,
  durationText,
  preprocessTags,
  rangeText,
  schoolName,
  sourceForRecord,
  castingTimeText,
  concentrationFromRecord,
  ritualFromRecord,
  textFromEntries,
} from './spellHelpers'

/**
 * Maps one 5etools spell record to the importer's common mapped-note shape.
 *
 * @param record Raw named spell data from a 5etools JSON file.
 * @returns The spell name, entity kind, and complete Markdown note.
 */
export function mapSpell(record: FiveEToolsRecord): MappedNote {
  const name = titleForRecord(record)
  const source = sourceForRecord(record)
  const data: SpellMarkdownData = {
    name,
    alias: record.name,
    source,
    level: numberValue(record.level, 0),
    school: schoolName(record.school),
    castingTime: castingTimeText(record.time),
    range: rangeText(record.range),
    components: componentsText(record.components),
    duration: durationText(record.duration),
    concentration: concentrationFromRecord(record),
    ritual: ritualFromRecord(record),
    damageTypes: damageTypesFromRecord(record.damageInflict),
    damageDice: damageDiceFromEntries(record.entries),
    classes: classesFromRecord(record.classes),
    body: textFromEntries(record.entriesHigherLevel, record.entries),
  }
  const body = buildSpellMarkdown(data)
  return { kind: 'spell', name, markdown: body }
}

/**
 * Selects the SRD display title when a 5etools record supplies one.
 *
 * @param record Raw spell record.
 * @returns The canonical display title.
 */
function titleForRecord(record: FiveEToolsRecord): string {
  return typeof record.srd52 === 'string' && record.srd52.trim() ? record.srd52.trim() : record.name
}

/**
 * Reads a numeric record field and applies a safe fallback.
 *
 * @param value Unknown raw value.
 * @param fallback Value returned when the field is not numeric.
 * @returns A finite numeric value or the fallback.
 */
function numberValue(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/**
 * Exposes tag preprocessing for callers that need to normalize spell prose.
 *
 * @param value Raw 5etools text.
 * @returns Human-readable Markdown text.
 */
export function preprocessSpellTags(value: string): string {
  return preprocessTags(value)
}
