import { expect, describe, it } from 'vitest'

import { Exception, ExpressionKind, Parser, evaluate } from '..'
import { UnexpectedEndOfFileException } from '../Parser/Exception/UnexpectedEndOfFileException'

describe('index.ts', () => {
  describe('Parser', () => {
    it('should return the expression tree of a valid CEL string', () => {
      expect(new Parser().parse('1').kind).toBe(ExpressionKind.IntLiteral)
    })

    it('should throw if given string is not valid CEL string', () => {
      expect(() => new Parser().parse('1 +')).toThrow(UnexpectedEndOfFileException)
    })
  })

  describe('evaluate', () => {
    it('should throw an engine exception if given string is not valid CEL expression', () => {
      expect(() => evaluate('1 + ')).toThrow(Exception)
    })
  })
})
