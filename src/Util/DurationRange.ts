import { NANOS_PER_SECOND } from '../Value/TimestampValue.js'

export const MAX_SECONDS = 9_223_372_036n

export function isValid(nanoseconds: bigint): boolean {
  const seconds = nanoseconds / NANOS_PER_SECOND
  return (seconds < 0n ? -seconds : seconds) <= MAX_SECONDS
}
