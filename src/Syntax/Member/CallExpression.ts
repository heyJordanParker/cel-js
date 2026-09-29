import { Span } from '../../Span/Span.js'
import type { Expression } from '../Expression.js'
import { ExpressionKind } from '../ExpressionKind.js'
import type { Node } from '../Node.js'
import { PunctuatedSequence } from '../PunctuatedSequence.js'
import { SelectorNode } from '../SelectorNode.js'

export class CallExpression implements Node {
  readonly kind = ExpressionKind.Call
  readonly function: SelectorNode
  readonly arguments: PunctuatedSequence<Expression>

  constructor(
    readonly target: Expression | null,
    readonly targetSeparator: Span | null,
    callee: SelectorNode,
    readonly openingParenthesis: Span,
    args: PunctuatedSequence<Expression>,
    readonly closingParenthesis: Span,
  ) {
    this.function = callee
    this.arguments = args
  }

  getChildren(): Node[] {
    return this.target === null
      ? [this.function, ...this.arguments.elements]
      : [this.target, this.function, ...this.arguments.elements]
  }

  getSpan(): Span {
    if (this.target !== null) {
      return this.target.getSpan().join(this.closingParenthesis)
    }

    if (this.targetSeparator !== null) {
      return this.targetSeparator.join(this.closingParenthesis)
    }

    return this.function.span.join(this.closingParenthesis)
  }
}
