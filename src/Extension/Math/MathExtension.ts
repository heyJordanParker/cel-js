import type { FunctionInterface } from '../../Function/FunctionInterface.js'
import type { BinaryOperatorOverloadInterface } from '../../Operator/BinaryOperatorOverloadInterface.js'
import type { UnaryOperatorOverloadInterface } from '../../Operator/UnaryOperatorOverloadInterface.js'
import type { ExtensionInterface } from '../ExtensionInterface.js'
import { BaseConvertFunction } from './Function/BaseConvertFunction.js'
import { ClampFunction } from './Function/ClampFunction.js'
import { FromBaseFunction } from './Function/FromBaseFunction.js'
import { MaxFunction } from './Function/MaxFunction.js'
import { MeanFunction } from './Function/MeanFunction.js'
import { MedianFunction } from './Function/MedianFunction.js'
import { MinFunction } from './Function/MinFunction.js'
import { SumFunction } from './Function/SumFunction.js'
import { ToBaseFunction } from './Function/ToBaseFunction.js'

export class MathExtension implements ExtensionInterface {
  getFunctions(): FunctionInterface[] {
    return [
      new BaseConvertFunction(),
      new ClampFunction(),
      new FromBaseFunction(),
      new MaxFunction(),
      new MeanFunction(),
      new MedianFunction(),
      new MinFunction(),
      new SumFunction(),
      new ToBaseFunction(),
    ]
  }

  getBinaryOperatorOverloads(): BinaryOperatorOverloadInterface[] {
    return []
  }

  getUnaryOperatorOverloads(): UnaryOperatorOverloadInterface[] {
    return []
  }
}
