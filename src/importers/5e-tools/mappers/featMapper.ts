import { sha256 } from './hash'
import type { FiveEToolsRecord, MappedNote } from '../types'

interface Benefit {
  key: string
  name?: string
  text: string
  effects?: Record<string, unknown>[]
}

const FEAT_KINDS: Readonly<Record<string, string>> = {
  G: 'general',
  O: 'origin',
  D: 'dragonmark',
  EB: 'epic_boon',
  DG: 'dark_gift',
  FS: 'fighting_style',
}
const SRD_SOURCE = 'SRD 5.2.1'
const ABILITY_NAMES: Readonly<Record<string, string>> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

export function mapFeat(record: FiveEToolsRecord): MappedNote {
  const name = record.name
  const source = record.srd52 === true || record.basicRules2024 === true ? SRD_SOURCE : stringValue(record.source) ?? 'Unknown'
  const category = stringValue(record.category) ?? ''
  const kind = (FEAT_KINDS[category] ?? category.toLowerCase()) || 'general'
  const prerequisite = prerequisiteText(record.prerequisite)
  const abilityIncrease = abilityIncreaseFromRecord(record.ability)
  const benefits = benefitsFromEntries(record.entries, abilityIncrease)
  const body = [
    `# ${name}`,
    '',
    `*${kind}${prerequisite ? ` · ${prerequisite}` : ''} | Source: ${source}*`,
    '',
    benefits.map(benefit => `${benefit.name ? `**${benefit.name}.** ` : ''}${benefit.text}`).join('\n\n'),
    '',
    '```vault-feat',
    'benefits:',
    ...benefits.flatMap(benefit => [
      `  - key: ${benefit.key}`,
      ...(benefit.name ? [`    name: ${yamlString(benefit.name)}`] : []),
      `    text: ${yamlString(benefit.text)}`,
      ...(benefit.effects ? ['    effects:', ...benefit.effects.flatMap(effect => effectYaml(effect, 6))] : []),
    ]),
    '```',
  ].join('\n')
  const markdown = [
    '---',
    `title: ${yamlString(name)}`,
    `source: ${yamlString(source)}`,
    `edition: ${yamlString(source)}`,
    `kind: ${yamlString(kind)}`,
    ...(prerequisite ? [`prerequisite: ${yamlString(prerequisite)}`] : []),
    ...(abilityIncrease ? [`abilities:`, ...abilityIncrease.options.map(option => `  - ${option}`)] : []),
    `benefit_count: ${Math.max(1, benefits.filter(benefit => benefit.key !== 'overview').length)}`,
    `modelled_count: ${abilityIncrease ? 1 : 0}`,
    'tags:',
    '  - feat',
    `  - feat/${kind.replaceAll(' ', '-')}`,
    ...(source === SRD_SOURCE ? ['  - srd-5-2-1'] : []),
    'aliases:',
    `  - ${yamlString(name)}`,
    `export_hash: sha256-${sha256(body).slice(0, 12)}`,
    '---',
    '',
    body,
    '',
  ].join('\n')
  return { kind: 'feat', name, markdown }
}

function benefitsFromEntries(entries: unknown, abilityIncrease: AbilityIncrease | null): Benefit[] {
  const values = Array.isArray(entries) ? entries : []
  const overview: string[] = []
  const benefits: Benefit[] = []
  for (const entry of values) {
    if (typeof entry === 'string') overview.push(entry)
    else if (isEntry(entry)) {
      const text = textFromEntries(entry.entries)
      if (entry.name) benefits.push({ key: slug(entry.name), name: entry.name, text })
      else overview.push(text)
    }
  }
  if (overview.length > 0) benefits.unshift({ key: 'overview', text: overview.join('\n\n') })
  if (abilityIncrease) benefits.unshift(abilityIncrease.benefit)
  return benefits.length > 0 ? benefits : [{ key: 'overview', text: '' }]
}

function textFromEntries(entries: unknown): string {
  if (!Array.isArray(entries)) return ''
  return entries
    .map(entry => (typeof entry === 'string' ? entry : isEntry(entry) ? textFromEntries(entry.entries) : ''))
    .filter(Boolean)
    .join('\n\n')
}

function prerequisiteText(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .map(item => {
      if (!item || typeof item !== 'object') return ''
      const entry = item as Record<string, unknown>
      const parts: string[] = []
      if (typeof entry.level === 'number') parts.push(`Level ${entry.level}+`)
      if (Array.isArray(entry.ability)) {
        parts.push(
          entry.ability
            .map(requirement => {
              if (!requirement || typeof requirement !== 'object') return ''
              return Object.entries(requirement as Record<string, unknown>)
                .map(([ability, score]) => `${ABILITY_NAMES[ability] ?? ability} ${score}+`)
                .join(' or ')
            })
            .filter(Boolean)
            .join(', '),
        )
      }

      if (entry.spellcasting === true) parts.push('Spellcasting feature')
      for (const key of ['feature', 'race', 'background', 'proficiency', 'special']) {
        const text = prerequisiteValue(entry[key], key === 'feature')
        if (text) parts.push(text)
      }
      return parts.join(', ')
    })
    .filter(Boolean)
    .join('; ')
}

interface AbilityIncrease {
  options: string[]
  benefit: Benefit
}

function abilityIncreaseFromRecord(value: unknown): AbilityIncrease | null {
  if (!Array.isArray(value)) return null
  const options: string[] = []
  let amount = 1
  let count = 1
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const entry = item as Record<string, unknown>
    if (entry.choose && typeof entry.choose === 'object') {
      const choose = entry.choose as Record<string, unknown>
      if (Array.isArray(choose.from)) options.push(...choose.from.filter((option): option is string => typeof option === 'string'))
      if (typeof choose.amount === 'number') amount = choose.amount
      if (typeof choose.count === 'number') count = choose.count
      continue
    }
    for (const [ability, rawAmount] of Object.entries(entry)) {
      if (typeof rawAmount !== 'number') continue
      options.push(ability)
      amount = rawAmount
    }
  }
  const uniqueOptions = [...new Set(options)]
  if (uniqueOptions.length === 0) return null
  const names = uniqueOptions.map(option => ABILITY_NAMES[option] ?? option)
  const target = names.length > 1 ? names.join(' or ') : names[0]
  const subject = count > 1 ? `${count} ability scores of your choice` : `${target} score`
  const text = `Increase ${subject} by ${amount}, to a maximum of 20.`
  return {
    options: uniqueOptions,
    benefit: {
      key: 'ability_score_increase',
      name: 'Ability Score Increase',
      text,
      effects: [{ type: 'ability_score_choice', options: uniqueOptions, amount, max: 20 }],
    },
  }
}

function prerequisiteValue(value: unknown, feature: boolean): string {
  if (typeof value === 'string') return feature ? `${value} feature` : value
  if (!Array.isArray(value)) return ''
  const text = value
    .map(item => {
      if (typeof item === 'string') return item
      if (!item || typeof item !== 'object') return ''
      const entry = item as Record<string, unknown>
      return stringValue(entry.name) ?? stringValue(entry.displayName) ?? ''
    })
    .filter(Boolean)
    .join(' or ')
  return feature && text ? `${text} feature` : text
}

function effectYaml(effect: Record<string, unknown>, indent: number): string[] {
  const padding = ' '.repeat(indent)
  return [
    `${padding}- type: ${yamlString(String(effect.type))}`,
    ...Object.entries(effect)
      .filter(([key]) => key !== 'type')
      .map(([key, value]) => `${padding}  ${key}: ${Array.isArray(value) ? `[${value.join(', ')}]` : String(value)}`),
  ]
}

function isEntry(value: unknown): value is { name?: string; entries: unknown } {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).entries))
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'benefit'
}

function yamlString(value: string): string {
  return JSON.stringify(value)
}
