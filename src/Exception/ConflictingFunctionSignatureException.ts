import { Exception } from './Exception.js'

export class ConflictingFunctionSignatureException extends Exception {
  override name = 'ConflictingFunctionSignatureException'
}
