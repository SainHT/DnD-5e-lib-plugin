/**
 * Coordinates conversion of one raw 5etools background record into a mapped note.
 */
import type { FiveEToolsRecord, MappedNote } from '../types'
import { buildBackgroundMarkdown } from '../mdBuilders/backgroundMarkdownBuilder'
import {
  abilitiesFromRecord,
  backgroundTags,
  editionForRecord,
  extractEntriesData,
  originFeatFromRecord,
  skillProficienciesFromRecord,
  startingEquipmentFromRecord,
} from '../helpers/backgroundHelpers'
import { sourceForRecord } from '../helpers/mapperHelpers'

/**
 * Maps a raw 5etools background record to the importer's standard mapped-note shape.
 */
export function mapBackground(record: FiveEToolsRecord): MappedNote {
  const source = sourceForRecord(record)
  const edition = editionForRecord(record, source)
  const originFeat = originFeatFromRecord(record)
  const abilities = abilitiesFromRecord(record)
  const skillProficiencies = skillProficienciesFromRecord(record)
  const { overviewText, bodySections, traits } = extractEntriesData(record)

  const tags = backgroundTags(abilities, originFeat, source)
  const aliases = [record.name]

  const markdown = buildBackgroundMarkdown({
    name: record.name,
    source,
    edition,
    originFeat,
    abilities,
    skillProficiencies,
    tags,
    aliases,
    overviewText,
    bodySections,
    traits,
    abilityOptions: record.ability,
    skillProficienciesYaml: record.skillProficiencies,
    toolProficienciesYaml: record.toolProficiencies,
    languageProficienciesYaml: record.languageProficiencies,
    startingEquipmentYaml: startingEquipmentFromRecord(record),
    additionalSpellsYaml: record.additionalSpells,
  })

  return {
    kind: 'background',
    name: record.name,
    markdown,
  }
}
