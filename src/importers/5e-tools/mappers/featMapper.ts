/**
 * Coordinates conversion of one raw 5etools feat record into a mapped note.
 *
 * This module deliberately contains no formatting or parsing details. It
 * delegates record interpretation to `featHelpers` and Markdown assembly to
 * `featMarkdownBuilder`, keeping the public mapper easy to reuse for imports
 * and tests.
 */
import type { FiveEToolsRecord, MappedNote } from '../types'
import { buildFeatMarkdown } from './featMarkdownBuilder'
import {
  abilityIncreaseFromRecord,
  benefitsFromEntries,
  featKind,
  prerequisiteText,
  sourceForRecord,
} from './featHelpers'

/**
 * Maps a raw 5etools feat record to the importer's standard mapped-note shape.
 *
 * @param record Raw named feat data from a 5etools JSON file.
 * @returns The feat name, entity kind, and fully rendered Markdown note.
 */
export function mapFeat(record: FiveEToolsRecord): MappedNote {
  const source = sourceForRecord(record)
  const kind = featKind(record.category)
  const prerequisite = prerequisiteText(record.prerequisite)
  const abilityIncrease = abilityIncreaseFromRecord(record.ability)
  const benefits = benefitsFromEntries(record.entries, abilityIncrease)

  return {
    kind: 'feat',
    name: record.name,
    markdown: buildFeatMarkdown({
      name: record.name,
      source,
      kind,
      prerequisite,
      benefits,
      abilityIncrease,
    }),
  }
}
