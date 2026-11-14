import type { FiveEToolsEntityKind } from './index'

export type FiveEToolsCategory = 'spells' | 'bestiary' | 'items'

export interface FiveEToolsRecord {
  name: string
  source?: string
  [key: string]: unknown
}

export interface ImportCandidate {
  path: string
  category: FiveEToolsCategory
}

export interface ImportFile {
  path: string
  category: FiveEToolsCategory
  records: FiveEToolsRecord[]
}

export interface MappedNote {
  kind: FiveEToolsEntityKind
  name: string
  markdown: string
}
