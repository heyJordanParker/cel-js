import { Exception } from './Exception.js'

export class IncompatibleValueTypeException extends Exception {
  override name = 'IncompatibleValueTypeException'
}
