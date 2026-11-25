/**
 * Builds the final Markdown representation of a normalized feat.
 *
 * Frontmatter stays flat for Obsidian properties, while detailed benefits are
 * emitted in the `vault-feat` YAML fence consumed by the feat catalog.
 */
import { buildFrontmatter, buildHeading, renderEntityNote } from './baseMarkdownBuilder'
import type { FeatBenefit, FeatMarkdownData } from '../helpers/featHelpers'
import { featTags } from '../helpers/featHelpers'

/**
 * Assembles frontmatter, prose body, and the structured benefits fence.
 *
 * @param data Normalized feat data supplied by the mapper coordinator.
 * @returns Complete Markdown text ending with a newline.
 */
export async function buildFeatMarkdown(data: FeatMarkdownData): Promise<string> {
  const body = buildBody(data)
  return renderEntityNote(
    buildFrontmatter({
      title: data.name,
      source: data.source,
      extra: {
        kind: data.kind,
        ...(data.prerequisite ? { prerequisite: data.prerequisite } : {}),
        ...(data.abilityIncrease ? { abilities: data.abilityIncrease.options } : {}),
        benefit_count: Math.max(1, data.benefits.filter(benefit => benefit.key !== 'overview').length),
        modelled_count: data.abilityIncrease ? 1 : 0,
      },
      tags: featTags(data.kind, data.source),
      aliases: [data.name],
    }),
    body,
  )
}

/**
 * Builds the body heading, prose benefits, and structured YAML fence.
 *
 * @param data Normalized feat data.
 * @returns Markdown body without the outer frontmatter.
 */
function buildBody(data: FeatMarkdownData): string {
  return [
    buildHeading(data.name, `${data.kind}${data.prerequisite ? ` · ${data.prerequisite}` : ''}`, data.source),
    '',
    data.benefits.map(renderBenefitBody).join('\n\n'),
    '',
    '```vault-feat',
    'benefits:',
    ...data.benefits.flatMap(renderBenefitYaml),
    '```',
  ].join('\n')
}

/**
 * Renders one benefit for the readable Markdown body.
 *
 * @param benefit Structured benefit data.
 * @returns Heading-prefixed or plain benefit text.
 */
function renderBenefitBody(benefit: FeatBenefit): string {
  return `${benefit.name ? `**${benefit.name}.** ` : ''}${benefit.text}`
}

/**
 * Renders one benefit as YAML lines in the vault fence.
 *
 * @param benefit Structured benefit data.
 * @returns Indented YAML lines.
 */
function renderBenefitYaml(benefit: FeatBenefit): string[] {
  return [
    `  - key: ${benefit.key}`,
    ...(benefit.name ? [`    name: ${JSON.stringify(benefit.name)}`] : []),
    `    text: ${JSON.stringify(benefit.text)}`,
    ...(benefit.effects ? ['    effects:', ...benefit.effects.flatMap(effect => renderEffectYaml(effect, 6))] : []),
  ]
}

/**
 * Renders one structured effect as indented YAML.
 *
 * @param effect Effect object associated with a benefit.
 * @param indent Number of spaces for the effect list.
 * @returns YAML lines for the effect.
 */
function renderEffectYaml(effect: Record<string, unknown>, indent: number): string[] {
  const padding = ' '.repeat(indent)
  return [
    `${padding}- type: ${JSON.stringify(String(effect.type))}`,
    ...Object.entries(effect)
      .filter(([key]) => key !== 'type')
      .map(([key, value]) => `${padding}  ${key}: ${Array.isArray(value) ? `[${value.join(', ')}]` : String(value)}`),
  ]
}
