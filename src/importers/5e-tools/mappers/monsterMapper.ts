import { mappedNote } from '../markdown'
import type { FiveEToolsRecord, MappedNote } from '../types'

export function mapMonster(record: FiveEToolsRecord): MappedNote {
  return mappedNote(record, 'monster')
}
