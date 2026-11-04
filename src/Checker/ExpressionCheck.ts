import type { Issue } from './Issue.js'
import type { Type } from './Type.js'

/**
 * What one check found: the reads it refused, and the type the expression
 * produces. An expression with no issues is valid against its declarations.
 */
export class ExpressionCheck {
  constructor(
    readonly issues: Issue[],
    readonly type: Type,
  ) {}
}
