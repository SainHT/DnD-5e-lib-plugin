import type { FiveEToolsRecord, MappedNote } from './types'

export function noteMarkdown(record: FiveEToolsRecord, title: string): string {
  const source = typeof record.source === 'string' ? record.source : null
  const frontmatter = [`---`, `name: ${yamlString(title)}`, source ? `source: ${yamlString(source)}` : null, `---`]
    .filter((line): line is string => line !== null)
    .join('\n')
  const fields = Object.entries(record)
    .filter(([key]) => key !== 'name' && key !== 'source')
    .map(([key, value]) => `## ${key}\n\n${renderValue(value)}`)
    .join('\n\n')
  return `${frontmatter}\n\n# ${title}${fields ? `\n\n${fields}` : ''}\n`
}

export function slugForNote(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unnamed'
}

function renderValue(value: unknown): string {
  if (typeof value === 'string') return value
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``
}

function yamlString(value: string): string {
  return JSON.stringify(value)
}

export function mappedNote(record: FiveEToolsRecord, kind: MappedNote['kind']): MappedNote {
  return { kind, name: record.name, markdown: noteMarkdown(record, record.name) }
}
