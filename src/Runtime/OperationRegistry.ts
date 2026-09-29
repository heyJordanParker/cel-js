import { ConflictingFunctionSignatureException } from '../Exception/ConflictingFunctionSignatureException.js'
import type { ExtensionInterface } from '../Extension/ExtensionInterface.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../Function/FunctionInterface.js'
import type {
  BinaryOperatorOverloadHandler,
  BinaryOperatorOverloadInterface,
} from '../Operator/BinaryOperatorOverloadInterface.js'
import type {
  UnaryOperatorOverloadHandler,
  UnaryOperatorOverloadInterface,
} from '../Operator/UnaryOperatorOverloadInterface.js'
import type { BinaryOperatorKind } from '../Syntax/Binary/BinaryOperatorKind.js'
import type { UnaryOperatorKind } from '../Syntax/Unary/UnaryOperatorKind.js'
import type { Value } from '../Value/Value.js'
import type { ValueKind } from '../Value/ValueKind.js'

type Overload = { handler: FunctionOverloadHandler; signature: ValueKind[] }

const hashSignature = (signature: ValueKind[]): string =>
  signature.length === 0 ? '<no-args>' : signature.join(',')

export class OperationRegistry {
  private readonly functionOverloads = new Map<string, Map<string, Overload>>()
  private readonly dynamicFunctions = new Map<string, FunctionOverloadHandler>()
  private readonly binaryOperatorOverloads = new Map<string, BinaryOperatorOverloadHandler>()
  private readonly unaryOperatorOverloads = new Map<string, UnaryOperatorOverloadHandler>()

  register(extension: ExtensionInterface): void {
    extension.getFunctions().forEach((fn) => this.addFunction(fn))
    extension.getBinaryOperatorOverloads().forEach((overload) => this.addBinaryOperatorOverload(overload))
    extension.getUnaryOperatorOverloads().forEach((overload) => this.addUnaryOperatorOverload(overload))
  }

  addFunction(fn: FunctionInterface): void {
    const name = fn.getName()

    if (fn.getHandler !== undefined) {
      this.dynamicFunctions.set(name, fn.getHandler())
    }

    const overloads = this.functionOverloads.get(name) ?? new Map<string, Overload>()
    for (const [signature, handler] of fn.getOverloads()) {
      const hash = hashSignature(signature)
      if (overloads.has(hash)) {
        throw new ConflictingFunctionSignatureException(
          `A function with the name "${name}" and signature "(${hash})" is already registered.`,
        )
      }

      overloads.set(hash, { handler, signature })
    }

    if (overloads.size > 0) {
      this.functionOverloads.set(name, overloads)
    }
  }

  addBinaryOperatorOverload(overload: BinaryOperatorOverloadInterface): void {
    const operator = overload.getOperator()
    for (const [[left, right], handler] of overload.getOverloads()) {
      this.binaryOperatorOverloads.set(`${operator}|${left}|${right}`, handler)
    }
  }

  addUnaryOperatorOverload(overload: UnaryOperatorOverloadInterface): void {
    const operator = overload.getOperator()
    for (const [kind, handler] of overload.getOverloads()) {
      this.unaryOperatorOverloads.set(`${operator}|${kind}`, handler)
    }
  }

  getFunction(name: string, args: Value[]): FunctionOverloadHandler | null {
    const overload = this.functionOverloads.get(name)?.get(hashSignature(args.map((arg) => arg.getKind())))

    return overload?.handler ?? this.dynamicFunctions.get(name) ?? null
  }

  getBinaryOperator(
    operator: BinaryOperatorKind,
    left: ValueKind,
    right: ValueKind,
  ): BinaryOperatorOverloadHandler | null {
    return this.binaryOperatorOverloads.get(`${operator}|${left}|${right}`) ?? null
  }

  getUnaryOperator(operator: UnaryOperatorKind, operand: ValueKind): UnaryOperatorOverloadHandler | null {
    return this.unaryOperatorOverloads.get(`${operator}|${operand}`) ?? null
  }

  getFunctionSignatures(name: string): ValueKind[][] | null {
    const overloads = this.functionOverloads.get(name)
    return overloads === undefined ? null : Array.from(overloads.values(), (overload) => overload.signature)
  }
}
