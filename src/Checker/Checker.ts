import type { Expression } from '../Syntax/Expression.js'
import { CallExpression } from '../Syntax/Member/CallExpression.js'
import { IdentifierExpression } from '../Syntax/Member/IdentifierExpression.js'
import { IndexExpression } from '../Syntax/Member/IndexExpression.js'
import { MemberAccessExpression } from '../Syntax/Member/MemberAccessExpression.js'
import type { Node } from '../Syntax/Node.js'
import { ParenthesizedExpression } from '../Syntax/ParenthesizedExpression.js'
import {
  COMPREHENSIONS,
  literalSegment,
  type Role,
  type Segment,
} from '../Template/Template.js'
import { ExpressionCheck } from './ExpressionCheck.js'
import { Issue, IssueKind } from './Issue.js'
import { Type, TypeKind } from './Type.js'
import type { TypeProvider } from './TypeProvider.js'

/** What a node reads: its type, and its path as written, empty when it reads none. */
type Read = { type: Type; path: string }

/** Each comprehension variable, with its role and the collection it walks. */
type Scope = Map<string, { role: Role; collection: Read }>

const nothing = (): Read => ({ type: Type.dyn(), path: '' })

/**
 * Checks the paths an expression reads against the variables a host declares,
 * the check step of cel-go's `Env.Compile`.
 *
 * Every root must be declared, every field must exist on an object, and every
 * item must be read from a value that holds items. A comprehension's variable
 * reads through the collection it walks, so `offers.map(o, o.price)` checks
 * `price` on an item of `offers`. Calls and operators produce dyn, CEL's
 * gradual typing, so only paths are checked.
 */
export class Checker {
  constructor(private readonly types: TypeProvider) {}

  /** `variables` holds the type of every variable the expression may read. */
  check(
    expression: Expression,
    variables: Record<string, Type>,
  ): ExpressionCheck {
    const issues = new Map<string, Issue>()
    const type = this.reach(expression, variables, new Map(), issues).type

    return new ExpressionCheck([...issues.values()], type)
  }

  private reach(
    node: Node,
    variables: Record<string, Type>,
    scope: Scope,
    issues: Map<string, Issue>,
  ): Read {
    if (node instanceof ParenthesizedExpression) {
      return this.reach(node.expression, variables, scope, issues)
    }

    if (node instanceof IdentifierExpression) {
      const name = node.identifier.name
      const bound = scope.get(name)

      if (bound !== undefined) {
        switch (bound.role) {
          case 'item':
            return this.item(bound.collection, null, issues)
          case 'key':
            return nothing()
          case 'value':
            return bound.collection
        }
      }

      if (Object.hasOwn(variables, name)) {
        return { type: variables[name] as Type, path: name }
      }

      return refuse(
        issues,
        new Issue(IssueKind.UndeclaredReference, name, name),
      )
    }

    if (node instanceof MemberAccessExpression) {
      return this.item(
        this.reach(node.operand, variables, scope, issues),
        node.field.name,
        issues,
      )
    }

    if (node instanceof IndexExpression) {
      const operand = this.reach(node.operand, variables, scope, issues)
      this.reach(node.index, variables, scope, issues)

      return this.item(operand, literalSegment(node.index), issues)
    }

    if (node instanceof CallExpression && node.target !== null) {
      const args = node.arguments.elements
      const roles =
        COMPREHENSIONS.get(node.function.name)?.get(args.length) ?? []
      const bound = args.slice(0, roles.length)

      if (
        roles.length > 0 &&
        bound.every((variable) => variable instanceof IdentifierExpression)
      ) {
        const collection = this.reach(node.target, variables, scope, issues)
        const inner: Scope = new Map(scope)

        bound.forEach((variable, position) => {
          if (variable instanceof IdentifierExpression) {
            inner.set(variable.identifier.name, {
              role: roles[position] ?? 'key',
              collection,
            })
          }
        })

        for (const argument of args.slice(roles.length)) {
          this.reach(argument, variables, inner, issues)
        }

        return node.function.name === 'filter' ? collection : nothing()
      }
    }

    for (const child of node.getChildren()) {
      this.reach(child, variables, scope, issues)
    }

    return nothing()
  }

  /**
   * Reads one field or item. A string is a field, a number is a position, and
   * null is every item, as a computed index or a comprehension reads.
   */
  private item(read: Read, segment: Segment, issues: Map<string, Issue>): Read {
    const type = this.segment(read.type, segment)

    if (type !== null) {
      return { type, path: extend(read.path, segment) }
    }

    return refuse(
      issues,
      segment === null
        ? new Issue(IssueKind.NotIndexable, read.path, '')
        : new Issue(IssueKind.UndefinedField, read.path, String(segment)),
    )
  }

  /** The type one segment reads from a type, or null when the type refuses it. */
  private segment(type: Type, segment: Segment): Type | null {
    switch (type.kind) {
      case TypeKind.Dyn:
        return type
      case TypeKind.Map:
        return type.element
      case TypeKind.List:
        return typeof segment === 'string' ? null : type.element
      case TypeKind.Object:
        return segment === null
          ? null
          : this.types.fieldType(type.name, String(segment))
      case TypeKind.Scalar:
        return null
      case TypeKind.Union:
        return this.unionSegment(type.members, segment)
    }
  }

  private unionSegment(members: Type[], segment: Segment): Type | null {
    const admitted = members
      .map((member) => this.segment(member, segment))
      .filter((read) => read !== null)
    const [first, ...rest] = admitted

    return first === undefined ? null : Type.union([first, ...rest])
  }
}

function extend(path: string, segment: Segment): string {
  if (path === '' || segment === null) {
    return path
  }

  return typeof segment === 'number'
    ? `${path}[${segment}]`
    : `${path}.${segment}`
}

/** Records an issue once, and answers dyn so the rest of the read checks nothing more. */
function refuse(issues: Map<string, Issue>, issue: Issue): Read {
  issues.set(`${issue.kind}\0${issue.path}\0${issue.name}`, issue)

  return nothing()
}
