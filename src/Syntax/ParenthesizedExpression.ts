import { Span } from '../Span/Span.js'
import type { Expression } from './Expression.js'
import { ExpressionKind } from './ExpressionKind.js'
import type { Node } from './Node.js'

export class ParenthesizedExpression implements Node {
  readonly kind = ExpressionKind.Parenthesized

  constructor(
    readonly leftParenthesis: Span,
    readonly expression: Expression,
    readonly rightParenthesis: Span,
  ) {}

  getChildren(): Node[] {
    return [this.expression]
  }

  getSpan(): Span {
    return this.leftParenthesis.join(this.rightParenthesis)
  }
}
