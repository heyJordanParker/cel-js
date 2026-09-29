import type { FunctionInterface } from '../../Function/FunctionInterface.js'
import type { BinaryOperatorOverloadInterface } from '../../Operator/BinaryOperatorOverloadInterface.js'
import type { UnaryOperatorOverloadInterface } from '../../Operator/UnaryOperatorOverloadInterface.js'
import type { ExtensionInterface } from '../ExtensionInterface.js'
import { ChunkFunction } from './Function/ChunkFunction.js'
import { ContainsFunction } from './Function/ContainsFunction.js'
import { FlattenFunction } from './Function/FlattenFunction.js'
import { JoinFunction } from './Function/JoinFunction.js'
import { ReverseFunction } from './Function/ReverseFunction.js'
import { SortFunction } from './Function/SortFunction.js'

export class ListExtension implements ExtensionInterface {
  getFunctions(): FunctionInterface[] {
    return [
      new ChunkFunction(),
      new ContainsFunction(),
      new FlattenFunction(),
      new JoinFunction(),
      new ReverseFunction(),
      new SortFunction(),
    ]
  }

  getBinaryOperatorOverloads(): BinaryOperatorOverloadInterface[] {
    return []
  }

  getUnaryOperatorOverloads(): UnaryOperatorOverloadInterface[] {
    return []
  }
}
