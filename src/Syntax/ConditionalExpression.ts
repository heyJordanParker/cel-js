import { Span } from '../Span/Span.js'
import type { Expression } from './Expression.js'
import { ExpressionKind } from './ExpressionKind.js'
import type { Node } from './Node.js'

export class ConditionalExpression implements Node {
  readonly kind = ExpressionKind.Conditional
  readonly else: Expression

  constructor(
    readonly condition: Expression,
    readonly question: Span,
    readonly then: Expression,
    readonly colon: Span,
    otherwise: Expression,
  ) {
    this.else = otherwise
  }

  getChildren(): Node[] {
    return [this.condition, this.then, this.else]
  }

  getSpan(): Span {
    return this.condition.getSpan().join(this.else.getSpan())
  }
}
