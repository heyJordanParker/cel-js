import { EvaluationException } from '../../../Exception/EvaluationException.js'
import { TypeConversionException } from '../../../Exception/TypeConversionException.js'
import type { FunctionInterface, FunctionOverloadHandler } from '../../../Function/FunctionInterface.js'
import { get } from '../../../Util/ArgumentsUtil.js'
import { DurationValue } from '../../../Value/DurationValue.js'
import { StringValue } from '../../../Value/StringValue.js'
import { NANOS_PER_SECOND } from '../../../Value/TimestampValue.js'
import { ValueKind } from '../../../Value/ValueKind.js'

const unit = (digits: string, suffix: string): string => `(?:(${digits})${suffix})?`

const DURATION = new RegExp(
  `^([+-])?${unit('\\d+', 'h')}${unit('\\d+', 'm')}${unit('\\d+(?:\\.\\d*)?', 's')}` +
    `${unit('\\d+', 'ms')}${unit('\\d+', 'us')}${unit('\\d+', 'ns')}$`,
)

const MAX_SECONDS = 315_576_000_000n

export class DurationFunction implements FunctionInterface {
  getName(): string {
    return 'duration'
  }

  *getOverloads(): Iterable<[ValueKind[], FunctionOverloadHandler]> {
    yield [
      [ValueKind.String],
      (call, args) => {
        const text = get(args, 0, StringValue).value
        const match = DURATION.exec(text)
        if (match === null) {
          throw new TypeConversionException(`Invalid duration format: "${text}"`, call.getSpan())
        }

        const seconds = parseFloat(match[4] ?? '0')
        const whole = Math.trunc(seconds)
        const nanoseconds =
          BigInt(Math.trunc((seconds - whole) * 1_000_000_000)) +
          BigInt(match[5] ?? 0) * 1_000_000n +
          BigInt(match[6] ?? 0) * 1_000n +
          BigInt(match[7] ?? 0)

        const magnitude =
          (BigInt(match[2] ?? 0) * 3600n + BigInt(match[3] ?? 0) * 60n + BigInt(whole)) * NANOS_PER_SECOND +
          nanoseconds
        const total = match[1] === '-' ? -magnitude : magnitude

        const totalSeconds = total / NANOS_PER_SECOND
        if ((totalSeconds < 0n ? -totalSeconds : totalSeconds) > MAX_SECONDS) {
          throw new EvaluationException(`Duration "${text}" is outside the valid range.`, call.getSpan())
        }

        return new DurationValue(total)
      },
    ]
    yield [[ValueKind.Duration], (_, args) => get(args, 0, DurationValue)]
  }
}
