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

// Coordinator & file handling
export { FiveEToolsImportCoordinator, isWritableVault, type ImportProgress, type ImportReport } from './importCoordinator'
export { findImportFiles, readImportFiles, IMPORT_CATEGORIES, categoryForFolder, type VaultAdapter } from './fileHandler'

// Entity Importers
export { importFeats, type FeatImportReport, type FeatVault } from './importers/featImporter'
export { importSpells, type SpellImportReport, type SpellVault } from './importers/spellImporter'
export { importMonsters, type MonsterImportReport, type MonsterVault } from './importers/monsterImporter'
export { importItems, type ItemImportReport, type ItemVault } from './importers/itemImporter'
export { type WritableVault } from './importers/entityImporter'

// Mappers & Routing
export { mapFeat } from './mappers/featMapper'
export { mapSpell, preprocessSpellTags } from './mappers/spellMapper'
export { mapMonster, preprocessMonsterTags } from './mappers/monsterMapper'
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
export { mapMagicItem as mapMagicItemRecord } from './mappers/items/magicItemMapper'
export { mapOtherItem } from './mappers/items/otherItemMapper'
export { mapGear, mapAdventuringGear } from './mappers/items/gearMapper'
export { mapWeapon } from './mappers/items/weaponMapper'
export { mapArmorItem, mapArmor, mapArmorOrShield, mapShield } from './mappers/items/armorMapper'

// Helpers actively consumed by unit tests
export { armorAc, armorTypeName, costCopper } from './helpers/items/armorHelpers'
export { cleanGearTags, gearCostCopper, gearEntriesText, gearTypeName } from './helpers/items/gearHelpers'
export { cleanInlineTags as cleanMagicItemInlineTags } from './helpers/items/magicItemHelpers'
export { otherItemCostCopper, otherItemTypeName } from './helpers/items/otherItemHelpers'
export { weaponDamageType, weaponProperties, weaponMastery } from './helpers/items/weaponHelpers'

// Types
export type { FiveEToolsCategory, FiveEToolsRecord, ImportCandidate, ImportFile, MappedNote } from './types'
