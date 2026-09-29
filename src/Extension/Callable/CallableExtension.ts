import type { FunctionInterface } from '../../Function/FunctionInterface.js'
import type { BinaryOperatorOverloadInterface } from '../../Operator/BinaryOperatorOverloadInterface.js'
import type { UnaryOperatorOverloadInterface } from '../../Operator/UnaryOperatorOverloadInterface.js'
import type { ExtensionInterface } from '../ExtensionInterface.js'
import { CallableFunction, type HostFunction } from './CallableFunction.js'

export class CallableExtension implements ExtensionInterface {
  constructor(private readonly functions: Record<string, HostFunction>) {}

  getFunctions(): FunctionInterface[] {
    return Object.entries(this.functions).map(([name, callable]) => new CallableFunction(name, callable))
  }

  getBinaryOperatorOverloads(): BinaryOperatorOverloadInterface[] {
    return []
  }

  getUnaryOperatorOverloads(): UnaryOperatorOverloadInterface[] {
    return []
  }
}
