import { EvaluationException } from './EvaluationException.js'

export class NoSuchTypeException extends EvaluationException {
  override name = 'NoSuchTypeException'
}
