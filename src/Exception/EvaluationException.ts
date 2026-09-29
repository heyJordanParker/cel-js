import { Span } from '../Span/Span.js'
import { Exception } from './Exception.js'

export class EvaluationException extends Exception {
  override name = 'EvaluationException'

  constructor(
    message: string,
    readonly span: Span,
    previous?: unknown,
  ) {
    super(message, { cause: previous })
  }

  withSpan(span: Span): this {
    const Constructor = this.constructor as new (message: string, span: Span) => this
    return new Constructor(this.message, span)
  }
}
