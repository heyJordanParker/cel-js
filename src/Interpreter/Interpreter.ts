import type { Environment } from '../Environment/Environment.js'
import { InvalidConditionTypeException } from '../Exception/InvalidConditionTypeException.js'
import { InvalidOptionalConstructionException } from '../Exception/InvalidOptionalConstructionException.js'
import { MessageConstructionException } from '../Exception/MessageConstructionException.js'
import { NoSuchFunctionException } from '../Exception/NoSuchFunctionException.js'
import { NoSuchOverloadException } from '../Exception/NoSuchOverloadException.js'
import { NoSuchTypeException } from '../Exception/NoSuchTypeException.js'
import { NoSuchVariableException } from '../Exception/NoSuchVariableException.js'
import { UnexpectedMapKeyTypeException } from '../Exception/UnexpectedMapKeyTypeException.js'
import type { Configuration } from '../Runtime/Configuration.js'
import type { OperationRegistry } from '../Runtime/OperationRegistry.js'
import type { Span } from '../Span/Span.js'
import { ListExpression } from '../Syntax/Aggregate/ListExpression.js'
import { MapExpression } from '../Syntax/Aggregate/MapExpression.js'
import { MessageExpression } from '../Syntax/Aggregate/MessageExpression.js'
import { BinaryExpression } from '../Syntax/Binary/BinaryExpression.js'
import { BinaryOperatorKind } from '../Syntax/Binary/BinaryOperatorKind.js'
import { ConditionalExpression } from '../Syntax/ConditionalExpression.js'
import type { Expression } from '../Syntax/Expression.js'
import { ExpressionKind } from '../Syntax/ExpressionKind.js'
import { BoolLiteralExpression } from '../Syntax/Literal/BoolLiteralExpression.js'
import { CallExpression } from '../Syntax/Member/CallExpression.js'
import { IdentifierExpression } from '../Syntax/Member/IdentifierExpression.js'
import { IndexExpression } from '../Syntax/Member/IndexExpression.js'
import { MemberAccessExpression } from '../Syntax/Member/MemberAccessExpression.js'
import { UnaryExpression } from '../Syntax/Unary/UnaryExpression.js'
import { isKeyType, resolve, resolveIndex, stringKey } from '../Util/MapKeyUtil.js'
import { BooleanValue } from '../Value/BooleanValue.js'
import { BytesValue } from '../Value/BytesValue.js'
import { FloatValue } from '../Value/FloatValue.js'
import { IntegerValue } from '../Value/IntegerValue.js'
import { ListValue } from '../Value/ListValue.js'
import { MapValue } from '../Value/MapValue.js'
import { NullValue } from '../Value/NullValue.js'
import { OptionalValue } from '../Value/OptionalValue.js'
import { StringValue } from '../Value/StringValue.js'
import { TypeValue } from '../Value/TypeValue.js'
import { UnsignedIntegerValue } from '../Value/UnsignedIntegerValue.js'
import type { Value } from '../Value/Value.js'
import { allowedFields, construct } from '../Value/WellKnownType.js'
import type { MacroContextInterface } from './Macro/MacroContextInterface.js'
import type { MacroRegistry } from './Macro/MacroRegistry.js'

function noOverload(expression: BinaryExpression, left: Value, right: Value): NoSuchOverloadException {
  return new NoSuchOverloadException(
    `No such overload for \`${left.getType()}\` ${expression.operator.kind} \`${right.getType()}\``,
    expression.left.getSpan().join(expression.right.getSpan()),
  )
}

function isNullOrEmpty(value: Value): boolean {
  return (
    value instanceof NullValue ||
    (value instanceof StringValue && value.value === '') ||
    (value instanceof ListValue && value.value.length === 0) ||
    (value instanceof MapValue && value.value.size === 0)
  )
}

export class Interpreter implements MacroContextInterface {
  private readonly macroRegistry: MacroRegistry
  private readonly rootEnvironment: Environment

  constructor(
    configuration: Configuration,
    private readonly registry: OperationRegistry,
    private environment: Environment,
  ) {
    this.macroRegistry = configuration.getMacroRegistry()
    this.rootEnvironment = environment
  }

  getEnvironment(): Environment {
    return this.environment
  }

  evaluate(expression: Expression): Value {
    return this.run(expression)
  }

  withEnvironment<T>(environment: Environment, callback: () => T): T {
    const previous = this.environment
    this.environment = environment
    try {
      return callback()
    } finally {
      this.environment = previous
    }
  }

  run(expression: Expression): Value {
    switch (expression.kind) {
      case ExpressionKind.Parenthesized:
        return this.run(expression.expression)
      case ExpressionKind.List:
        return this.list(expression)
      case ExpressionKind.Map:
        return this.map(expression)
      case ExpressionKind.Unary:
        return this.unary(expression)
      case ExpressionKind.Binary:
        return this.binary(expression)
      case ExpressionKind.Conditional:
        return this.conditional(expression)
      case ExpressionKind.MemberAccess:
        return this.memberAccess(expression)
      case ExpressionKind.Index:
        return this.index(expression)
      case ExpressionKind.Identifier:
        return this.identifier(expression)
      case ExpressionKind.Call:
        return this.call(expression)
      case ExpressionKind.Message:
        return this.message(expression)
      case ExpressionKind.BoolLiteral:
        return new BooleanValue(expression.value)
      case ExpressionKind.BytesLiteral:
        return new BytesValue(expression.value)
      case ExpressionKind.FloatLiteral:
        return new FloatValue(expression.value)
      case ExpressionKind.IntLiteral:
        return new IntegerValue(expression.value)
      case ExpressionKind.NullLiteral:
        return new NullValue()
      case ExpressionKind.StringLiteral:
        return new StringValue(expression.value)
      case ExpressionKind.UIntLiteral:
        return new UnsignedIntegerValue(expression.value)
    }
  }

  private list(expression: ListExpression): Value {
    const values: Value[] = []
    for (const element of expression.elements.elements) {
      const value = this.run(element.value)

      if (!element.isOptional()) {
        values.push(value)
        continue
      }

      if (!(value instanceof OptionalValue)) {
        throw new InvalidOptionalConstructionException(
          `Optional list element requires an optional value, got \`${value.getType()}\``,
          element.question!.join(element.value.getSpan()),
        )
      }

      if (value.value !== null) {
        values.push(value.value)
      }
    }

    return new ListValue(values)
  }

  private map(expression: MapExpression): Value {
    const values = new Map<string, Value>()
    for (const entry of expression.entries.elements) {
      const key = this.run(entry.key)
      const mapKey =
        key instanceof StringValue ||
        key instanceof IntegerValue ||
        key instanceof UnsignedIntegerValue ||
        key instanceof BooleanValue
          ? resolve(key)
          : null

      if (mapKey === null) {
        throw new UnexpectedMapKeyTypeException(
          `Map keys must be bool, int, uint, or string, got \`${key.getType()}\``,
          entry.key.getSpan(),
        )
      }

      const value = this.run(entry.value)

      if (!entry.isOptional()) {
        values.set(mapKey, value)
        continue
      }

      if (!(value instanceof OptionalValue)) {
        throw new InvalidOptionalConstructionException(
          `Optional map entry requires an optional value, got \`${value.getType()}\``,
          entry.value.getSpan(),
        )
      }

      if (value.value !== null) {
        values.set(mapKey, value.value)
      }
    }

    return new MapValue(values)
  }

  private unary(expression: UnaryExpression): Value {
    const operand = this.run(expression.operand)

    const handler = this.registry.getUnaryOperator(expression.operator.kind, operand.getKind())
    if (handler === null) {
      throw new NoSuchOverloadException(
        `No such overload for ${expression.operator.kind}\`${operand.getType()}\``,
        expression.getSpan(),
      )
    }

    return handler(expression, operand)
  }

  private binary(expression: BinaryExpression): Value {
    const operator = expression.operator.kind

    if (operator === BinaryOperatorKind.Coalesce) {
      const left = this.run(expression.left)
      return isNullOrEmpty(left) ? this.run(expression.right) : left
    }

    if (operator === BinaryOperatorKind.And || operator === BinaryOperatorKind.Or) {
      const absorbing = operator === BinaryOperatorKind.Or

      if (
        (expression.left instanceof BoolLiteralExpression && expression.left.value === absorbing) ||
        (expression.right instanceof BoolLiteralExpression && expression.right.value === absorbing)
      ) {
        return new BooleanValue(absorbing)
      }

      const left = this.run(expression.left)
      if (left instanceof BooleanValue && left.value === absorbing) {
        return new BooleanValue(absorbing)
      }

      const right = this.run(expression.right)
      const handler = this.registry.getBinaryOperator(operator, left.getKind(), right.getKind())
      if (handler === null) {
        throw noOverload(expression, left, right)
      }

      return handler(expression, left, right)
    }

    const left = this.run(expression.left)
    const right = this.run(expression.right)

    const handler = this.registry.getBinaryOperator(operator, left.getKind(), right.getKind())
    if (handler === null) {
      throw noOverload(expression, left, right)
    }

    return handler(expression, left, right)
  }

  private conditional(expression: ConditionalExpression): Value {
    const condition = this.run(expression.condition)
    if (!(condition instanceof BooleanValue)) {
      throw new InvalidConditionTypeException(
        `Condition must be boolean, got \`${condition.getType()}\``,
        expression.condition.getSpan(),
      )
    }

    return condition.value ? this.run(expression.then) : this.run(expression.else)
  }

  private memberAccess(expression: MemberAccessExpression): Value {
    const qualified = this.resolveQualifiedChain(expression)
    if (qualified !== null) {
      return qualified
    }

    const operand = this.run(expression.operand)
    const field = expression.field.name

    if (operand instanceof OptionalValue) {
      return operand.value === null
        ? OptionalValue.none()
        : this.optionalSelect(operand.value, field, expression.getSpan())
    }

    if (expression.isOptional()) {
      return this.optionalSelect(operand, field, expression.getSpan())
    }

    return this.selectField(operand, field, expression.getSpan())
  }

  private selectField(operand: Value, field: string, span: Span): Value {
    if (operand instanceof NullValue) {
      return new NullValue()
    }

    if (operand instanceof MapValue) {
      return operand.get(stringKey(field)) ?? new NullValue()
    }

    throw new NoSuchOverloadException(
      `Cannot access member \`${field}\` on type \`${operand.getType()}\``,
      span,
    )
  }

  private resolveQualifiedChain(expression: MemberAccessExpression): Value | null {
    const fields: string[] = []
    let current: Expression = expression
    while (current instanceof MemberAccessExpression) {
      if (current.question !== null) {
        return null
      }

      fields.push(current.field.name)
      current = current.operand
    }

    if (!(current instanceof IdentifierExpression)) {
      return null
    }

    const segments = [current.identifier.name, ...fields.reverse()]

    if (current.leadingDot !== null) {
      const resolved = this.resolveQualifiedSegments(segments, this.rootEnvironment, expression.getSpan())
      if (resolved !== null) {
        return resolved
      }

      throw new NoSuchVariableException(
        `Variable \`${segments.join('.')}\` is not defined in the environment`,
        expression.getSpan(),
      )
    }

    if (this.environment.getVariable(segments[0]) !== null) {
      return null
    }

    return this.resolveQualifiedSegments(segments, this.environment, expression.getSpan())
  }

  private resolveQualifiedSegments(segments: string[], environment: Environment, span: Span): Value | null {
    for (let length = segments.length; length >= 1; length--) {
      const name = segments.slice(0, length).join('.')
      let base: Value | null = environment.getVariable(name) ?? TypeValue.denotation(name)
      if (base === null) {
        continue
      }

      for (const field of segments.slice(length)) {
        base = this.selectField(base, field, span)
      }

      return base
    }

    return null
  }

  private optionalSelect(base: Value, field: string, span: Span): OptionalValue {
    if (base instanceof MapValue) {
      const value = base.get(stringKey(field))
      return value === null ? OptionalValue.none() : OptionalValue.of(value)
    }

    throw new NoSuchOverloadException(
      `Cannot access member \`${field}\` on type \`${base.getType()}\``,
      span,
    )
  }

  private index(expression: IndexExpression): Value {
    const operand = this.run(expression.operand)

    if (operand instanceof OptionalValue) {
      return operand.value === null
        ? OptionalValue.none()
        : this.optionalIndex(operand.value, this.run(expression.index), expression)
    }

    if (expression.isOptional()) {
      return this.optionalIndex(operand, this.run(expression.index), expression)
    }

    if (operand instanceof NullValue) {
      return new NullValue()
    }

    if (!(operand instanceof ListValue) && !(operand instanceof MapValue)) {
      throw new NoSuchOverloadException(
        `Indexing is only supported on lists, maps, and messages, got \`${operand.getType()}\``,
        expression.getSpan(),
      )
    }

    const index = this.run(expression.index)

    if (operand instanceof MapValue) {
      return this.mapGet(operand, index, expression.index.getSpan()) ?? new NullValue()
    }

    return operand.value[this.listPosition(index, expression)] ?? new NullValue()
  }

  private listPosition(index: Value, expression: IndexExpression): number {
    const position = resolveIndex(index)
    if (position === null) {
      throw new NoSuchOverloadException(
        `List indices must be an integer or integral double, got \`${index.getType()}\``,
        expression.index.getSpan(),
      )
    }

    return position
  }

  private optionalIndex(base: Value, index: Value, expression: IndexExpression): OptionalValue {
    if (base instanceof ListValue) {
      const value = base.value[this.listPosition(index, expression)]
      return value === undefined ? OptionalValue.none() : OptionalValue.of(value)
    }

    if (base instanceof MapValue) {
      const value = this.mapGet(base, index, expression.index.getSpan())
      return value === null ? OptionalValue.none() : OptionalValue.of(value)
    }

    throw new NoSuchOverloadException(
      `Indexing is only supported on lists, maps, and messages, got \`${base.getType()}\``,
      expression.getSpan(),
    )
  }

  private mapGet(map: MapValue, index: Value, indexSpan: Span): Value | null {
    if (!isKeyType(index)) {
      throw new NoSuchOverloadException(
        `Map keys must be bool, string, integer, unsigned integer, or double, got \`${index.getType()}\``,
        indexSpan,
      )
    }

    const key = resolve(index)
    return key === null ? null : map.get(key)
  }

  private identifier(expression: IdentifierExpression): Value {
    const name = expression.identifier.name
    const environment = expression.leadingDot !== null ? this.rootEnvironment : this.environment

    const value = environment.getVariable(name) ?? TypeValue.denotation(name)
    if (value !== null) {
      return value
    }

    throw new NoSuchVariableException(
      `Variable \`${name}\` is not defined in the environment`,
      expression.getSpan(),
    )
  }

  private message(expression: MessageExpression): Value {
    const typename = [expression.selector, ...expression.followingSelectors.elements]
      .map((selector) => selector.name)
      .join('.')

    const fieldNames = allowedFields(typename)
    if (fieldNames === null) {
      throw new NoSuchTypeException(
        `Message type \`${typename}\` does not exist or is not allowed per configuration.`,
        expression.getSpan(),
      )
    }

    const fields = new Map<string, Value>()
    for (const initializer of expression.initializers.elements) {
      const name = initializer.field.name
      if (!fieldNames.includes(name)) {
        throw new MessageConstructionException(
          `Field \`${name}\` is not defined on message type \`${typename}\`.`,
          initializer.field.span,
        )
      }

      fields.set(name, this.run(initializer.value))
    }

    return construct(typename, fields)!
  }

  private call(expression: CallExpression): Value {
    const macro = this.macroRegistry.tryExecute(expression, this)
    if (macro !== null) {
      return macro
    }

    const args: Value[] = []
    if (expression.target !== null) {
      args.push(this.run(expression.target))
    }

    for (const argument of expression.arguments.elements) {
      args.push(this.run(argument))
    }

    const handler = this.registry.getFunction(expression.function.name, args)
    if (handler !== null) {
      return handler(expression, args)
    }

    const signatures = this.registry.getFunctionSignatures(expression.function.name)
    if (signatures === null) {
      throw new NoSuchFunctionException(
        `Function \`${expression.function.name}\` is not defined`,
        expression.getSpan(),
      )
    }

    throw NoSuchOverloadException.forCall(
      expression,
      signatures,
      args.map((arg) => arg.getKind()),
    )
  }
}
