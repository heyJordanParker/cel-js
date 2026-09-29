import type {
  BinaryOperatorOverloadHandler,
  BinaryOperatorOverloadInterface,
} from '../../../Operator/BinaryOperatorOverloadInterface.js'
import { BinaryOperatorKind } from '../../../Syntax/Binary/BinaryOperatorKind.js'
import { resolve } from '../../../Util/MapKeyUtil.js'
import { assertRight } from '../../../Util/OperandUtil.js'
import { BooleanValue } from '../../../Value/BooleanValue.js'
import { ListValue } from '../../../Value/ListValue.js'
import { MapValue } from '../../../Value/MapValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

const LIST_MEMBERS = [
  ValueKind.Integer,
  ValueKind.UnsignedInteger,
  ValueKind.Float,
  ValueKind.String,
  ValueKind.Bytes,
  ValueKind.Boolean,
  ValueKind.Null,
  ValueKind.List,
  ValueKind.Map,
  ValueKind.Message,
  ValueKind.Timestamp,
  ValueKind.Duration,
]

const MAP_KEYS = [ValueKind.String, ValueKind.Boolean, ValueKind.Integer, ValueKind.UnsignedInteger, ValueKind.Float]

export class InOperator implements BinaryOperatorOverloadInterface {
  getOperator(): BinaryOperatorKind {
    return BinaryOperatorKind.In
  }

  *getOverloads(): Iterable<[[ValueKind, ValueKind], BinaryOperatorOverloadHandler]> {
    const inList: BinaryOperatorOverloadHandler = (_, left, right) =>
      new BooleanValue(assertRight(right, ListValue).value.some((item) => item.isEqual(left)))

    const inMap: BinaryOperatorOverloadHandler = (_, left, right) => {
      const key = resolve(left)
      return new BooleanValue(key !== null && assertRight(right, MapValue).has(key))
    }

    for (const kind of LIST_MEMBERS) {
      yield [[kind, ValueKind.List], inList]
    }

    for (const kind of MAP_KEYS) {
      yield [[kind, ValueKind.Map], inMap]
    }
  }
}
