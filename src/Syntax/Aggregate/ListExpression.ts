import { Span } from '../../Span/Span.js'
import { ExpressionKind } from '../ExpressionKind.js'
import type { Node } from '../Node.js'
import { PunctuatedSequence } from '../PunctuatedSequence.js'
import { ListElementNode } from './ListElementNode.js'

export class ListExpression implements Node {
  readonly kind = ExpressionKind.List

  constructor(
    readonly openingBracket: Span,
    readonly elements: PunctuatedSequence<ListElementNode>,
    readonly closingBracket: Span,
  ) {}

  getChildren(): Node[] {
    return this.elements.elements
  }

  getSpan(): Span {
    return this.openingBracket.join(this.closingBracket)
  }
}
