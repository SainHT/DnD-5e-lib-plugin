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
} from './mappers/Items/itemMapper'
export { mapOtherItem } from './mappers/Items/Other/otherItemMapper'
export { mapMagicItem as mapMagicItemRecord } from './mappers/Items/MagicItems/magicItemMapper'
export { buildMagicItemMarkdown } from './mappers/Items/MagicItems/magicItemMarkdownBuilder'
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
} from './mappers/Items/MagicItems/magicItemHelpers'
export { buildOtherItemMarkdown } from './mappers/Items/Other/otherItemMarkdownBuilder'
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
} from './mappers/Items/Other/otherItemHelpers'
export { mapGear, mapAdventuringGear } from './mappers/Items/Gear/gearMapper'
export { buildGearMarkdown } from './mappers/Items/Gear/gearMarkdownBuilder'
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
} from './mappers/Items/Gear/gearHelpers'
export { mapWeapon } from './mappers/Items/Weapons/weaponMapper'
export { buildWeaponMarkdown } from './mappers/Items/Weapons/weaponMarkdownBuilder'
export { mapArmorItem, mapArmor, mapArmorOrShield, mapShield } from './mappers/Items/Armor/armorMapper'
export { buildArmorMarkdown } from './mappers/Items/Armor/armorMarkdownBuilder'
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
} from './mappers/Items/Armor/armorHelpers'
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
} from './mappers/Items/Weapons/weaponHelpers'
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
