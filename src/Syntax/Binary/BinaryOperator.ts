import { Span } from '../../Span/Span.js'
import type { Node } from '../Node.js'
import { BinaryOperatorKind } from './BinaryOperatorKind.js'

export class BinaryOperator implements Node {
  constructor(
    readonly kind: BinaryOperatorKind,
    readonly span: Span,
  ) {}

  getChildren(): Node[] {
    return []
  }
}
