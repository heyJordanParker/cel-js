import type { FunctionInterface } from '../../Function/FunctionInterface.js'
import type { BinaryOperatorOverloadInterface } from '../../Operator/BinaryOperatorOverloadInterface.js'
import type { UnaryOperatorOverloadInterface } from '../../Operator/UnaryOperatorOverloadInterface.js'
import type { ExtensionInterface } from '../ExtensionInterface.js'
import { ContainsFunction } from './Function/ContainsFunction.js'
import { EndsWithFunction } from './Function/EndsWithFunction.js'
import { IndexOfFunction } from './Function/IndexOfFunction.js'
import { LastIndexOfFunction } from './Function/LastIndexOfFunction.js'
import { MatchesFunction } from './Function/MatchesFunction.js'
import { ReplaceFunction } from './Function/ReplaceFunction.js'
import { SplitFunction } from './Function/SplitFunction.js'
import { StartsWithFunction } from './Function/StartsWithFunction.js'
import { ToAsciiLowerFunction } from './Function/ToAsciiLowerFunction.js'
import { ToAsciiUpperFunction } from './Function/ToAsciiUpperFunction.js'
import { ToLowerFunction } from './Function/ToLowerFunction.js'
import { ToUpperFunction } from './Function/ToUpperFunction.js'
import { TrimFunction } from './Function/TrimFunction.js'
import { TrimLeftFunction } from './Function/TrimLeftFunction.js'
import { TrimRightFunction } from './Function/TrimRightFunction.js'

export class StringExtension implements ExtensionInterface {
  getFunctions(): FunctionInterface[] {
    return [
      new ContainsFunction(),
      new EndsWithFunction(),
      new IndexOfFunction(),
      new LastIndexOfFunction(),
      new MatchesFunction(),
      new ReplaceFunction(),
      new SplitFunction(),
      new StartsWithFunction(),
      new ToAsciiLowerFunction(),
      new ToAsciiUpperFunction(),
      new ToLowerFunction(),
      new ToUpperFunction(),
      new TrimFunction(),
      new TrimLeftFunction(),
      new TrimRightFunction(),
    ]
  }

  getBinaryOperatorOverloads(): BinaryOperatorOverloadInterface[] {
    return []
  }

  getUnaryOperatorOverloads(): UnaryOperatorOverloadInterface[] {
    return []
  }
}
