import type { Type } from './Type.js'

/**
 * Answers the fields of the object types a host declares, the way cel-go's
 * `TypeProvider` answers `FindStructFieldType`.
 */
export interface TypeProvider {
  /**
   * The type of `field` on the object type named `object`, or null when that
   * object declares no such field.
   */
  fieldType(object: string, field: string): Type | null
}
