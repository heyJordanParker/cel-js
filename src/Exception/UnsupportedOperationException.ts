import { Span } from '../Span/Span.js'
import type { Value } from '../Value/Value.js'
import { EvaluationException } from './EvaluationException.js'

export class UnsupportedOperationException extends EvaluationException {
  override name = 'UnsupportedOperationException'

  static forComparison(that: Value, other: Value, span: Span = Span.zero()): UnsupportedOperationException {
    return new UnsupportedOperationException(
      `Cannot compare values of type \`${that.getType()}\` and \`${other.getType()}\``,
      span,
    )
  }

  static forNaN(span: Span = Span.zero()): UnsupportedOperationException {
    return new UnsupportedOperationException('NaN values cannot be ordered', span)
  }
}
