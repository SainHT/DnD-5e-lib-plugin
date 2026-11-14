import { mappedNote } from '../markdown'
import type { FiveEToolsRecord, MappedNote } from '../types'

export function mapItem(record: FiveEToolsRecord): MappedNote {
  return mappedNote(record, 'item')
}
