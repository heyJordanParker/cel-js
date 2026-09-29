import { resolve } from '../Value/Resolver/DefaultValueResolver.js'
import { Value } from '../Value/Value.js'

export class Environment {
  constructor(private readonly variables: Map<string, Value> = new Map()) {}

  static fromObject(variables: Record<string, unknown>): Environment {
    return new Environment(
      new Map(Object.entries(variables).map(([name, value]) => [name, resolve(value)])),
    )
  }

  addVariable(name: string, value: Value): void {
    this.variables.set(name, value)
  }

  hasVariable(name: string): boolean {
    return this.variables.has(name)
  }

  getVariable(name: string): Value | null {
    return this.variables.get(name) ?? null
  }

  fork(): Environment {
    return new Environment(new Map(this.variables))
  }
}
