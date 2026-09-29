import { Exception } from '../Exception/Exception.js'
import { evaluate } from '../functions.js'
import { Parser } from '../Parser/Parser.js'
import { Configuration, type ConfigurationOptions } from '../Runtime/Configuration.js'
import type { Expression } from '../Syntax/Expression.js'
import { BytesLiteralExpression } from '../Syntax/Literal/BytesLiteralExpression.js'
import { IntegerLiteralExpression } from '../Syntax/Literal/IntegerLiteralExpression.js'
import { StringLiteralExpression } from '../Syntax/Literal/StringLiteralExpression.js'
import { UnsignedIntegerLiteralExpression } from '../Syntax/Literal/UnsignedIntegerLiteralExpression.js'
import { CallExpression } from '../Syntax/Member/CallExpression.js'
import { IdentifierExpression } from '../Syntax/Member/IdentifierExpression.js'
import { IndexExpression } from '../Syntax/Member/IndexExpression.js'
import { MemberAccessExpression } from '../Syntax/Member/MemberAccessExpression.js'
import type { Node } from '../Syntax/Node.js'
import { ParenthesizedExpression } from '../Syntax/ParenthesizedExpression.js'
import { AT_CHAIN, ESCAPED_OPEN, SPANS, WHOLE_EXECUTABLE, WHOLE_INERT } from './Grammar.js'

export type Part = string | { code: string; raw: boolean }

export type Segment = string | number | null

export type Reference = Segment[]

export type Fragment = (value: unknown, raw: boolean | null) => unknown

export interface TemplateOptions extends ConfigurationOptions {
  enableChains?: boolean
  onFailure?: (expression: string, error: unknown) => unknown
}

type Role = 'item' | 'key' | 'value'

type Scope = Map<string, Reference | null>

type Read = { path: Reference | null; free: boolean; written: Segment[]; nodes: Node[] }

const COMPREHENSIONS = new Map<string, Map<number, Role[]>>([
  ['map', new Map([[2, ['item']], [3, ['item']]])],
  ['filter', new Map([[2, ['item']]])],
  ['all', new Map([[2, ['item']], [3, ['key', 'item']]])],
  ['exists', new Map([[2, ['item']], [3, ['key', 'item']]])],
  ['exists_one', new Map([[2, ['item']]])],
  ['existsOne', new Map([[3, ['key', 'item']]])],
  ['transformList', new Map([[3, ['key', 'item']], [4, ['key', 'item']]])],
  ['transformMap', new Map([[3, ['key', 'item']], [4, ['key', 'item']]])],
  ['optMap', new Map([[2, ['value']]])],
  ['optFlatMap', new Map([[2, ['value']]])],
])

const WHOLE_CHAIN = new RegExp(`^\\s*${AT_CHAIN}\\s*$`)

const key = (reference: Reference): string => JSON.stringify(reference)

function collection(value: unknown): unknown[] | null {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.values(value)
  }

  return null
}

function literalSegment(index: Expression): Segment {
  if (index instanceof IntegerLiteralExpression || index instanceof StringLiteralExpression) {
    return index.value
  }

  if (index instanceof UnsignedIntegerLiteralExpression) {
    return index.value
  }

  if (index instanceof BytesLiteralExpression) {
    return new TextDecoder().decode(index.value)
  }

  return null
}

function isBoundRoot(chain: string, values: Record<string, unknown>): boolean {
  const root = (chain.split('.', 1)[0] as string).split('[', 1)[0] as string
  return Object.hasOwn(values, root)
}

function text(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint') {
    return String(value)
  }

  return ''
}

function parses(expression: string): boolean {
  try {
    new Parser().parse(expression)
    return true
  } catch (error) {
    if (error instanceof Exception) {
      return false
    }

    throw error
  }
}

function resolve(role: Role, collection: Reference | null): Reference | null {
  switch (role) {
    case 'item':
      return collection === null ? null : [...collection, null]
    case 'key':
      return null
    case 'value':
      return collection
  }
}

/**
 * Collects every chain the tree reads, and answers the collection the node's value
 * holds items of when that is a path: a `filter` keeps items of the collection it
 * walks. Any other call builds new values, which no path names.
 */
function walk(node: Node, scope: Scope, reads: Read[]): Reference | null {
  if (
    node instanceof IdentifierExpression ||
    node instanceof MemberAccessExpression ||
    node instanceof IndexExpression
  ) {
    walkChain(node, scope, reads)
    return null
  }

  const target = node instanceof CallExpression ? node.target : null
  const args = node instanceof CallExpression ? node.arguments.elements : []
  const roles =
    node instanceof CallExpression && target !== null
      ? (COMPREHENSIONS.get(node.function.name)?.get(args.length) ?? [])
      : []
  const variables = args.slice(0, roles.length)

  if (
    target === null ||
    roles.length === 0 ||
    variables.some((variable) => !(variable instanceof IdentifierExpression))
  ) {
    for (const child of node.getChildren()) {
      walk(child, scope, reads)
    }

    return null
  }

  const walked = walkChain(target, scope, reads)
  const inner: Scope = new Map(scope)

  variables.forEach((variable, position) => {
    if (!(variable instanceof IdentifierExpression)) {
      return
    }

    inner.set(variable.identifier.name, resolve(roles[position] ?? 'key', walked))
  })

  for (const argument of args.slice(roles.length)) {
    walk(argument, inner, reads)
  }

  return node instanceof CallExpression && node.function.name === 'filter' ? walked : null
}

function walkChain(node: Expression, scope: Scope, reads: Read[]): Reference | null {
  let segments: Segment[] = []
  let nodes: Node[] = []
  const indexes: Expression[] = []
  let current: Expression = node

  while (
    current instanceof MemberAccessExpression ||
    current instanceof IndexExpression ||
    current instanceof ParenthesizedExpression
  ) {
    if (current instanceof ParenthesizedExpression) {
      current = current.expression
      continue
    }

    if (current instanceof MemberAccessExpression) {
      segments = [current.field.name, ...segments]
    } else {
      segments = [literalSegment(current.index), ...segments]
      indexes.push(current.index)
    }

    nodes = [current, ...nodes]
    current = current.operand
  }

  let path: Reference | null = null
  if (current instanceof IdentifierExpression) {
    const name = current.identifier.name
    const free = !scope.has(name)
    const prefix = free ? [name] : (scope.get(name) ?? null)
    path = prefix === null ? null : [...prefix, ...segments]

    reads.push({ path, free, written: [name, ...segments], nodes: [current, ...nodes] })
  } else {
    const filtered = walk(current, scope, reads)
    path = segments.length === 0 ? filtered : null
  }

  for (const index of indexes.reverse()) {
    walk(index, scope, reads)
  }

  return path
}

export class Template {
  private readonly configuration: Configuration
  private readonly enableChains: boolean
  private readonly onFailure?: (expression: string, error: unknown) => unknown

  constructor(options: TemplateOptions = {}) {
    this.configuration = new Configuration(options)
    this.enableChains = options.enableChains ?? false
    this.onFailure = options.onFailure
  }

  static expression(body: string): string {
    if (body.includes('}}')) {
      throw new Error(`An expression body cannot contain \`}}\`: ${body}`)
    }

    return `{{ ${body} }}`
  }

  static body(value: string): string {
    const match = WHOLE_INERT.exec(value)
    if (match === null) {
      throw new Error('Only a whole expression has an expression body.')
    }

    return match[1] as string
  }

  static escape(value: string): string {
    return value.split('{{').join(ESCAPED_OPEN)
  }

  static parts(template: string): Part[] {
    const parts: Part[] = []
    let pending = ''
    let offset = 0

    for (const match of template.matchAll(SPANS)) {
      const whole = match[0]
      pending += template.slice(offset, match.index)
      offset = match.index + whole.length

      const code = match[1] ?? match[2]
      if (code === undefined) {
        pending += whole === ESCAPED_OPEN ? '{{' : whole
        continue
      }

      if (pending !== '') {
        parts.push(pending)
        pending = ''
      }

      parts.push({ code, raw: match[1] !== undefined })
    }

    pending += template.slice(offset)
    if (pending !== '') {
      parts.push(pending)
    }

    return parts
  }

  static compose(parts: Part[]): string {
    let template = ''

    for (const part of parts) {
      if (typeof part === 'string') {
        template += Template.escape(part)
        continue
      }

      if (template.endsWith('\\')) {
        throw new Error(`Text ending in \`\\\` would escape the expression after it: ${part.code}`)
      }

      const expression = Template.expression(part.code)
      template += part.raw ? `{${expression}}` : expression
    }

    return template
  }

  static references(code: string): Reference[] {
    const reads: Read[] = []
    walk(new Parser().parse(code), new Map(), reads)

    const references = new Map<string, Reference>()
    for (const read of reads) {
      if (read.path !== null) {
        references.set(key(read.path), read.path)
      }
    }

    return [...references.values()]
  }

  static rename(code: string, from: string, to: string): string {
    let root: Expression
    try {
      root = new Parser().parse(code)
    } catch (error) {
      if (error instanceof Exception) {
        return code
      }

      throw error
    }

    const reads: Read[] = []
    walk(root, new Map(), reads)

    const path = from.split('.')
    const depth = path.length - 1
    const starts = new Map<number, number>()

    for (const read of reads) {
      const node = read.nodes[depth]
      if (!read.free || node === undefined) {
        continue
      }

      const matches = path.every(
        (segment, position) => !(read.nodes[position] instanceof IndexExpression) && read.written[position] === segment,
      )
      if (!matches) {
        continue
      }

      const span = (node as Expression).getSpan()
      starts.set(span.start, span.end)
    }

    for (const [start, end] of [...starts].sort(([left], [right]) => right - left)) {
      code = code.slice(0, start) + to + code.slice(end)
    }

    return code
  }

  roots(value: unknown): string[] {
    return [...new Set(this.referencesIn(value).map((reference) => String(reference[0])))]
  }

  paths(value: unknown): Record<string, (string | number)[][]> {
    const paths = new Map<string, Map<string, (string | number)[]>>()
    for (const reference of this.referencesIn(value)) {
      const chain: (string | number)[] = []
      for (const segment of reference.slice(1)) {
        if (segment === null) {
          break
        }

        chain.push(segment)
      }

      const root = String(reference[0])
      const chains = paths.get(root) ?? new Map<string, (string | number)[]>()
      chains.set(JSON.stringify(chain), chain)
      paths.set(root, chains)
    }

    return Object.fromEntries([...paths].map(([root, chains]) => [root, [...chains.values()]]))
  }

  private referencesIn(value: unknown): Reference[] {
    const items = collection(value)
    if (items !== null) {
      const references = new Map<string, Reference>()
      for (const item of items) {
        for (const reference of this.referencesIn(item)) {
          references.set(key(reference), reference)
        }
      }

      return [...references.values()]
    }

    if (typeof value !== 'string') {
      return []
    }

    const expressions: string[] = []
    for (const part of Template.parts(value)) {
      if (typeof part !== 'string') {
        expressions.push(part.code)
      } else if (this.enableChains) {
        for (const chain of part.matchAll(new RegExp(AT_CHAIN, 'g'))) {
          expressions.push(chain[1] as string)
        }
      }
    }

    const references = new Map<string, Reference>()
    for (const expression of expressions) {
      let read: Reference[]
      try {
        read = Template.references(expression)
      } catch (error) {
        if (error instanceof Exception) {
          continue
        }

        throw error
      }

      for (const reference of read) {
        references.set(key(reference), reference)
      }
    }

    return [...references.values()]
  }

  containsExpression(value: string, values: Record<string, unknown> | null = null): boolean {
    if (/(?<!\\)\{\{/.test(value)) {
      return true
    }

    if (!this.enableChains) {
      return false
    }

    return [...value.matchAll(new RegExp(AT_CHAIN, 'g'))].some(
      (chain) => values === null || isBoundRoot(chain[1] as string, values),
    )
  }

  static containsExecutableExpression(value: string): boolean {
    return /(?<!\\)\{\{\{/.test(value)
  }

  containsInertExpression(value: string, values: Record<string, unknown> | null = null): boolean {
    return this.containsExpression(value.replace(/(?<!\\)\{\{\{\s*(.*?)\s*\}\}\}/gs, ''), values)
  }

  isWholeExpression(value: string, values: Record<string, unknown>): boolean {
    return WHOLE_EXECUTABLE.test(value) || WHOLE_INERT.test(value) || this.isWholeChain(value, values)
  }

  private isWholeChain(value: string, values: Record<string, unknown>): boolean {
    if (!this.enableChains) {
      return false
    }

    const match = WHOLE_CHAIN.exec(value)
    return match !== null && isBoundRoot(match[1] as string, values)
  }

  static isValid(value: unknown): boolean {
    const items = collection(value)
    if (items !== null) {
      return items.every((item) => Template.isValid(item))
    }

    if (typeof value !== 'string' || !value.includes('{{')) {
      return true
    }

    const unescaped = value.split(ESCAPED_OPEN).join('')
    const matches = [...unescaped.matchAll(/\{\{\{\s*(.*?)\s*\}\}\}|\{\{\s*(.*?)\s*\}\}/gs)]

    let withoutExpressions = unescaped
    for (const match of matches) {
      withoutExpressions = withoutExpressions.split(match[0]).join('')
    }

    if (withoutExpressions.includes('{{')) {
      return false
    }

    return matches.every((match) => {
      const expression = (match[1] ?? match[2] ?? '').trim()
      return expression !== '' && parses(expression)
    })
  }

  render(value: unknown, values: Record<string, unknown>, fragment?: Fragment): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.render(item, values, fragment))
    }

    if (collection(value) !== null) {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([name, item]) => [
          name,
          this.render(item, values, fragment),
        ]),
      )
    }

    const opens =
      typeof value === 'string' && (value.includes('{{') || (this.enableChains && value.includes('@')))

    if (!opens) {
      return fragment === undefined ? value : fragment(value, null)
    }

    const parts = Template.parts(value)
    const expressions = parts.filter((part) => typeof part !== 'string')
    const literal = parts.filter((part) => typeof part === 'string').join('')
    const whole = expressions.length === 1 && literal.trim() === '' ? expressions[0] : undefined

    if (whole !== undefined) {
      const result = this.evaluateExpression(whole.code, values)
      return fragment === undefined ? result : fragment(result, whole.raw)
    }

    if (this.isWholeChain(value, values)) {
      const result = this.evaluateExpression((WHOLE_CHAIN.exec(value) as RegExpExecArray)[1] as string, values)
      return fragment === undefined ? result : fragment(result, false)
    }

    let rendered = ''
    let pending = ''

    for (const part of parts) {
      if (typeof part === 'string') {
        pending = part
        continue
      }

      rendered += this.renderText(pending, values, fragment)
      pending = ''

      const result = this.evaluateExpression(part.code, values)
      rendered += String(fragment === undefined ? text(result) : fragment(result, part.raw))
    }

    return rendered + this.renderText(pending, values, fragment)
  }

  private renderText(value: string, values: Record<string, unknown>, fragment?: Fragment): string {
    const pieces = this.enableChains ? value.split(new RegExp(AT_CHAIN)) : [value]

    let rendered = ''
    let literal = ''

    pieces.forEach((piece, position) => {
      if (position % 2 === 0) {
        literal += piece
        return
      }

      if (!isBoundRoot(piece, values)) {
        literal += `@${piece}`
        return
      }

      rendered += String(fragment === undefined ? literal : fragment(literal, null))
      literal = ''

      const result = this.evaluateExpression(piece, values)
      rendered += String(fragment === undefined ? text(result) : fragment(result, false))
    })

    return rendered + String(fragment === undefined ? literal : fragment(literal, null))
  }

  private evaluateExpression(expression: string, values: Record<string, unknown>): unknown {
    const trimmed = expression.trim()

    try {
      return evaluate(trimmed, values, this.configuration).getRawValue()
    } catch (error) {
      if (this.onFailure === undefined) {
        return null
      }

      return this.onFailure(trimmed, error)
    }
  }
}
