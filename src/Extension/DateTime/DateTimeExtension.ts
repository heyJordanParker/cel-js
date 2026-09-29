import type { FunctionInterface } from '../../Function/FunctionInterface.js'
import type { BinaryOperatorOverloadInterface } from '../../Operator/BinaryOperatorOverloadInterface.js'
import type { UnaryOperatorOverloadInterface } from '../../Operator/UnaryOperatorOverloadInterface.js'
import type { ExtensionInterface } from '../ExtensionInterface.js'
import { DateFunction, ISO_8601 } from './Function/DateFunction.js'
import { DurationFunction } from './Function/DurationFunction.js'
import { GetDateFunction } from './Function/GetDateFunction.js'
import { GetDayOfMonthFunction } from './Function/GetDayOfMonthFunction.js'
import { GetDayOfWeekFunction } from './Function/GetDayOfWeekFunction.js'
import { GetDayOfYearFunction } from './Function/GetDayOfYearFunction.js'
import { GetFullYearFunction } from './Function/GetFullYearFunction.js'
import { GetHoursFunction } from './Function/GetHoursFunction.js'
import { GetMillisecondsFunction } from './Function/GetMillisecondsFunction.js'
import { GetMinutesFunction } from './Function/GetMinutesFunction.js'
import { GetMonthFunction } from './Function/GetMonthFunction.js'
import { GetSecondsFunction } from './Function/GetSecondsFunction.js'
import { NowFunction } from './Function/NowFunction.js'
import { TimestampFunction } from './Function/TimestampFunction.js'

export class DateTimeExtension implements ExtensionInterface {
  constructor(
    private readonly timezone = 'UTC',
    private readonly defaultFormat = ISO_8601,
  ) {}

  getFunctions(): FunctionInterface[] {
    return [
      new DateFunction(this.timezone, this.defaultFormat),
      new NowFunction(),
      new TimestampFunction(),
      new DurationFunction(),
      new GetSecondsFunction(),
      new GetMinutesFunction(),
      new GetHoursFunction(),
      new GetMillisecondsFunction(),
      new GetFullYearFunction(),
      new GetMonthFunction(),
      new GetDayOfYearFunction(),
      new GetDayOfMonthFunction(),
      new GetDayOfWeekFunction(),
      new GetDateFunction(),
    ]
  }

  getBinaryOperatorOverloads(): BinaryOperatorOverloadInterface[] {
    return []
  }

  getUnaryOperatorOverloads(): UnaryOperatorOverloadInterface[] {
    return []
  }
}
