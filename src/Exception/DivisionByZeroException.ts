import { Span } from '../Span/Span.js'
import { EvaluationException } from './EvaluationException.js'

export class DivisionByZeroException extends EvaluationException {
  override name = 'DivisionByZeroException'

  constructor(message: string, span: Span = Span.zero(), previous?: unknown) {
    super(message, span, previous)
  }
}
