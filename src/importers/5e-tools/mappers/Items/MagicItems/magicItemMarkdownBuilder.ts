/**
 * Builds Obsidian Markdown for normalized 5etools magic items.
 *
 * The output includes frontmatter, the title/subtitle, description and nested
 * sections, attached-spell tables, item-group variant tables, and vault-item
 * metadata.
 */
import {
  magicItemExportHash,
  magicItemSpellTable,
  magicItemTags,
  type MagicItemMarkdownData,
} from './magicItemHelpers'

/**
 * Assembles a complete magic-item Markdown note.
 *
 * @param data Normalized magic-item values.
 * @returns Complete Markdown text ending with a newline.
 */
export function buildMagicItemMarkdown(data: MagicItemMarkdownData): string {
  const body = buildMagicItemBody(data)
  return [
    '---',
    `title: ${yamlScalar(data.name)}`,
    `source: ${yamlScalar(data.source)}`,
    `edition: ${yamlScalar(data.source)}`,
    `item_type: ${yamlScalar(data.itemType)}`,
    `rarity: ${yamlScalar(data.rarity)}`,
    `requires_attunement: ${data.requiresAttunement}`,
    ...(data.attunementRestriction ? [`attunement_restriction: ${yamlScalar(data.attunementRestriction)}`] : []),
    `cursed: ${data.cursed}`,
    `wondrous: ${data.wondrous}`,
    ...(data.weight !== null ? [`weight: ${data.weight}`] : []),
    ...(data.charges !== null ? [`charges: ${data.charges}`] : []),
    ...(data.recharge ? [`recharge: ${yamlScalar(data.recharge)}`] : []),
    ...(data.rechargeAmount ? [`recharge_amount: "${yamlScalar(data.rechargeAmount)}"`] : []),
    ...(data.bonusAc !== null ? [`bonus_ac: "+${data.bonusAc}"`] : []),
    ...(data.bonusWeapon ? [`bonus_weapon: "${yamlScalar(data.bonusWeapon)}"`] : []),
    ...(data.bonusSavingThrow !== null ? [`bonus_saving_throw: "+${data.bonusSavingThrow}"`] : []),
    ...(data.bonusSpellAttack !== null ? [`bonus_spell_attack: "+${data.bonusSpellAttack}"`] : []),
    ...(data.summary ? [`summary: ${yamlScalar(data.summary)}`] : []),
    ...(data.variants.length ? ['variants:', ...data.variants.map(variant => `  - ${yamlScalar(variant)}`)] : []),
    'tags:',
    ...magicItemTags(data).map(tag => `  - ${tag}`),
    'aliases:',
    `  - ${yamlScalar(data.name)}`,
    `export_hash: ${magicItemExportHash(body)}`,
    '---',
    '',
    body,
    '',
  ].join('\n')
}

/**
 * Builds the heading, subtitle, description, charge, spell, and vault metadata.
 *
 * @param data Normalized magic-item values.
 * @returns Markdown body excluding frontmatter.
 */
function buildMagicItemBody(data: MagicItemMarkdownData): string {
  const lines = [
    `# ${data.name}`,
    '',
    `*${titleCase(data.rarity)} | Source: ${data.source}*`,
  ]
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
    lines.push('', '### Variants', '', '| Variant |', '| --- |', ...data.variants.map(variant => `| ${variant} |`))
  }

  const vaultLines = buildVaultItemLines(data)
  if (vaultLines.length) {
    lines.push('', '```vault-item', ...vaultLines, '```')
  }
  return lines.join('\n')
}

/**
 * Builds structured `vault-item` fields for charges and combat bonuses.
 *
 * @param data Normalized magic-item values.
 * @returns Ordered vault-item YAML lines.
 */
function buildVaultItemLines(data: MagicItemMarkdownData): string[] {
  const lines: string[] = []
  if (data.weight !== null) lines.push(`weight: ${data.weight}`)
  if (data.charges !== null) lines.push(`charges: ${data.charges}`)
  if (data.recharge) lines.push(`recharge: ${yamlScalar(data.recharge)}`)
  if (data.rechargeAmount) lines.push(`recharge_amount: ${yamlScalar(data.rechargeAmount)}`)
  if (data.bonusAc !== null) lines.push(`bonus_ac: ${data.bonusAc}`)
  if (data.bonusWeapon) lines.push(`bonus_weapon: ${yamlScalar(data.bonusWeapon)}`)
  if (data.bonusSavingThrow !== null) lines.push(`bonus_saving_throw: ${data.bonusSavingThrow}`)
  if (data.bonusSpellAttack !== null) lines.push(`bonus_spell_attack: ${data.bonusSpellAttack}`)
  if (data.requiresAttunement) lines.push(`requires_attunement: ${data.requiresAttunement}`)
  if (data.attunementRestriction) lines.push(`attunement_restriction: ${yamlScalar(data.attunementRestriction)}`)
  return lines
}

/**
 * Serializes a scalar for YAML frontmatter and vault metadata.
 *
 * @param value Scalar text.
 * @returns A plain scalar or JSON-compatible quoted scalar.
 */
function yamlScalar(value: string): string {
  if (/^[+-]?\d+(?:\.\d+)?$/.test(value)) return value
  if (/^[A-Za-z0-9][A-Za-z0-9 .,'()+/-]*$/.test(value)) return value
  return JSON.stringify(value)
}

/**
 * Applies title case to rarity labels and short text.
 *
 * @param value Raw label.
 * @returns Title-cased text.
 */
function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map(word => word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : '')
    .join(' ')
}
