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
 * Builds the shared YAML frontmatter block common to every entity note.
 *
 * Tags and aliases are always emitted with 2-space indentation (`  - value`).
 *
 * @param options.title      Note title (run through yamlScalar or yamlStrict).
 * @param options.source     Canonical source label (run through yamlScalar or yamlStrict).
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
  extra?: string[]
  tags: string[]
  aliases: string[]
  exportHash: string
  strictYaml?: boolean
}): string[] {
  const { title, source, extra = [], tags, aliases, exportHash, strictYaml = false } = options
  const scalar = strictYaml ? yamlStrict : yamlScalar
  return [
    '---',
    `title: ${scalar(title)}`,
    `source: ${scalar(source)}`,
    `edition: ${scalar(source)}`,
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
