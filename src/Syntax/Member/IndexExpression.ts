import { Span } from '../../Span/Span.js'
import type { Expression } from '../Expression.js'
import { ExpressionKind } from '../ExpressionKind.js'
import type { Node } from '../Node.js'

export class IndexExpression implements Node {
  readonly kind = ExpressionKind.Index

  constructor(
    readonly operand: Expression,
    readonly openingBracket: Span,
    readonly question: Span | null,
    readonly index: Expression,
    readonly closingBracket: Span,
  ) {}

  isOptional(): boolean {
    return this.question !== null
  }

  getChildren(): Node[] {
    return [this.operand, this.index]
  }

  getSpan(): Span {
    return this.operand.getSpan().join(this.closingBracket)
  }
}
