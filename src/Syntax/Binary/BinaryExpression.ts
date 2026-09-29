import { Span } from '../../Span/Span.js'
import type { Expression } from '../Expression.js'
import { ExpressionKind } from '../ExpressionKind.js'
import type { Node } from '../Node.js'
import { BinaryOperator } from './BinaryOperator.js'

export class BinaryExpression implements Node {
  readonly kind = ExpressionKind.Binary

  constructor(
    readonly left: Expression,
    readonly operator: BinaryOperator,
    readonly right: Expression,
  ) {}

  getChildren(): Node[] {
    return [this.left, this.operator, this.right]
  }

  getSpan(): Span {
    return this.left.getSpan().join(this.right.getSpan())
  }
}
