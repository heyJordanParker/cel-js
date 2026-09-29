import { expect, describe, it } from 'vitest'

import { evaluate } from '..'
import { UnexpectedTokenException } from '../Parser/Exception/UnexpectedTokenException'

const reservedIdentifiers = [
  'as',
  'break',
  'const',
  'continue',
  'else',
  'for',
  'function',
  'if',
  'import',
  'let',
  'loop',
  'package',
  'namespace',
  'return',
  'var',
  'void',
  'while',
]

describe('reserved identifiers', () => {
  it.each(reservedIdentifiers)('should throw if reserved identifier "%s" is used', (identifier) => {
    expect(() => evaluate(`${identifier} < 1`)).toThrow(UnexpectedTokenException)
  })
})
