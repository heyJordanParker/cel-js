import { Span } from '../../Span/Span.js'
import type { Node } from '../Node.js'
import { UnaryOperatorKind } from './UnaryOperatorKind.js'

export class UnaryOperator implements Node {
  constructor(
    readonly kind: UnaryOperatorKind,
    readonly span: Span,
  ) {}

  getChildren(): Node[] {
    return []
  }
}
