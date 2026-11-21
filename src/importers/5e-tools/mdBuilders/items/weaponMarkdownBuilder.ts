/**
 * Builds the Markdown representation of a normalized 5etools weapon.
 */
import { buildItemFrontmatter, buildItemBody, assembleItemNote, yamlScalar } from '../itemMarkdownBuilder'
import { exportHash, weaponTags, type WeaponMarkdownData } from '../../helpers/items/weaponHelpers'

/**
 * Assembles a weapon note with stable frontmatter and structured item metadata.
 *
 * @param data Normalized weapon values.
 * @returns Complete Markdown text ending with a newline.
 */
export function buildWeaponMarkdown(data: WeaponMarkdownData): string {
  const subtitleParts = [data.itemType, data.weaponCategory].filter(Boolean)
  const body = buildItemBody({
    name: data.name,
    subtitle: subtitleParts.join(', '),
    source: data.source,
    vaultItemLines: [
      ...(data.damage ? [`damage: ${yamlScalar(data.damage)}`] : []),
      ...(data.damageType ? [`damage_type: ${yamlScalar(data.damageType)}`] : []),
      ...(data.versatileDamage ? [`versatile_damage: ${yamlScalar(data.versatileDamage)}`] : []),
      ...(data.range ? [`range: ${yamlScalar(data.range)}`] : []),
      ...(data.properties.length ? ['properties:', ...data.properties.map((property: string) => `  - ${yamlScalar(property)}`)] : []),
      ...(data.mastery ? [`mastery: ${yamlScalar(data.mastery)}`] : []),
      ...(data.weight !== null ? [`weight: ${data.weight}`] : []),
      ...(data.groups.length ? ['groups:', ...data.groups.map((group: string) => `  - ${yamlScalar(group)}`)] : []),
    ],
  })

  return assembleItemNote(
    buildItemFrontmatter({
      name: data.name,
      source: data.source,
      itemType: data.itemType,
      prefixExtra: [
        ...(data.weaponCategory ? [`weapon_category: ${yamlScalar(data.weaponCategory)}`] : []),
      ],
      costCp: data.costCp,
      weight: data.weight,
      extra: [
        ...(data.damage ? [`damage: ${yamlScalar(data.damage)}`] : []),
        ...(data.damageType ? [`damage_type: ${yamlScalar(data.damageType)}`] : []),
        ...(data.versatileDamage ? [`versatile_damage: ${yamlScalar(data.versatileDamage)}`] : []),
        ...(data.range ? [`range: ${yamlScalar(data.range)}`] : []),
        ...(data.properties.length ? ['properties:', ...data.properties.map((property: string) => `  - ${yamlScalar(property)}`)] : []),
        ...(data.mastery ? [`mastery: ${yamlScalar(data.mastery)}`] : []),
        ...(data.groups.length ? ['groups:', ...data.groups.map((group: string) => `  - ${yamlScalar(group)}`)] : []),
      ],
      tags: weaponTags(data),
      exportHash: exportHash(body),
    }),
    body,
  )
}
