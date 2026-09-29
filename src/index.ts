export { Exception } from './Exception/Exception.js'
export { evaluate } from './functions.js'
export { Parser } from './Parser/Parser.js'
export { Configuration, type ConfigurationOptions } from './Runtime/Configuration.js'
export type { Expression } from './Syntax/Expression.js'
export { ExpressionKind } from './Syntax/ExpressionKind.js'
export { BinaryOperatorKind } from './Syntax/Binary/BinaryOperatorKind.js'
export { UnaryOperatorKind } from './Syntax/Unary/UnaryOperatorKind.js'
export {
  Template,
  type Fragment,
  type Part,
  type Reference,
  type Segment,
  type TemplateOptions,
} from './Template/Template.js'
export { FloatValue } from './Value/FloatValue.js'
export type { Value } from './Value/Value.js'
export {
  detectQuery,
  findSpans,
  type DetectOptions,
  type OpenQuery,
  type Opener,
  type Span,
  type SpanValidator,
  type SpanVerdict,
} from './detect.js'
