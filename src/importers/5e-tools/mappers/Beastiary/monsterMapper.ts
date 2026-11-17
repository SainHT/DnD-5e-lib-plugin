/**
 * Coordinates conversion of a raw 5etools monster record into a mapped note.
 */
import type { FiveEToolsRecord, MappedNote } from '../../types'
import { buildMonsterMarkdown, type MonsterMarkdownData } from './monsterMarkdownBuilder'
import {
  alignmentName,
  armorClass,
  challengeRating,
  entriesText,
  crToXp,
  gearText,
  hitDice,
  hitPoints,
  initiativeString,
  legendaryDescription,
  mergeSpellcasting,
  monsterType,
  numericRows,
  preprocessMonsterTags as normalizeMonsterTags,
  sizeName,
  slugTag,
  sourceForMonster,
  titleJoin,
  walkSpeed,
  type MonsterEntry,
} from './monsterHelpers'

/**
 * Maps one raw 5etools monster record to a complete vault note.
 *
 * @param record Raw named monster data from a 5etools JSON file.
 * @returns The monster name, entity kind, and generated Markdown.
 */
export function mapMonster(record: FiveEToolsRecord): MappedNote {
  const name = record.name
  const source = sourceForMonster(record)
  const cr = challengeRating(record.cr)
  const xpLair = xpLairFromRecord(record.cr)
  const typeData = monsterType(record.type)
  const traits: MonsterEntry[] = entriesToMonsterEntries(record.trait)
  const actions: MonsterEntry[] = entriesToMonsterEntries(record.action)
  const reactions: MonsterEntry[] = []
  const legendaryActions: MonsterEntry[] = entriesToMonsterEntries(record.legendary)
  const legendary = Array.isArray(record.legendary) && record.legendary.length > 0
  const spellcasting = Array.isArray(record.spellcasting) && record.spellcasting.length > 0
  mergeSpellcasting(record.spellcasting, traits, actions, reactions, legendaryActions)
  const senses = Array.isArray(record.senses)
    ? record.senses.filter((sense): sense is string => typeof sense === 'string').join(', ')
    : typeof record.senses === 'string' ? record.senses : ''
  const languages = Array.isArray(record.languages)
    ? record.languages.filter((language): language is string => typeof language === 'string').join(', ')
    : typeof record.languages === 'string' ? record.languages : ''
  const crTag = `cr${cr.replaceAll('/', '-')}`
  const tags = [
    'monster',
    ...(typeData.type ? [typeData.type] : []),
    ...(typeData.subtype ? [typeData.subtype] : []),
    crTag,
    ...(source === 'SRD 5.2.1' ? ['srd-5-2-1'] : [slugTag(source)].filter(Boolean)),
  ]
  const data: MonsterMarkdownData = {
    name,
    source,
    cr,
    xp: crToXp(record.cr),
    xpLair,
    type: typeData.type,
    subtype: typeData.subtype,
    size: sizeName(record.size),
    ac: armorClass(record.ac),
    hp: hitPoints(record.hp),
    speed: walkSpeed(record.speed),
    hitDice: hitDice(record.hp),
    initiative: initiativeString(record),
    alignment: alignmentName(record.alignment),
    stats: ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(key =>
      typeof record[key] === 'number' ? record[key] as number : 10,
    ),
    saves: numericRows(record.save, true),
    skills: numericRows(record.skill),
    gear: gearText(record.gear),
    resistances: titleJoin(record.resist),
    immunities: titleJoin(record.immune),
    conditionImmunities: titleJoin(record.conditionImmune),
    senses,
    passive: typeof record.passive === 'number' ? record.passive : '',
    languages,
    traits,
    actions,
    reactions,
    legendaryDescription: legendary ? legendaryDescription(record.legendaryActionsLair) : undefined,
    legendaryActions,
    legendary,
    spellcasting,
    tags,
  }
  return { kind: 'monster', name, markdown: buildMonsterMarkdown(data) }
}

/**
 * Converts an array of named 5etools entries into statblock entries.
 *
 * @param value Raw trait, action, reaction, or legendary array.
 * @returns Name and description pairs.
 */
function entriesToMonsterEntries(value: unknown): MonsterEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'))
    .flatMap(entry => {
      if (typeof entry.name !== 'string') return []
      const desc = Array.isArray(entry.entries)
        ? entriesText(entry.entries)
        : typeof entry.desc === 'string'
          ? preprocessMonsterTags(entry.desc)
          : ''
      return [{ name: entry.name, desc }]
    })
}

/**
 * Extracts lair XP from an object-form challenge-rating field.
 *
 * @param cr Raw 5etools CR value.
 * @returns Lair XP or undefined.
 */
function xpLairFromRecord(cr: unknown): number | undefined {
  if (!cr || typeof cr !== 'object') return undefined
  const xp = (cr as Record<string, unknown>).xpLair
  return typeof xp === 'number' ? xp : undefined
}

/**
 * Exposes monster tag preprocessing for callers that need normalized prose.
 *
 * @param value Raw 5etools text.
 * @returns Markdown-safe prose.
 */
export function preprocessMonsterTags(value: string): string {
  return normalizeMonsterTags(value)
}
