/**
 * Builds the Markdown representation of a normalized 5etools weapon.
 */
import { buildItemFrontmatter, buildItemBody, assembleItemNote } from '../itemMarkdownBuilder'
import { weaponTags, type WeaponMarkdownData } from '../../helpers/items/weaponHelpers'

/**
 * Assembles a weapon note with stable frontmatter and structured item metadata.
 *
 * @param data Normalized weapon values.
 * @returns Complete Markdown text ending with a newline.
 */
export async function buildWeaponMarkdown(data: WeaponMarkdownData): Promise<string> {
  const subtitleParts = [data.itemType, data.weaponCategory].filter(Boolean)
  const body = buildItemBody({
    name: data.name,
    subtitle: subtitleParts.join(', '),
    source: data.source,
    vaultItemData: {
      ...(data.damage ? { damage: data.damage } : {}),
      ...(data.damageType ? { damage_type: data.damageType } : {}),
      ...(data.versatileDamage ? { versatile_damage: data.versatileDamage } : {}),
      ...(data.range ? { range: data.range } : {}),
      ...(data.properties.length ? { properties: data.properties } : {}),
      ...(data.mastery ? { mastery: data.mastery } : {}),
      ...(data.weight !== null ? { weight: data.weight } : {}),
      ...(data.groups.length ? { groups: data.groups } : {}),
    },
  })

  return assembleItemNote(
    buildItemFrontmatter({
      name: data.name,
      source: data.source,
      itemType: data.itemType,
      prefixExtra: {
        ...(data.weaponCategory ? { weapon_category: data.weaponCategory } : {}),
      },
      costCp: data.costCp,
      weight: data.weight,
      extra: {
        ...(data.damage ? { damage: data.damage } : {}),
        ...(data.damageType ? { damage_type: data.damageType } : {}),
        ...(data.versatileDamage ? { versatile_damage: data.versatileDamage } : {}),
        ...(data.range ? { range: data.range } : {}),
        ...(data.properties.length ? { properties: data.properties } : {}),
        ...(data.mastery ? { mastery: data.mastery } : {}),
        ...(data.groups.length ? { groups: data.groups } : {}),
      },
      tags: weaponTags(data),
    }),
    body,
  )
}
