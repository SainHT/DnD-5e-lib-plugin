/**
 * Shared primitives consumed by every entity Markdown builder.
 */

/**
 * Serializes a string as a YAML-safe scalar.
 * Returns the value unquoted when it is safe alphanumeric+punctuation,
 * otherwise returns a JSON-compatible quoted scalar.
 *
 * @param value String to serialize.
 * @returns Plain scalar or JSON-quoted scalar.
 */
export function yamlScalar(value: string): string {
  if (/^[A-Za-z0-9][A-Za-z0-9 .,'()+/-]*$/.test(value)) return value
  return JSON.stringify(value)
}

/**
 * Strict variant: always produces a JSON-quoted scalar.
 * Used by the monster builder which never emits bare scalars.
 *
 * @param value String to serialize.
 * @returns JSON-compatible quoted scalar.
 */
export function yamlStrict(value: string): string {
  return JSON.stringify(value)
}

/**
 * Serializes arbitrary values (objects, arrays, primitives) into formatted YAML string lines with indentation.
 * Useful for nested structures in custom codeblocks like `vault-background`.
 *
 * @param value Value to serialize.
 * @param indent Indentation spaces.
 * @returns YAML lines.
 */
export function toYaml(value: unknown, indent = 0): string[] {
  const pad = ' '.repeat(indent)
  if (value === null || value === undefined) {
    return []
  }
  if (typeof value === 'string') {
    if (value.includes('\n')) {
      const lines = value.split('\n')
      return [`${pad}|-`, ...lines.map(l => `${pad}  ${l}`)]
    }
    // Quote string if it contains special characters
    if (/[:#\[\]{}*,?|><=@!%`'-]/.test(value) || /^\d+$/.test(value) || value === 'true' || value === 'false') {
      return [`${pad}"${value.replace(/"/g, '\\"')}"`]
    }
    return [`${pad}${value}`]
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return [`${pad}${value}`]
  }
  if (Array.isArray(value)) {
    const lines: string[] = []
    for (const item of value) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const entries = Object.entries(item as Record<string, unknown>)
        if (entries.length === 0) continue
        const [firstKey, firstVal] = entries[0]
        const firstValLines = toYaml(firstVal, indent + 4)
        if (firstValLines.length === 1 && !firstValLines[0].startsWith(' '.repeat(indent + 4) + '|-')) {
          lines.push(`${pad}- ${firstKey}: ${firstValLines[0].trim()}`)
        } else {
          lines.push(`${pad}- ${firstKey}:`)
          lines.push(...firstValLines)
        }
        for (let i = 1; i < entries.length; i++) {
          const [k, v] = entries[i]
          const vLines = toYaml(v, indent + 4)
          if (vLines.length === 1 && !vLines[0].startsWith(' '.repeat(indent + 4) + '|-')) {
            lines.push(`${pad}  ${k}: ${vLines[0].trim()}`)
          } else {
            lines.push(`${pad}  ${k}:`)
            lines.push(...vLines)
          }
        }
      } else {
        const itemLines = toYaml(item, indent + 2)
        if (itemLines.length === 1) {
          lines.push(`${pad}- ${itemLines[0].trim()}`)
        } else {
          lines.push(`${pad}-`, ...itemLines)
        }
      }
    }
    return lines
  }
  if (typeof value === 'object') {
    const lines: string[] = []
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue
      const vLines = toYaml(v, indent + 2)
      if (vLines.length === 1 && !vLines[0].startsWith(' '.repeat(indent + 2) + '|-')) {
        lines.push(`${pad}${k}: ${vLines[0].trim()}`)
      } else {
        lines.push(`${pad}${k}:`)
        lines.push(...vLines)
      }
    }
    return lines
  }
  return []
}

/**
 * Builds the shared YAML frontmatter block common to every entity note.
 *
 * Tags and aliases are always emitted with 2-space indentation (`  - value`).
 *
 * @param options.title      Note title (run through yamlScalar or yamlStrict).
 * @param options.source     Canonical source label (run through yamlScalar or yamlStrict).
 * @param options.edition    Optional canonical edition (defaults to source).
 * @param options.extra      Kind-specific lines inserted after `edition:`.
 * @param options.tags       Tag strings emitted as `  - tag`.
 * @param options.aliases    Alias strings emitted as `  - scalar(alias)`.
 * @param options.exportHash Pre-computed export hash value.
 * @param options.strictYaml Whether to quote scalars strictly with JSON.stringify.
 * @returns Lines from opening `---` to closing `---` (inclusive).
 */
export function buildFrontmatter(options: {
  title: string
  source: string
  edition?: string
  extra?: string[]
  tags: string[]
  aliases: string[]
  exportHash: string
  strictYaml?: boolean
}): string[] {
  const { title, source, edition = source, extra = [], tags, aliases, exportHash, strictYaml = false } = options
  const scalar = strictYaml ? yamlStrict : yamlScalar
  return [
    '---',
    `title: ${scalar(title)}`,
    `source: ${scalar(source)}`,
    `edition: ${scalar(edition)}`,
    ...extra,
    'tags:',
    ...tags.map(tag => `  - ${tag}`),
    'aliases:',
    ...aliases.map(alias => `  - ${scalar(alias)}`),
    `export_hash: ${exportHash}`,
    '---',
  ]
}

/**
 * Renders the standard entity `# Name` heading and `*subtitle | Source: …*` line.
 *
 * @param name     Entity display name.
 * @param subtitle Text between the `*` wrappers (before ` | Source: …`).
 * @param source   Canonical source label.
 * @returns Two heading lines joined by a blank line.
 */
export function buildHeading(name: string, subtitle: string, source: string): string {
  return `# ${name}\n\n*${subtitle} | Source: ${source}*`
}
