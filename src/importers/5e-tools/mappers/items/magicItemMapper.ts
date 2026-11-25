/**
 * Coordinates normalization of 5etools magic-item records.
 *
 * The mapper has no vault or Obsidian dependencies and delegates rendering to
 * the magic-item Markdown builder.
 */
import type { FiveEToolsRecord, MappedNote } from '../../types'
import { buildMagicItemMarkdown } from '../../mdBuilders/items/magicItemMarkdownBuilder'
import {
  magicItemAttunement,
  magicItemEntriesMarkdown,
  magicItemIsCursed,
  magicItemMetrics,
  magicItemRarity,
  magicItemSpellCharges,
  magicItemSummary,
  magicItemTables,
  magicItemTypeName,
  magicItemVariants,
  magicItemWeight,
  sourceForMagicItem,
  type MagicItemMarkdownData,
} from '../../helpers/items/magicItemHelpers'

/**
 * Maps one 5etools magic-item record to a mapped magic-item note.
 *
 * @param record Raw named 5etools magic-item record.
 * @returns A mapped magic-item note.
 */
export async function mapMagicItem(record: FiveEToolsRecord): Promise<MappedNote> {
  const attunement = magicItemAttunement(record)
  const metrics = magicItemMetrics(record)
  const data: MagicItemMarkdownData = {
    name: typeof record.name === 'string' ? record.name : 'Unnamed Magic Item',
    source: sourceForMagicItem(record),
    itemType: magicItemTypeName(record),
    rarity: magicItemRarity(record),
    requiresAttunement: attunement.requiresAttunement,
    attunementRestriction: attunement.restriction,
    cursed: magicItemIsCursed(record),
    wondrous: record.wondrous === true,
    weight: magicItemWeight(record),
    summary: magicItemSummary(record),
    charges: metrics.charges,
    recharge: metrics.recharge,
    rechargeAmount: metrics.rechargeAmount,
    bonusAc: metrics.bonusAc,
    bonusWeapon: metrics.bonusWeapon,
    bonusSavingThrow: metrics.bonusSavingThrow,
    bonusSpellAttack: metrics.bonusSpellAttack,
    description: magicItemEntriesMarkdown(record.entries),
    spellCharges: magicItemSpellCharges(record),
    tables: magicItemTables(record.entries),
    variants: magicItemVariants(record),
  }
  return {
    kind: 'magicItem',
    name: data.name,
    markdown: await buildMagicItemMarkdown(data),
  }
}
