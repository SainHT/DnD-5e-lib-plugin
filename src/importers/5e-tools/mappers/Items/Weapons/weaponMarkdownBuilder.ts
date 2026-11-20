/**
 * Builds the Markdown representation of a normalized 5etools weapon.
 *
 * The frontmatter and `vault-item` fence intentionally mirror the repository's
 * SRD item format so the existing item catalog can parse the result.
 */
import { exportHash, weaponTags, type WeaponMarkdownData } from './weaponHelpers'

/**
 * Assembles a weapon note with stable frontmatter and structured item metadata.
 *
 * @param data Normalized weapon values.
 * @returns Complete Markdown text ending with a newline.
 */
export function buildWeaponMarkdown(data: WeaponMarkdownData): string {
  const body = buildBody(data)
  return [
    '---',
    `title: ${yamlScalar(data.name)}`,
    `source: ${yamlScalar(data.source)}`,
    `edition: ${yamlScalar(data.source)}`,
    `item_type: ${yamlScalar(data.itemType)}`,
    ...(data.weaponCategory ? [`weapon_category: ${yamlScalar(data.weaponCategory)}`] : []),
    ...(data.costCp !== null ? [`cost_cp: ${data.costCp}`] : []),
    ...(data.weight !== null ? [`weight: ${data.weight}`] : []),
    ...(data.damage ? [`damage: ${yamlScalar(data.damage)}`] : []),
    ...(data.damageType ? [`damage_type: ${yamlScalar(data.damageType)}`] : []),
    ...(data.versatileDamage ? [`versatile_damage: ${yamlScalar(data.versatileDamage)}`] : []),
    ...(data.range ? [`range: ${yamlScalar(data.range)}`] : []),
    ...(data.properties.length ? ['properties:', ...data.properties.map(property => `  - ${yamlScalar(property)}`)] : []),
    ...(data.mastery ? [`mastery: ${yamlScalar(data.mastery)}`] : []),
    ...(data.groups.length ? ['groups:', ...data.groups.map(group => `  - ${yamlScalar(group)}`)] : []),
    'tags:',
    ...weaponTags(data).map(tag => `  - ${tag}`),
    'aliases:',
    `  - ${yamlScalar(data.name)}`,
    `export_hash: ${exportHash(body)}`,
    '---',
    '',
    body,
    '',
  ].join('\n')
}

/**
 * Builds the readable heading, subtitle, and `vault-item` YAML fence.
 *
 * @param data Normalized weapon values.
 * @returns Markdown body excluding frontmatter.
 */
function buildBody(data: WeaponMarkdownData): string {
  const subtitleParts = [data.itemType, data.weaponCategory].filter(Boolean)
  return [
    `# ${data.name}`,
    '',
    `*${subtitleParts.join(', ')} | Source: ${data.source}*`,
    '',
    '```vault-item',
    ...(data.damage ? [`damage: ${yamlScalar(data.damage)}`] : []),
    ...(data.damageType ? [`damage_type: ${yamlScalar(data.damageType)}`] : []),
    ...(data.versatileDamage ? [`versatile_damage: ${yamlScalar(data.versatileDamage)}`] : []),
    ...(data.range ? [`range: ${yamlScalar(data.range)}`] : []),
    ...(data.properties.length ? ['properties:', ...data.properties.map(property => `  - ${yamlScalar(property)}`)] : []),
    ...(data.mastery ? [`mastery: ${yamlScalar(data.mastery)}`] : []),
    ...(data.weight !== null ? [`weight: ${data.weight}`] : []),
    ...(data.groups.length ? ['groups:', ...data.groups.map(group => `  - ${yamlScalar(group)}`)] : []),
    '```',
  ].join('\n')
}

/**
 * Serializes a weapon scalar for YAML.
 *
 * @param value Scalar text.
 * @returns A plain scalar or JSON-compatible quoted scalar.
 */
function yamlScalar(value: string): string {
  if (/^[A-Za-z0-9][A-Za-z0-9 .,+()/-]*$/.test(value)) return value
  return JSON.stringify(value)
}
