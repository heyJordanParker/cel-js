import type { FunctionInterface, FunctionOverloadHandler } from '../../Function/FunctionInterface.js'
import { resolve } from '../../Value/Resolver/DefaultValueResolver.js'
import type { ValueKind } from '../../Value/ValueKind.js'

export type HostFunction = (...args: never[]) => unknown

export class CallableFunction implements FunctionInterface {
  constructor(
    private readonly name: string,
    private readonly callable: HostFunction,
  ) {}

  getName(): string {
    return this.name
  }

  getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    return []
  }

  getHandler(): FunctionOverloadHandler {
    const callable = this.callable as (...args: unknown[]) => unknown
    return (_, args) => resolve(callable(...args.map((argument) => argument.getRawValue())))
  }
}
