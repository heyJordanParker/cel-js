import type { BinaryOperatorOverloadHandler } from '../../../Operator/BinaryOperatorOverloadInterface.js'
import { FloatValue } from '../../../Value/FloatValue.js'
import { IntegerValue } from '../../../Value/IntegerValue.js'
import { UnsignedIntegerValue } from '../../../Value/UnsignedIntegerValue.js'
import type { Value } from '../../../Value/Value.js'
import { ValueKind } from '../../../Value/ValueKind.js'

function promote(value: Value): Value {
  return value instanceof IntegerValue || value instanceof UnsignedIntegerValue
    ? new FloatValue(Number(value.value))
    : value
}

export function* overloads(
  float: BinaryOperatorOverloadHandler,
): Iterable<[[ValueKind, ValueKind], BinaryOperatorOverloadHandler]> {
  const handler: BinaryOperatorOverloadHandler = (expression, left, right) =>
    float(expression, promote(left), promote(right))

  yield [[ValueKind.Integer, ValueKind.Float], handler]
  yield [[ValueKind.Float, ValueKind.Integer], handler]
  yield [[ValueKind.UnsignedInteger, ValueKind.Float], handler]
  yield [[ValueKind.Float, ValueKind.UnsignedInteger], handler]
}
