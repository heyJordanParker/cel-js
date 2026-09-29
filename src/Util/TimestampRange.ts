export const MIN_SECONDS = -62_135_596_800n

export const MAX_SECONDS = 253_402_300_799n

export function isValidSeconds(seconds: bigint): boolean {
  return seconds >= MIN_SECONDS && seconds <= MAX_SECONDS
}
