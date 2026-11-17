import { resolveRuleFolder, type NoteFoldersSettings, type RuleFolderKey } from '../../platform'

/**
 * The 5etools entity kinds currently supported by the importer contract.
 *
 * These map to the plugin's existing rule folders rather than introducing
 * importer-specific destinations.
 */
export type FiveEToolsEntityKind =
  | 'spell'
  | 'monster'
  | 'item'
  | 'magicItem'
  | 'class'
  | 'subclass'
  | 'species'
  | 'background'
  | 'feat'
  | 'condition'
  | 'disease'
  | 'variantRule'

export const FIVEETOOLS_ENTITY_FOLDERS: Readonly<Record<FiveEToolsEntityKind, RuleFolderKey>> = {
  spell: 'spells',
  monster: 'bestiary',
  item: 'items',
  magicItem: 'magic-items',
  class: 'classes',
  subclass: 'subclasses',
  species: 'species',
  background: 'backgrounds',
  feat: 'feats',
  condition: 'conditions',
  disease: 'diseases',
  variantRule: 'variant-rules',
}

/**
 * Resolve the vault destination for a 5etools entity using the plugin's
 * configured Note folders, including per-kind overrides.
 */
export function fiveEToolsFolderFor(kind: FiveEToolsEntityKind, folders: NoteFoldersSettings): string {
  return resolveRuleFolder(FIVEETOOLS_ENTITY_FOLDERS[kind], folders)
}

export { FiveEToolsImportCoordinator, type ImportProgress, type ImportReport } from './importCoordinator'
export { findImportFiles, readImportFiles, IMPORT_CATEGORIES, type VaultAdapter } from './fileHandler'
export { importFeats, type FeatImportReport, type FeatVault } from './importers/featImporter'
export { mapFeat } from './mappers/Feats/featMapper'
export { importSpells, type SpellImportReport, type SpellVault } from './importers/spellImporter'
export { importMonsters, type MonsterImportReport, type MonsterVault } from './importers/monsterImporter'
export { mapMonster, preprocessMonsterTags } from './mappers/Beastiary/monsterMapper'
export { buildMonsterMarkdown, type MonsterMarkdownData } from './mappers/Beastiary/monsterMarkdownBuilder'
export {
  alignmentName,
  armorClass,
  challengeRating,
  crToXp,
  entriesText,
  gearText,
  hitDice,
  hitPoints,
  initiativeString,
  legendaryDescription,
  mergeSpellcasting,
  monsterType,
  numericRows,
  proficiencyBonus,
  sizeName,
  slugTag,
  sourceForMonster,
  titleJoin,
  walkSpeed,
  type MonsterEntry,
} from './mappers/Beastiary/monsterHelpers'
export { mapSpell, preprocessSpellTags } from './mappers/Spells/spellMapper'
export { buildSpellMarkdown, type SpellMarkdownData } from './mappers/Spells/spellMarkdownBuilder'
export {
  castingTimeText,
  cantripDiceFromRecord,
  classesFromRecord,
  componentsText,
  concentrationFromRecord,
  damageDiceFromEntries,
  damageTypesFromRecord,
  durationText,
  exportHash,
  preprocessTags,
  rangeText,
  ritualFromRecord,
  schoolName,
  sourceForRecord,
  textFromEntries,
} from './mappers/Spells/spellHelpers'
export { slugForNote, noteMarkdown } from './markdown'
export type { FiveEToolsCategory, FiveEToolsRecord, ImportCandidate, ImportFile, MappedNote } from './types'
