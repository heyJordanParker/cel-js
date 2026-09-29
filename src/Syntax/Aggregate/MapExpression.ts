import { Span } from '../../Span/Span.js'
import { ExpressionKind } from '../ExpressionKind.js'
import type { Node } from '../Node.js'
import { PunctuatedSequence } from '../PunctuatedSequence.js'
import { MapEntryNode } from './MapEntryNode.js'

export class MapExpression implements Node {
  readonly kind = ExpressionKind.Map

  constructor(
    readonly openingBrace: Span,
    readonly entries: PunctuatedSequence<MapEntryNode>,
    readonly closingBrace: Span,
  ) {}

  getChildren(): Node[] {
    return this.entries.elements
  }

  getSpan(): Span {
    return this.openingBrace.join(this.closingBrace)
  }
}
