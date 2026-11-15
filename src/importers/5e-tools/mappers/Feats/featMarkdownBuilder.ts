/**
 * Builds the final Markdown representation of a normalized feat.
 *
 * Frontmatter stays flat for Obsidian properties, while detailed benefits are
 * emitted in the `vault-feat` YAML fence consumed by the feat catalog.
 */
import type { FeatBenefit, FeatMarkdownData } from './featHelpers'
import { exportHash, featTags } from './featHelpers'

/**
 * Assembles frontmatter, prose body, and the structured benefits fence.
 *
 * @param data Normalized feat data supplied by the mapper coordinator.
 * @returns Complete Markdown text ending with a newline.
 */
export function buildFeatMarkdown(data: FeatMarkdownData): string {
  const body = buildBody(data)
  return [
    '---',
    `title: ${yamlString(data.name)}`,
    `source: ${yamlString(data.source)}`,
    `edition: ${yamlString(data.source)}`,
    `kind: ${yamlString(data.kind)}`,
    ...(data.prerequisite ? [`prerequisite: ${yamlString(data.prerequisite)}`] : []),
    ...(data.abilityIncrease ? ['abilities:', ...data.abilityIncrease.options.map(option => `  - ${option}`)] : []),
    `benefit_count: ${Math.max(1, data.benefits.filter(benefit => benefit.key !== 'overview').length)}`,
    `modelled_count: ${data.abilityIncrease ? 1 : 0}`,
    'tags:',
    ...featTags(data.kind, data.source).map(tag => `  - ${tag}`),
    'aliases:',
    `  - ${yamlString(data.name)}`,
    `export_hash: ${exportHash(body)}`,
    '---',
    '',
    body,
    '',
  ].join('\n')
}

/**
 * Builds the body heading, prose benefits, and structured YAML fence.
 *
 * @param data Normalized feat data.
 * @returns Markdown body without the outer frontmatter.
 */
function buildBody(data: FeatMarkdownData): string {
  return [
    `# ${data.name}`,
    '',
    `*${data.kind}${data.prerequisite ? ` · ${data.prerequisite}` : ''} | Source: ${data.source}*`,
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
    ...(benefit.name ? [`    name: ${yamlString(benefit.name)}`] : []),
    `    text: ${yamlString(benefit.text)}`,
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
    `${padding}- type: ${yamlString(String(effect.type))}`,
    ...Object.entries(effect)
      .filter(([key]) => key !== 'type')
      .map(([key, value]) => `${padding}  ${key}: ${Array.isArray(value) ? `[${value.join(', ')}]` : String(value)}`),
  ]
}

/**
 * Serializes a string as a YAML-safe JSON-style scalar.
 *
 * @param value String to serialize.
 * @returns Quoted scalar text.
 */
function yamlString(value: string): string {
  return JSON.stringify(value)
}

