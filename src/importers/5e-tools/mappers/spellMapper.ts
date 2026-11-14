import { mappedNote } from '../markdown'
import type { FiveEToolsRecord, MappedNote } from '../types'

export function mapSpell(record: FiveEToolsRecord): MappedNote {
  return mappedNote(record, 'spell')
}
