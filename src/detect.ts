import { SPANS } from './Template/Grammar.js'

/**
 * Where the expressions are in a piece of text, and which one the caret sits in.
 *
 * An editor offering completion inside an expression needs two answers: what is
 * the author typing right now, and where are the finished expressions so they
 * can be marked. Both are pure text analysis over the same grammar
 * {@link Template} renders, so an editor and a renderer never disagree about
 * what an expression is.
 *
 * No DOM and no catalog knowledge: whether a bare `@word` names anything real
 * is the caller's question, answered through the validator it passes in.
 */

/** Which opener started an expression. */
export type Opener = 'braces' | 'at'

export interface DetectOptions {
  /** Whether `@root.field` opens an expression. Off by default, as in the renderer. */
  enableChains?: boolean
}

/** An opener the caret sits inside, with no terminator yet. */
export interface OpenQuery {
  opener: Opener
  /** Index of the opener's first character: the `{` of `{{`, or the `@`. */
  anchor: number
  /** Index just past the caret. */
  caret: number
  /** The text between the opener and the caret, such as `article.auth`. */
  query: string
}

/** A finished expression in the text. */
export interface Span {
  opener: Opener
  /** Index of the opener's first character. */
  start: number
  /** Index just past the expression: past `}}` or `}}}`, or past the chain. */
  end: number
  /** The expression's code, as {@link Template.parts} reads it. */
  inner: string
  /** Whether its author wrote it as `{{{ }}}`. */
  raw: boolean
  valid: boolean
}

/**
 * A validator's verdict on one candidate expression.
 *
 * `drop` exists for the chain opener: a bare `@word` that names nothing is
 * prose, not a broken expression, so it is left alone rather than marked wrong.
 */
export type SpanVerdict = 'drop' | 'invalid' | 'valid'

export type SpanValidator = (inner: string, opener: Opener) => SpanVerdict

/** A letter, digit or underscore: the word-boundary and identifier alphabet. */
function isWordCharacter(character: string | undefined): boolean {
  return character !== undefined && /[A-Za-z0-9_]/.test(character)
}

/** The next unescaped `{{` at or after `from`, or -1. */
function nextOpen(text: string, from: number): number {
  let index = text.indexOf('{{', from)
  while (index !== -1) {
    if (text[index - 1] !== '\\') return index
    index = text.indexOf('{{', index + 2)
  }
  return -1
}

/** The nearest unescaped `{{` at or before `before`, or -1. */
function lastOpen(text: string, before: number): number {
  let index = text.lastIndexOf('{{', before)
  while (index !== -1) {
    if (text[index - 1] !== '\\') return index
    if (index === 0) return -1
    index = text.lastIndexOf('{{', index - 1)
  }
  return -1
}

/**
 * The length of the chain starting at `text[from]`, the first character after
 * the `@`. A chain is a root name that does not start with a digit, followed by
 * `.field` and `[n]` steps, ending at the first character outside that shape.
 *
 * A trailing dot is included, so a chain being typed reports `article.`.
 */
function chainLength(text: string, from: number): number {
  if (!isWordCharacter(text[from]) || /[0-9]/.test(text[from] as string)) return 0

  let index = from
  while (index < text.length && isWordCharacter(text[index])) index++

  for (;;) {
    const character = text[index]

    if (character === '.') {
      index++
      while (index < text.length && isWordCharacter(text[index])) index++
      continue
    }

    if (character === '[') {
      let scan = index + 1
      while (scan < text.length && /[0-9]/.test(text[scan] as string)) scan++
      if (text[scan] === ']' && scan > index + 1) {
        index = scan + 1
        continue
      }
      break
    }

    break
  }

  return index - from
}

/** The nearest unclosed `{{` the caret sits in, or null. */
function bracesQuery(text: string, caret: number): OpenQuery | null {
  const open = lastOpen(text, caret - 1)
  if (open === -1) return null

  const before = text.slice(open + 2, caret)

  // A `}}` between the opener and the caret means this expression already closed.
  if (before.includes('}}')) return null
  // An expression does not span lines.
  if (before.includes('\n')) return null
  // A second opener before the caret would nest an expression, which never happens.
  const nested = nextOpen(text, open + 2)
  if (nested !== -1 && nested + 2 <= caret) return null

  // Scan from one character before the caret so a `}}` straddling it is still
  // found. If this expression closes after the caret with nothing interrupting,
  // the caret sits inside a finished expression rather than an open one.
  const close = text.indexOf('}}', Math.max(open + 2, caret - 1))
  if (close !== -1) {
    const inner = nextOpen(text, caret)
    const interrupted = (inner !== -1 && inner < close) || text.slice(caret, close).includes('\n')
    if (!interrupted) return null
  }

  return { opener: 'braces', anchor: open, caret, query: before }
}

/** The nearest word-boundary `@` chain the caret sits in, or null. */
function chainQuery(text: string, caret: number): OpenQuery | null {
  const at = text.lastIndexOf('@', caret - 1)
  if (at === -1) return null

  // A word character before the `@` makes it part of a word, as in an email
  // address, so it opens nothing.
  if (isWordCharacter(text[at - 1])) return null

  const query = text.slice(at + 1, caret)
  if (query.includes('\n')) return null

  // Past the end of the chain the author has left the expression behind.
  if (caret > at + 1 + chainLength(text, at + 1)) return null

  return { opener: 'at', anchor: at, caret, query }
}

/**
 * The open expression the caret sits in, if any. Where both openers could claim
 * it, the one that opened nearest the caret wins, because that is the one the
 * author is inside.
 */
export function detectQuery(text: string, caret: number, options: DetectOptions = {}): OpenQuery | null {
  const braces = bracesQuery(text, caret)
  const chain = options.enableChains ? chainQuery(text, caret) : null

  if (braces && chain) return braces.anchor >= chain.anchor ? braces : chain

  return braces ?? chain
}

/**
 * Every finished expression in the text, in document order, each marked by the
 * validator.
 *
 * The spans come from the scan {@link Template.parts} splits a template with, so
 * an editor marks exactly the expressions a render evaluates: `\{{` is text, a
 * `{{{ }}}` span is one raw expression, and `{{ a {{ b }}` is one expression
 * whose code is `a {{ b`.
 */
export function findSpans(text: string, validate: SpanValidator, options: DetectOptions = {}): Span[] {
  const spans: Span[] = []

  for (const match of text.matchAll(SPANS)) {
    const [whole, raw, inert, chain] = match
    const start = match.index
    const end = start + whole.length
    const code = raw ?? inert

    if (code !== undefined) {
      const verdict = code === '' ? 'invalid' : validate(code, 'braces')
      if (verdict !== 'drop') {
        spans.push({ opener: 'braces', start, end, inner: code, raw: raw !== undefined, valid: verdict === 'valid' })
      }

      continue
    }

    if (chain === undefined || !options.enableChains) continue

    const verdict = validate(chain, 'at')
    if (verdict !== 'drop') {
      spans.push({ opener: 'at', start, end, inner: chain, raw: false, valid: verdict === 'valid' })
    }
  }

  return spans
}
