import { ValueKind } from './ValueKind.js'

export abstract class Value {
  abstract getRawValue(): unknown

  abstract getKind(): ValueKind

  abstract isZeroValue(): boolean

  abstract isEqual(other: Value): boolean

  abstract isLessThan(other: Value): boolean

  abstract isGreaterThan(other: Value): boolean

  getType(): string {
    return this.getKind()
  }
}
