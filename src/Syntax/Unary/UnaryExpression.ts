import { Span } from '../../Span/Span.js'
import type { Expression } from '../Expression.js'
import { ExpressionKind } from '../ExpressionKind.js'
import type { Node } from '../Node.js'
import { UnaryOperator } from './UnaryOperator.js'

export class UnaryExpression implements Node {
  readonly kind = ExpressionKind.Unary

  constructor(
    readonly operator: UnaryOperator,
    readonly operand: Expression,
  ) {}

  getChildren(): Node[] {
    return [this.operator, this.operand]
  }

  getSpan(): Span {
    return this.operator.span.join(this.operand.getSpan())
  }
}
