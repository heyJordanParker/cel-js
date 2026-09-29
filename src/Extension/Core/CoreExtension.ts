import type { FunctionInterface } from '../../Function/FunctionInterface.js'
import type { BinaryOperatorOverloadInterface } from '../../Operator/BinaryOperatorOverloadInterface.js'
import type { UnaryOperatorOverloadInterface } from '../../Operator/UnaryOperatorOverloadInterface.js'
import { BinaryOperatorKind } from '../../Syntax/Binary/BinaryOperatorKind.js'
import type { ExtensionInterface } from '../ExtensionInterface.js'
import { AdditionOperator } from './BinaryOperator/AdditionOperator.js'
import { ComparisonOperator } from './BinaryOperator/ComparisonOperator.js'
import { DivisionOperator } from './BinaryOperator/DivisionOperator.js'
import { EqualityOperator } from './BinaryOperator/EqualityOperator.js'
import { InOperator } from './BinaryOperator/InOperator.js'
import { LogicalAndOperator } from './BinaryOperator/LogicalAndOperator.js'
import { LogicalOrOperator } from './BinaryOperator/LogicalOrOperator.js'
import { ModuloOperator } from './BinaryOperator/ModuloOperator.js'
import { MultiplicationOperator } from './BinaryOperator/MultiplicationOperator.js'
import { SubtractionOperator } from './BinaryOperator/SubtractionOperator.js'
import { BoolFunction } from './Function/BoolFunction.js'
import { BytesFunction } from './Function/BytesFunction.js'
import { DoubleFunction } from './Function/DoubleFunction.js'
import { DynFunction } from './Function/DynFunction.js'
import { IntFunction } from './Function/IntFunction.js'
import { SizeFunction } from './Function/SizeFunction.js'
import { StringFunction } from './Function/StringFunction.js'
import { TypeFunction } from './Function/TypeFunction.js'
import { UIntFunction } from './Function/UIntFunction.js'
import { LogicalNotOperator } from './UnaryOperator/LogicalNotOperator.js'
import { NegationOperator } from './UnaryOperator/NegationOperator.js'

export class CoreExtension implements ExtensionInterface {
  getFunctions(): FunctionInterface[] {
    return [
      new IntFunction(),
      new StringFunction(),
      new UIntFunction(),
      new DoubleFunction(),
      new BoolFunction(),
      new SizeFunction(),
      new BytesFunction(),
      new TypeFunction(),
      new DynFunction(),
    ]
  }

  getBinaryOperatorOverloads(): BinaryOperatorOverloadInterface[] {
    return [
      new AdditionOperator(),
      new SubtractionOperator(),
      new MultiplicationOperator(),
      new DivisionOperator(),
      new ModuloOperator(),
      new ComparisonOperator(BinaryOperatorKind.LessThan),
      new ComparisonOperator(BinaryOperatorKind.LessThanOrEqual),
      new ComparisonOperator(BinaryOperatorKind.GreaterThan),
      new ComparisonOperator(BinaryOperatorKind.GreaterThanOrEqual),
      new EqualityOperator(BinaryOperatorKind.Equal),
      new EqualityOperator(BinaryOperatorKind.NotEqual),
      new InOperator(),
      new LogicalAndOperator(),
      new LogicalOrOperator(),
    ]
  }

  getUnaryOperatorOverloads(): UnaryOperatorOverloadInterface[] {
    return [new NegationOperator(), new LogicalNotOperator()]
  }
}
