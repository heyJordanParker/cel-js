import type { FunctionInterface } from '../Function/FunctionInterface.js'
import type { BinaryOperatorOverloadInterface } from '../Operator/BinaryOperatorOverloadInterface.js'
import type { UnaryOperatorOverloadInterface } from '../Operator/UnaryOperatorOverloadInterface.js'

export interface ExtensionInterface {
  getFunctions(): FunctionInterface[]
  getBinaryOperatorOverloads(): BinaryOperatorOverloadInterface[]
  getUnaryOperatorOverloads(): UnaryOperatorOverloadInterface[]
}
