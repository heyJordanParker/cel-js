import { EvaluationException } from './EvaluationException.js'

export class TypeConversionException extends EvaluationException {
  override name = 'TypeConversionException'
}
