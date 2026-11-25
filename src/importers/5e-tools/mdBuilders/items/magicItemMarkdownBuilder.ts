/**
 * Builds Obsidian Markdown for normalized 5etools magic items.
 *
 * The output includes frontmatter, the title/subtitle, description and nested
 * sections, attached-spell tables, item-group variant tables, and vault-item
 * metadata.
 */
import {
  magicItemSpellTable,
  magicItemTags,
  type MagicItemMarkdownData,
} from '../../helpers/items//magicItemHelpers'
import { titleCase } from '../../helpers/mapperHelpers'
import {
  assembleItemNote,
  buildHeading,
  buildItemFrontmatter,
  buildVaultItemYamlFence,
} from '../itemMarkdownBuilder'

/**
 * Assembles a complete magic-item Markdown note.
 *
 * @param data Normalized magic-item values.
 * @returns Complete Markdown text ending with a newline.
 */
export async function buildMagicItemMarkdown(data: MagicItemMarkdownData): Promise<string> {
  const body = buildMagicItemBody(data)
  return assembleItemNote(
    buildItemFrontmatter({
      name: data.name,
      source: data.source,
      itemType: data.itemType,
      weight: data.weight,
      extra: {
        rarity: data.rarity,
        requires_attunement: data.requiresAttunement,
        ...(data.attunementRestriction ? { attunement_restriction: data.attunementRestriction } : {}),
        cursed: data.cursed,
        wondrous: data.wondrous,
        ...(data.charges !== null ? { charges: data.charges } : {}),
        ...(data.recharge ? { recharge: data.recharge } : {}),
        ...(data.rechargeAmount ? { recharge_amount: data.rechargeAmount } : {}),
        ...(data.bonusAc !== null ? { bonus_ac: `+${data.bonusAc}` } : {}),
        ...(data.bonusWeapon ? { bonus_weapon: data.bonusWeapon } : {}),
        ...(data.bonusSavingThrow !== null ? { bonus_saving_throw: `+${data.bonusSavingThrow}` } : {}),
        ...(data.bonusSpellAttack !== null ? { bonus_spell_attack: `+${data.bonusSpellAttack}` } : {}),
        ...(data.summary ? { summary: data.summary } : {}),
        ...(data.variants.length ? { variants: data.variants } : {}),
      },
      tags: magicItemTags(data),
    }),
    body,
  )
}

/**
 * Builds the heading, subtitle, description, charge, spell, and vault metadata.
 *
 * @param data Normalized magic-item values.
 * @returns Markdown body excluding frontmatter.
 */
function buildMagicItemBody(data: MagicItemMarkdownData): string {
  const lines = [buildHeading(data.name, titleCase(data.rarity), data.source)]
  if (data.attunementRestriction) {
    lines.push('', `*Requires attunement ${data.attunementRestriction}*`)
  } else if (data.requiresAttunement) {
    lines.push('', '*Requires attunement*')
  }
  if (data.description) lines.push('', data.description)

  if (data.spellCharges.length) {
    lines.push('', '### Spells', '', magicItemSpellTable(data.spellCharges))
  }

  if (data.variants.length) {
    lines.push('', '### Variants', '', '| Variant |', '| --- |', ...data.variants.map((variant: string) => `| ${variant} |`))
  }

  const vaultData = buildVaultItemData(data)
  const vaultBlock = buildVaultItemYamlFence(vaultData)
  if (vaultBlock.length) {
    lines.push('', ...vaultBlock)
  }
  return lines.join('\n')
}

/**
 * Builds structured `vault-item` fields for charges and combat bonuses.
 *
 * @param data Normalized magic-item values.
 * @returns Ordered vault-item YAML mapping.
 */
function buildVaultItemData(data: MagicItemMarkdownData): Record<string, unknown> {
  return {
    ...(data.weight !== null ? { weight: data.weight } : {}),
    ...(data.charges !== null ? { charges: data.charges } : {}),
    ...(data.recharge ? { recharge: data.recharge } : {}),
    ...(data.rechargeAmount ? { recharge_amount: data.rechargeAmount } : {}),
    ...(data.bonusAc !== null ? { bonus_ac: data.bonusAc } : {}),
    ...(data.bonusWeapon ? { bonus_weapon: data.bonusWeapon } : {}),
    ...(data.bonusSavingThrow !== null ? { bonus_saving_throw: data.bonusSavingThrow } : {}),
    ...(data.bonusSpellAttack !== null ? { bonus_spell_attack: data.bonusSpellAttack } : {}),
    ...(data.requiresAttunement ? { requires_attunement: data.requiresAttunement } : {}),
    ...(data.attunementRestriction ? { attunement_restriction: data.attunementRestriction } : {}),
  }
}


