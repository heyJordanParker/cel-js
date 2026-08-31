import { CstNode, IToken } from 'chevrotain'
import { evaluate, parse } from './lib.js'

/**
 * Expressions written inside ordinary text: `Hello {{ customer.firstName }}`.
 *
 * A value that is one whole binding evaluates to that binding's value, keeping
 * its type; a binding surrounded by text renders into the text. Arrays are
 * walked, so a whole document of authored values can be handed in at once.
 *
 * Two openers reach the same expression language:
 *
 * - `{{ expression }}` — the binding an author closes. `{{{ }}}` is the same
 *   binding, marked by its author as carrying intent the host treats
 *   differently on output; the expression inside is identical either way and
 *   the language never sees the difference.
 * - `@root.field[0]` — a bare chain, off unless a host turns it on. `{{ }}` is
 *   the template form every consumer wants; the chain is an authoring
 *   affordance, so it is opt-in rather than grammar everyone inherits.
 *
 * A backslash before an opening `{{` is the one escape: `\{{` renders a literal
 * `{{`, which lets an author write a bare moustache without opening a binding.
 *
 * What happens when a binding fails is the caller's policy, not this layer's: a
 * host rendering a page usually wants an unresolvable binding to come out empty
 * rather than to fail the page, while a host validating one wants to hear about
 * it. Pass `onFailure` to decide; by default a failed binding resolves to null.
 */

/** A chain of a root name plus `.field` and `[n]` steps, opened by `@`. */
const AT_CHAIN =
  '(?<![A-Za-z0-9_])@([A-Za-z_][A-Za-z0-9_]*(?:\\.[A-Za-z_][A-Za-z0-9_]*|\\[\\d+\\])*)'

/** The escape that makes an opening `{{` literal. */
export const ESCAPED_OPEN = '\\{{'

const WHOLE_INERT = /^\s*\{\{\s*((?:(?!\}\})[\s\S])*?)\s*\}\}\s*$/
const WHOLE_EXECUTABLE = /^\s*\{\{\{\s*((?:(?!\}\}\})[\s\S])*?)\s*\}\}\}\s*$/
const WHOLE_CHAIN = new RegExp(`^\\s*${AT_CHAIN}\\s*$`)
const BINDINGS =
  /(?<!\\)(?:\{\{\{\s*([\s\S]*?)\s*\}\}\}|\{\{\s*([\s\S]*?)\s*\}\})/g
const SPANS = new RegExp(
  `\\\\\\{\\{|\\{\\{\\{\\s*([\\s\\S]*?)\\s*\\}\\}\\}|\\{\\{\\s*([\\s\\S]*?)\\s*\\}\\}|${AT_CHAIN}`,
  'g',
)

/**
 * Called for each piece of a rendered string: literal text with null, an
 * evaluated binding with whether its author marked it executable. A host uses
 * it to treat the two differently on output.
 */
export type Fragment = (value: unknown, executable: boolean | null) => unknown

export interface TemplateOptions {
  /** Whether `@root.field` also opens a binding. Off by default. */
  enableChains?: boolean
  /** Functions available to every binding, beyond the built-in ones. */
  functions?: Record<string, CallableFunction>
  /** Given the expression and the failure, returns the value to use. */
  onFailure?: (expression: string, error: unknown) => unknown
}

export class Template {
  private readonly enableChains: boolean
  private readonly functions?: Record<string, CallableFunction>
  private readonly onFailure?: (expression: string, error: unknown) => unknown

  constructor(options: TemplateOptions = {}) {
    this.enableChains = options.enableChains ?? false
    this.functions = options.functions
    this.onFailure = options.onFailure
  }

  /**
   * Wraps a stored expression body in a binding.
   *
   * A body is stored bare, because the surface an author types it into asks for
   * a rule rather than for a binding, so every evaluation site has to put it
   * back. A body carrying `}}` would close the binding early and evaluate
   * something other than what its author wrote.
   */
  static binding(body: string): string {
    if (body.includes('}}')) {
      throw new Error(`An expression body cannot contain \`}}\`: ${body}`)
    }

    return `{{ ${body} }}`
  }

  /**
   * The bare body of a value that is one whole binding. A value that
   * interpolates has no single body to store, so it is refused.
   */
  static body(value: string): string {
    const match = WHOLE_INERT.exec(value)
    if (match === null) {
      throw new Error('Only a whole binding has an expression body.')
    }

    return match[1]
  }

  /** Makes every opening `{{` literal while preserving the rendered text. */
  static escape(value: string): string {
    return value.split('{{').join(ESCAPED_OPEN)
  }

  /**
   * The variable names the bindings in a value read — `order` for
   * `{{ order.total }}`, `cart` for `{{ money(cart.total) }}`.
   *
   * The names come from each binding's parse tree: a name used as a value is a
   * variable, while a field name and a function name are not. A binding that
   * does not parse contributes nothing, because an expression that cannot run
   * reads no variable. A comprehension's loop variable is a name like any other
   * here; it resolves to nothing when supplied, so naming it costs nothing,
   * where missing a real variable would blank the binding.
   */
  roots(value: unknown): string[] {
    if (Array.isArray(value)) {
      const roots = new Set<string>()
      for (const item of value) {
        for (const root of this.roots(item)) roots.add(root)
      }
      return [...roots]
    }

    if (typeof value !== 'string') return []

    const roots = new Set<string>()
    for (const expression of this.expressions(value)) {
      for (const identifier of identifiers(expression)) roots.add(identifier)
    }

    return [...roots]
  }

  /**
   * Whether the value holds a binding at all. When `values` is given, a chain
   * counts only where its root is one of them, because an unresolvable chain
   * stays literal text.
   */
  containsBinding(
    value: string,
    values?: Record<string, unknown> | null,
  ): boolean {
    if (/(?<!\\)\{\{/.test(value)) return true
    if (!this.enableChains) return false

    const chains = [...value.matchAll(new RegExp(AT_CHAIN, 'g'))]
    if (chains.length === 0) return false

    return chains.some(
      (chain) => values == null || isBoundRoot(chain[1], values),
    )
  }

  /** Whether the value holds a `{{{ }}}` binding. */
  static containsExecutableBinding(value: string): boolean {
    return /(?<!\\)\{\{\{/.test(value)
  }

  /**
   * Whether the value holds a `{{ }}` binding once every `{{{ }}}` span is
   * removed.
   */
  containsInertBinding(
    value: string,
    values?: Record<string, unknown> | null,
  ): boolean {
    return this.containsBinding(
      value.replace(/(?<!\\)\{\{\{\s*[\s\S]*?\s*\}\}\}/g, ''),
      values,
    )
  }

  /**
   * Whether the value is one binding and nothing else, so its evaluated value
   * keeps its type instead of rendering into text.
   */
  isWholeBinding(value: string, values: Record<string, unknown>): boolean {
    return (
      WHOLE_EXECUTABLE.test(value) ||
      WHOLE_INERT.test(value) ||
      this.wholeChain(value, values) !== null
    )
  }

  /** Whether every binding in the value is a syntactically valid expression. */
  isValid(value: unknown): boolean {
    if (Array.isArray(value)) return value.every((item) => this.isValid(item))
    if (typeof value !== 'string' || !value.includes('{{')) return true

    // An escaped `\{{` is a literal, so it neither opens a binding nor counts
    // as a stray unescaped one.
    const unescaped = value.split(ESCAPED_OPEN).join('')

    const bindings = [...unescaped.matchAll(BINDINGS)]
    let remaining = unescaped
    for (const binding of bindings)
      remaining = remaining.replace(binding[0], '')

    // An opener with no closer is not a binding and never will be.
    if (remaining.includes('{{')) return false

    return bindings.every((binding) => {
      const expression = (binding[1] ?? binding[2] ?? '').trim()
      return expression !== '' && parse(expression).isSuccess
    })
  }

  /**
   * Renders every binding in the value against the variables.
   *
   * A value that is one whole binding returns that binding's evaluated value
   * with its type intact. Anything else renders to a string. Arrays are walked.
   */
  render(
    value: unknown,
    values: Record<string, unknown>,
    fragment?: Fragment,
  ): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.render(item, values, fragment))
    }

    const opens =
      typeof value === 'string' &&
      (value.includes('{{') || (this.enableChains && value.includes('@')))

    if (!opens) {
      return fragment === undefined ? value : fragment(value, null)
    }

    const executable = WHOLE_EXECUTABLE.exec(value)
    if (executable !== null) {
      const result = this.evaluateBinding(executable[1], values)
      return fragment === undefined ? result : fragment(result, true)
    }

    const inert = WHOLE_INERT.exec(value)
    if (inert !== null) {
      const result = this.evaluateBinding(inert[1], values)
      return fragment === undefined ? result : fragment(result, false)
    }

    const chain = this.wholeChain(value, values)
    if (chain !== null) {
      const result = this.evaluateBinding(chain, values)
      return fragment === undefined ? result : fragment(result, false)
    }

    return this.renderText(value, values, fragment)
  }

  private renderText(
    value: string,
    values: Record<string, unknown>,
    fragment?: Fragment,
  ): string {
    let rendered = ''
    let offset = 0

    for (const match of value.matchAll(SPANS)) {
      const start = match.index
      const literal = value.slice(offset, start)
      rendered += String(
        fragment === undefined ? literal : (fragment(literal, null) ?? ''),
      )

      const [whole, executable, inert, chain] = match

      if (whole.startsWith('\\')) {
        rendered += String(
          fragment === undefined ? '{{' : (fragment('{{', null) ?? ''),
        )
      } else if (executable !== undefined) {
        rendered += this.piece(executable, values, true, fragment)
      } else if (inert !== undefined) {
        rendered += this.piece(inert, values, false, fragment)
      } else if (!this.enableChains || !isBoundRoot(chain, values)) {
        // A chain the host did not turn on, or one no variable can resolve,
        // stays the text the author wrote.
        rendered += String(
          fragment === undefined ? whole : (fragment(whole, null) ?? ''),
        )
      } else {
        rendered += this.piece(chain, values, false, fragment)
      }

      offset = start + whole.length
    }

    const literal = value.slice(offset)

    return (
      rendered +
      String(fragment === undefined ? literal : (fragment(literal, null) ?? ''))
    )
  }

  private piece(
    expression: string,
    values: Record<string, unknown>,
    executable: boolean,
    fragment?: Fragment,
  ): string {
    const result = this.evaluateBinding(expression, values)

    return String(
      fragment === undefined
        ? text(result)
        : (fragment(result, executable) ?? ''),
    )
  }

  private evaluateBinding(
    expression: string,
    values: Record<string, unknown>,
  ): unknown {
    const trimmed = expression.trim()

    try {
      return evaluate(trimmed, values, this.functions)
    } catch (error) {
      if (this.onFailure === undefined) return null
      return this.onFailure(trimmed, error)
    }
  }

  /** The chain of a value that is one whole chain and nothing else. */
  private wholeChain(
    value: string,
    values: Record<string, unknown>,
  ): string | null {
    if (!this.enableChains) return null

    const match = WHOLE_CHAIN.exec(value)
    if (match === null || !isBoundRoot(match[1], values)) return null

    return match[1]
  }

  /** Every expression written in the value, taken from the bindings around them. */
  private expressions(value: string): string[] {
    const unescaped = value.split(ESCAPED_OPEN).join('')

    const expressions = [...unescaped.matchAll(BINDINGS)].map((binding) =>
      (binding[1] ?? binding[2] ?? '').trim(),
    )

    if (this.enableChains) {
      for (const chain of unescaped.matchAll(new RegExp(AT_CHAIN, 'g'))) {
        expressions.push(chain[1])
      }
    }

    return expressions
  }
}

/**
 * A binding's value as text, matching what the `string()` conversion of the
 * same value produces. A host wanting its own rendering passes a fragment and
 * receives the value before it becomes text.
 */
function text(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return ''
  return String(value)
}

function isBoundRoot(chain: string, values: Record<string, unknown>): boolean {
  const root = chain.split('.')[0].split('[')[0]

  return Object.hasOwn(values, root)
}

/** The names an expression reads, from its parse tree. */
function identifiers(expression: string): string[] {
  if (expression === '') return []

  const result = parse(expression)
  if (!result.isSuccess) return []

  const names: string[] = []
  visit(result.cst, (node) => {
    if (node.name === 'identifierExpression') {
      const identifier = node.children.Identifier as IToken[] | undefined
      if (identifier?.[0]) names.push(identifier[0].image)
    }
  })

  return names
}

function visit(node: CstNode, visitor: (node: CstNode) => void): void {
  visitor(node)
  for (const child of Object.values(node.children).flat()) {
    if ((child as CstNode).children !== undefined) {
      visit(child as CstNode, visitor)
    }
  }
}
