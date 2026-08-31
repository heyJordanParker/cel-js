/**
 * Where the bindings are in a piece of text, and which one the caret sits in.
 *
 * An editor offering completion inside a binding needs two answers: what is the
 * author typing right now, and where are the finished bindings so they can be
 * marked. Both are pure text analysis over the same grammar {@link Template}
 * renders, so an editor and a renderer never disagree about what a binding is.
 *
 * No DOM and no catalog knowledge: whether a bare `@word` names anything real
 * is the caller's question, answered through the validator it passes in.
 */

/** Which opener started a binding. */
export type Opener = 'braces' | 'at'

export interface DetectOptions {
  /** Whether `@root.field` opens a binding. Off by default, as in the renderer. */
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

/** A finished binding in the text. */
export interface Span {
  opener: Opener
  /** Index of the opener's first character. */
  start: number
  /** Index just past the binding: past `}}`, or past the chain. */
  end: number
  /** The expression text: for `{{` the inner text, for `@` the bare chain. */
  inner: string
  valid: boolean
}

/**
 * A validator's verdict on one candidate binding.
 *
 * `drop` exists for the chain opener: a bare `@word` that names nothing is
 * prose, not a broken binding, so it is left alone rather than marked wrong.
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
 * A trailing dot is included, so a chain being typed reports `article.`. Span
 * finding trims a dot that sits before whitespace or the end of the text.
 */
function chainLength(text: string, from: number): number {
  if (!isWordCharacter(text[from]) || /[0-9]/.test(text[from])) return 0

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
      while (scan < text.length && /[0-9]/.test(text[scan])) scan++
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

  // A `}}` between the opener and the caret means this binding already closed.
  if (before.includes('}}')) return null
  // A binding does not span lines.
  if (before.includes('\n')) return null
  // A second opener before the caret would nest a binding, which never happens.
  const nested = nextOpen(text, open + 2)
  if (nested !== -1 && nested + 2 <= caret) return null

  // Scan from one character before the caret so a `}}` straddling it is still
  // found. If this binding closes after the caret with nothing interrupting,
  // the caret sits inside a finished binding rather than an open one.
  const close = text.indexOf('}}', Math.max(open + 2, caret - 1))
  if (close !== -1) {
    const inner = nextOpen(text, caret)
    const interrupted =
      (inner !== -1 && inner < close) || text.slice(caret, close).includes('\n')
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

  // Past the end of the chain the author has left the binding behind.
  if (caret > at + 1 + chainLength(text, at + 1)) return null

  return { opener: 'at', anchor: at, caret, query }
}

/**
 * The open binding the caret sits in, if any. Where both openers could claim
 * it, the one that opened nearest the caret wins, because that is the one the
 * author is inside.
 */
export function detectQuery(
  text: string,
  caret: number,
  options: DetectOptions = {},
): OpenQuery | null {
  const braces = bracesQuery(text, caret)
  const chain = options.enableChains ? chainQuery(text, caret) : null

  if (braces && chain) return braces.anchor >= chain.anchor ? braces : chain

  return braces ?? chain
}

/** The finished `{{ }}` binding at `open`, or where to resume when it never closes. */
function bracesSpan(
  text: string,
  open: number,
): { span: Omit<Span, 'valid'> | null; next: number } | null {
  const close = text.indexOf('}}', open + 2)
  if (close === -1) return null

  // An opener before this one's closer means this opener never closed. Resume
  // from the inner one.
  const inner = nextOpen(text, open + 2)
  if (inner !== -1 && inner < close) return { span: null, next: inner }

  const end = close + 2

  return {
    span: {
      opener: 'braces',
      start: open,
      end,
      inner: text.slice(open + 2, close),
    },
    next: end,
  }
}

/** The finished `@` chain at the `@`, or null when no chain forms. */
function chainSpan(text: string, at: number): Omit<Span, 'valid'> | null {
  if (isWordCharacter(text[at - 1])) return null

  let length = chainLength(text, at + 1)
  if (length === 0) return null

  // A trailing dot before whitespace or the end is not part of the chain, so
  // `@article. ` marks `@article`.
  while (length > 0 && text[at + length] === '.') length--
  if (length === 0) return null

  const end = at + 1 + length

  return { opener: 'at', start: at, end, inner: text.slice(at + 1, end) }
}

/** The next word-boundary `@` at or after `from`, or -1. */
function nextChainOpen(text: string, from: number): number {
  let index = text.indexOf('@', from)
  while (index !== -1) {
    if (!isWordCharacter(text[index - 1])) return index
    index = text.indexOf('@', index + 1)
  }
  return -1
}

/** The lesser non-negative index, or -1 when both are -1. */
function nearer(left: number, right: number): number {
  if (left === -1) return right
  if (right === -1) return left
  return Math.min(left, right)
}

/**
 * Every finished binding in the text, in document order, each marked by the
 * validator.
 *
 * A `{{` binding opens only once it has its own closer with no second opener in
 * between, so typing `{{ art` ahead of an existing `{{ x }}` marks only the
 * finished one. A `@` inside a `{{ }}` binding is never scanned, because the
 * brace binding consumes it.
 */
export function findSpans(
  text: string,
  validate: SpanValidator,
  options: DetectOptions = {},
): Span[] {
  const spans: Span[] = []
  let cursor = 0

  while (cursor < text.length) {
    const braceOpen = nextOpen(text, cursor)
    const chainOpen = options.enableChains ? nextChainOpen(text, cursor) : -1
    const next = nearer(braceOpen, chainOpen)
    if (next === -1) break

    if (next === braceOpen) {
      const found = bracesSpan(text, braceOpen)
      if (!found) break

      if (found.span) {
        const inner = found.span.inner.trim()
        const verdict = inner.length > 0 ? validate(inner, 'braces') : 'invalid'
        if (verdict !== 'drop') {
          spans.push({ ...found.span, valid: verdict === 'valid' })
        }
      }

      cursor = found.next
      continue
    }

    const candidate = chainSpan(text, chainOpen)
    if (!candidate) {
      cursor = chainOpen + 1
      continue
    }

    const verdict = validate(candidate.inner, 'at')
    if (verdict !== 'drop') {
      spans.push({ ...candidate, valid: verdict === 'valid' })
    }

    cursor = candidate.end
  }

  return spans
}
