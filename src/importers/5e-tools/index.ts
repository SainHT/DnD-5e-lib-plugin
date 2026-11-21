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
export { mapFeat } from './mappers/featMapper'
export { importSpells, type SpellImportReport, type SpellVault } from './importers/spellImporter'
export { importMonsters, type MonsterImportReport, type MonsterVault } from './importers/monsterImporter'
export { importItems, type ItemImportReport, type ItemVault } from './importers/itemImporter'
export {
  mapItem,
  mapMagicItem,
  isMagicItem,
  isExcludedItem,
  isTreasureItem,
  itemKind,
  routeItemCategory,
  routeItemKind,
  shouldExcludeItem,
  type ItemKind,
} from './mappers/itemMapper'
export { mapOtherItem } from './mappers/items/otherItemMapper'
export { mapMagicItem as mapMagicItemRecord } from './mappers/items/magicItemMapper'
export { buildMagicItemMarkdown } from './mdBuilders/items/magicItemMarkdownBuilder'
export {
  cleanInlineTags as cleanMagicItemInlineTags,
  magicItemAttunement,
  magicItemAttunementTags,
  magicItemEntriesMarkdown,
  magicItemExportHash,
  magicItemIsCursed,
  magicItemMetrics,
  magicItemRarity,
  magicItemSpellCharges,
  magicItemSpellTable,
  magicItemSummary,
  magicItemTableMarkdown,
  magicItemTables,
  magicItemTags,
  magicItemTypeName,
  magicItemVariants,
  magicItemWeight,
  normalizeMagicItemTable,
  sourceForMagicItem,
  type MagicItemMarkdownData,
  type MagicItemSpellCharge,
  type MagicItemTable,
  type MagicItemTableRow,
} from './helpers/items/magicItemHelpers'
export { buildOtherItemMarkdown } from './mdBuilders/items/otherItemMarkdownBuilder'
export {
  cleanOtherItemTags,
  otherItemCarryingCapacity,
  otherItemCostCopper,
  otherItemEntriesText,
  otherItemExportHash,
  otherItemSlug,
  otherItemSpeed,
  otherItemTags,
  otherItemTypeName,
  otherItemWeight,
  sourceForOtherItem,
  type OtherItemMarkdownData,
} from './helpers/items/otherItemHelpers'
export { mapGear, mapAdventuringGear } from './mappers/items/gearMapper'
export { buildGearMarkdown } from './mdBuilders/items/gearMarkdownBuilder'
export {
  cleanGearTags,
  gearCostCopper,
  gearEntriesText,
  gearExportHash,
  gearTags,
  gearTypeName,
  gearWeight,
  isConsumableGear,
  sourceForGear,
  type GearMarkdownData,
} from './helpers/items/gearHelpers'
export { mapWeapon } from './mappers/items/weaponMapper'
export { buildWeaponMarkdown } from './mdBuilders/items/weaponMarkdownBuilder'
export { mapArmorItem, mapArmor, mapArmorOrShield, mapShield } from './mappers/items/armorMapper'
export { buildArmorMarkdown } from './mdBuilders/items/armorMarkdownBuilder'
export {
  armorAc,
  armorExportHash,
  armorName,
  armorTags,
  armorTypeName,
  armorWeight,
  costCopper,
  isShield,
  sourceForArmor,
  slug,
  type ArmorMarkdownData,
} from './helpers/items/armorHelpers'
export {
  exportHash as exportWeaponHash,
  sourceForWeapon,
  weaponDamageType,
  weaponGroups,
  weaponMastery,
  weaponProperties,
  weaponRange,
  weaponTypeName,
  weaponTags,
  type WeaponMarkdownData,
} from './helpers/items/weaponHelpers'
export { mapMonster, preprocessMonsterTags } from './mappers/monsterMapper'
export { buildMonsterMarkdown, type MonsterMarkdownData } from './mdBuilders/monsterMarkdownBuilder'
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
} from './helpers/monsterHelpers'
export { mapSpell, preprocessSpellTags } from './mappers/spellMapper'
export { buildSpellMarkdown, type SpellMarkdownData } from './mdBuilders/spellMarkdownBuilder'
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
} from './helpers/spellHelpers'
export { slugForNote, noteMarkdown } from './markdown'
export type { FiveEToolsCategory, FiveEToolsRecord, ImportCandidate, ImportFile, MappedNote } from './types'
