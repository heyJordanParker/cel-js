import { CstNode, IToken } from 'chevrotain'
import { parse } from './lib.js'
import {
  IdentifierDotExpressionCstNode,
  IdentifierExpressionCstNode,
  IndexExpressionCstNode,
} from './cst-definitions.js'

/**
 * The member-access chains an expression reads, derived from its parse tree.
 *
 * A caller that needs to know what an expression touches — to check it against
 * a catalog of available fields, to highlight it, to decide what data to load —
 * gets it from here rather than by re-walking the text as a dotted string. The
 * parse tree is the only thing that knows a name inside a string literal is not
 * a reference, that a comprehension's loop variable is not a root, and where a
 * chain actually ends.
 */

/** One `.key` or `[n]` step of a member-access chain. */
export interface ReferenceSegment {
  /** The accessed property name, or the root name for the first step. */
  key: string
  /** Whether an integer index was applied at this step. */
  indexed: boolean
}

/** A root-anchored member-access chain — what `a.b[0].c` reads. */
export interface ReferencePath {
  segments: ReferenceSegment[]
  /**
   * Whether the chain ends where an operation consumes it: a comprehension
   * macro called on it (`.map`, `.filter`), or a function argument position.
   *
   * A caller checking a chain against a catalog uses this to accept a
   * collection-typed tail. `links.map(...)` operates on the collection, while a
   * bare terminal `links` renders as nothing.
   */
  consumed: boolean
}

function isNode(value: CstNode | IToken): value is CstNode {
  return (value as CstNode).children !== undefined
}

function children(node: CstNode): (CstNode | IToken)[] {
  return Object.values(node.children).flat()
}

/**
 * Every root-anchored member-access chain the expression reads, or null when
 * the expression does not parse.
 */
export function referencePaths(
  expression: string | CstNode,
): ReferencePath[] | null {
  let tree: CstNode
  if (typeof expression === 'string') {
    const result = parse(expression)
    if (!result.isSuccess) return null
    tree = result.cst
  } else {
    tree = expression
  }

  const paths: ReferencePath[] = []
  collect(tree, new Set(), false, paths)
  return paths
}

/**
 * Walk the tree, pushing each reference chain into `paths`.
 *
 * `bound` holds the comprehension loop variables in scope; a chain rooted at
 * one is a loop binding, not a reference. `consumed` is true where this
 * position feeds a function, so a collection is operated on rather than
 * rendered.
 */
function collect(
  node: CstNode,
  bound: Set<string>,
  consumed: boolean,
  paths: ReferencePath[],
): void {
  if (node.name === 'identifierExpression') {
    readChain(node as IdentifierExpressionCstNode, bound, consumed, paths)
    return
  }

  if (node.name === 'macrosExpression') {
    // A function call. Its arguments feed a function, so a collection argument
    // is consumed there.
    walk(node, bound, true, paths)
    return
  }

  if (node.name === 'indexExpression') {
    // An index must be an integer, never a consumed collection.
    walk(node, bound, false, paths)
    return
  }

  walk(node, bound, consumed, paths)
}

function walk(
  node: CstNode,
  bound: Set<string>,
  consumed: boolean,
  paths: ReferencePath[],
): void {
  for (const child of children(node)) {
    if (isNode(child)) collect(child, bound, consumed, paths)
  }
}

/**
 * Read one identifier chain: a root name followed by an ordered run of `.key`
 * and `[n]` steps.
 *
 * The dot steps and the index steps arrive in separate arrays, so they are put
 * back into source order by token offset. A dot step carrying an argument list
 * is a comprehension macro: it ends the chain at the collection it operates on,
 * and its body is walked with the macro's loop variable bound.
 */
function readChain(
  node: IdentifierExpressionCstNode,
  bound: Set<string>,
  consumed: boolean,
  paths: ReferencePath[],
): void {
  const root = node.children.Identifier[0].image
  const dots = node.children.identifierDotExpression ?? []
  const indexes = node.children.identifierIndexExpression ?? []

  const ordered = [...dots, ...indexes].sort(
    (left, right) => stepOffset(left) - stepOffset(right),
  )

  const segments: ReferenceSegment[] = [{ key: root, indexed: false }]
  let consumedTail = consumed

  for (const step of ordered) {
    if (step.name === 'indexExpression') {
      segments[segments.length - 1].indexed = true
      // An index may itself read references, as in `a[b.c]`.
      walk(step, bound, false, paths)
      continue
    }

    if (step.children.OpenParenthesis) {
      walkMacroBody(step, bound, paths)
      consumedTail = true
      break
    }

    segments.push({ key: step.children.Identifier[0].image, indexed: false })
  }

  // A chain rooted at a loop variable belongs to the comprehension, not to the
  // data the expression reads.
  if (!bound.has(root)) {
    paths.push({ segments, consumed: consumedTail })
  }
}

function stepOffset(
  step: IdentifierDotExpressionCstNode | IndexExpressionCstNode,
): number {
  return step.name === 'identifierDotExpression'
    ? step.children.Dot[0].startOffset
    : step.children.OpenBracket[0].startOffset
}

/**
 * Walk a comprehension macro's arguments. The first names the loop variable,
 * which is bound while the rest are walked so references to it are not mistaken
 * for roots.
 */
function walkMacroBody(
  call: IdentifierDotExpressionCstNode,
  bound: Set<string>,
  paths: ReferencePath[],
): void {
  const args = [...(call.children.arg ?? []), ...(call.children.args ?? [])]
  const [variable, ...rest] = args
  const loopVariable = variable ? simpleIdentifier(variable) : null

  const inner = loopVariable ? new Set([...bound, loopVariable]) : bound
  for (const argument of rest) {
    collect(argument, inner, false, paths)
  }
}

/** The bare name an expression node carries, or null if it is anything more. */
function simpleIdentifier(node: CstNode): string | null {
  let current: CstNode | undefined = node

  // Descend the single-child precedence chain down to the identifier.
  while (current && current.name !== 'identifierExpression') {
    const nodes = children(current).filter(isNode)
    if (nodes.length !== 1) return null
    current = nodes[0]
  }

  if (!current) return null

  const identifier = current as IdentifierExpressionCstNode
  if (identifier.children.identifierDotExpression) return null
  if (identifier.children.identifierIndexExpression) return null

  return identifier.children.Identifier[0].image
}
