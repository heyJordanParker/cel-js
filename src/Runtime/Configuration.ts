import { CallableExtension } from '../Extension/Callable/CallableExtension.js'
import type { HostFunction } from '../Extension/Callable/CallableFunction.js'
import { CoreExtension } from '../Extension/Core/CoreExtension.js'
import { DateTimeExtension } from '../Extension/DateTime/DateTimeExtension.js'
import { ISO_8601 } from '../Extension/DateTime/Function/DateFunction.js'
import type { ExtensionInterface } from '../Extension/ExtensionInterface.js'
import { ListExtension } from '../Extension/List/ListExtension.js'
import { MathExtension } from '../Extension/Math/MathExtension.js'
import { StringExtension } from '../Extension/String/StringExtension.js'
import { AllMacro } from '../Interpreter/Macro/AllMacro.js'
import { ExistsMacro } from '../Interpreter/Macro/ExistsMacro.js'
import { ExistsOneMacro } from '../Interpreter/Macro/ExistsOneMacro.js'
import { ExistsOneTwoVarMacro } from '../Interpreter/Macro/ExistsOneTwoVarMacro.js'
import { FilterMacro } from '../Interpreter/Macro/FilterMacro.js'
import { HasMacro } from '../Interpreter/Macro/HasMacro.js'
import { MacroRegistry } from '../Interpreter/Macro/MacroRegistry.js'
import { MapMacro } from '../Interpreter/Macro/MapMacro.js'
import { OptFlatMapMacro } from '../Interpreter/Macro/OptFlatMapMacro.js'
import { OptMapMacro } from '../Interpreter/Macro/OptMapMacro.js'
import { OrMacro } from '../Interpreter/Macro/OrMacro.js'
import { OrValueMacro } from '../Interpreter/Macro/OrValueMacro.js'
import { TransformListMacro } from '../Interpreter/Macro/TransformListMacro.js'
import { TransformMapMacro } from '../Interpreter/Macro/TransformMapMacro.js'

export interface ConfigurationOptions {
  functions?: Record<string, HostFunction>
  timezone?: string
  dateFormat?: string
}

export class Configuration {
  private readonly macroRegistry = new MacroRegistry()
  private readonly extensions: ExtensionInterface[]

  constructor(options: ConfigurationOptions = {}) {
    for (const macro of [
      new HasMacro(),
      new AllMacro(),
      new ExistsMacro(),
      new ExistsOneMacro(),
      new ExistsOneTwoVarMacro(),
      new TransformListMacro(),
      new TransformMapMacro(),
      new FilterMacro(),
      new MapMacro(),
      new OrMacro(),
      new OrValueMacro(),
      new OptMapMacro(),
      new OptFlatMapMacro(),
    ]) {
      this.macroRegistry.register(macro)
    }

    this.extensions = [
      new CoreExtension(),
      new DateTimeExtension(options.timezone ?? 'UTC', options.dateFormat ?? ISO_8601),
      new StringExtension(),
      new ListExtension(),
      new MathExtension(),
      new CallableExtension(options.functions ?? {}),
    ]
  }

  getExtensions(): ExtensionInterface[] {
    return this.extensions
  }

  getMacroRegistry(): MacroRegistry {
    return this.macroRegistry
  }
}
