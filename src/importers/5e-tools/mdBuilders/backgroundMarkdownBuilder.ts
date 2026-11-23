/**
 * Builds the final Markdown representation of a normalized background.
 *
 * Frontmatter provides properties for Obsidian and vault queries, while detailed
 * traits, choices, proficiencies, and equipment are emitted in the `vault-background`
 * YAML fence.
 */
import { buildFrontmatter, buildHeading, toYaml } from './baseMarkdownBuilder'
import type { BackgroundMarkdownData } from '../helpers/backgroundHelpers'
import { exportHash, formatAbilitiesSubtitle } from '../helpers/backgroundHelpers'

/**
 * Assembles frontmatter, prose body, and the vault-background fence.
 */
export function buildBackgroundMarkdown(data: BackgroundMarkdownData): string {
  const body = buildBody(data)
  return [
    ...buildFrontmatter({
      title: data.name,
      source: data.source,
      edition: data.edition,
      extra: [
        ...(data.originFeat ? [`origin_feat: ${data.originFeat}`] : []),
        ...(data.abilities.length > 0
          ? ['abilities:', ...data.abilities.map(a => `  - ${a}`)]
          : []),
        ...(data.skillProficiencies.length > 0
          ? ['skill_proficiencies:', ...data.skillProficiencies.map(s => `  - ${s}`)]
          : []),
      ],
      tags: data.tags,
      aliases: data.aliases,
      exportHash: exportHash(body),
    }),
    '',
    body,
    '',
  ].join('\n')
}

/**
 * Builds the body heading, subtitle, overview, extra sections, and vault-background fence.
 */
function buildBody(data: BackgroundMarkdownData): string {
  const subtitleKind = data.abilities.length > 0
    ? `${formatAbilitiesSubtitle(data.abilities)}${data.originFeat ? ` · ${data.originFeat}` : ''}`
    : 'Background'

  const sections: string[] = [
    buildHeading(data.name, subtitleKind, data.source),
    '',
  ]

  if (data.overviewText) {
    sections.push(data.overviewText, '')
  }

  for (const extraSection of data.bodySections) {
    sections.push(extraSection, '')
  }

  sections.push('```vault-background')
  sections.push(...buildVaultBackgroundYaml(data))
  sections.push('```')

  return sections.join('\n')
}

/**
 * Builds YAML lines for the vault-background fence.
 */
function buildVaultBackgroundYaml(data: BackgroundMarkdownData): string[] {
  const lines: string[] = []

  // traits
  if (data.traits.length > 0) {
    lines.push('traits:')
    for (const trait of data.traits) {
      lines.push(`  - key: ${trait.key}`)
      if (trait.name) {
        lines.push(`    name: ${trait.name}`)
      }
      lines.push('    text: |-')
      for (const line of trait.text.split('\n')) {
        lines.push(`      ${line}`)
      }
    }
  }

  // ability_options
  if (data.abilityOptions) {
    lines.push('ability_options:')
    lines.push(...toYaml(data.abilityOptions, 2))
  }

  // skill_proficiencies
  if (data.skillProficienciesYaml) {
    lines.push('skill_proficiencies:')
    lines.push(...toYaml(data.skillProficienciesYaml, 2))
  }

  // tool_proficiencies
  if (data.toolProficienciesYaml) {
    lines.push('tool_proficiencies:')
    lines.push(...toYaml(data.toolProficienciesYaml, 2))
  }

  // language_proficiencies
  if (data.languageProficienciesYaml) {
    lines.push('language_proficiencies:')
    lines.push(...toYaml(data.languageProficienciesYaml, 2))
  }

  // starting_equipment
  if (data.startingEquipmentYaml) {
    lines.push('starting_equipment:')
    lines.push(...toYaml(data.startingEquipmentYaml, 2))
  }

  // additional_spells
  if (data.additionalSpellsYaml) {
    lines.push('additional_spells:')
    lines.push(...toYaml(data.additionalSpellsYaml, 2))
  }

  return lines
}

