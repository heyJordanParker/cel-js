import { tokenMatcher } from 'chevrotain';
import { Division, Equals, GreaterOrEqualThan, GreaterThan, In, LessOrEqualThan, LessThan, LogicalAndOperator, LogicalNotOperator, LogicalOrOperator, Minus, Modulo, MultiplicationToken, NotEquals, Plus, } from './tokens.js';
import { CelTypeError } from './errors/CelTypeError.js';
import { CelEvaluationError } from './errors/CelEvaluationError.js';
import { equals } from 'ramda';
export var CelType;
(function (CelType) {
    CelType["int"] = "int";
    CelType["uint"] = "uint";
    CelType["float"] = "float";
    CelType["string"] = "string";
    CelType["bool"] = "bool";
    CelType["null"] = "null";
    CelType["list"] = "list";
    CelType["map"] = "map";
})(CelType || (CelType = {}));
const calculableTypes = [CelType.int, CelType.uint, CelType.float];
export const isCalculable = (value) => {
    const type = getCelType(value);
    return calculableTypes.includes(type);
};
const isInt = (value) => getCelType(value) === CelType.int;
const isUint = (value) => getCelType(value) === CelType.uint;
const isString = (value) => getCelType(value) === CelType.string;
const isArray = (value) => getCelType(value) === CelType.list;
const isBoolean = (value) => getCelType(value) === CelType.bool;
const isMap = (value) => getCelType(value) === CelType.map;
export const getCelType = (value) => {
    if (value === null) {
        return CelType.null;
    }
    if (typeof value === 'number') {
        if (Number.isInteger(value) && value >= 0) {
            return CelType.uint;
        }
        if (Number.isInteger(value) && value <= 0) {
            return CelType.int;
        }
        if (value % 1) {
            return CelType.float;
        }
        throw new Error(`Unknown number type: ${value}`);
    }
    if (typeof value === 'string') {
        return CelType.string;
    }
    if (typeof value === 'boolean') {
        return CelType.bool;
    }
    if (Array.isArray(value)) {
        return CelType.list;
    }
    if (typeof value === 'object') {
        return CelType.map;
    }
    throw new Error(`Unknown type: ${typeof value}`);
};
export var Operations;
(function (Operations) {
    Operations["addition"] = "addition";
    Operations["subtraction"] = "subtraction";
    Operations["multiplication"] = "multiplication";
    Operations["division"] = "division";
    Operations["modulo"] = "modulo";
    Operations["logicalAnd"] = "logicalAnd";
    Operations["logicalOr"] = "logicalOr";
    Operations["lessThan"] = "lessThan";
    Operations["lessOrEqualThan"] = "lessOrEqualThan";
    Operations["greaterThan"] = "greaterThan";
    Operations["greaterOrEqualThan"] = "greaterOrEqualThan";
    Operations["equals"] = "equals";
    Operations["notEquals"] = "notEquals";
    Operations["in"] = "in";
})(Operations || (Operations = {}));
const additionOperation = (left, right) => {
    if (isCalculable(left) && isCalculable(right)) {
        return left + right;
    }
    if (isString(left) && isString(right)) {
        return left + right;
    }
    if (isArray(left) && isArray(right)) {
        if (left.length !== 0 &&
            right.length !== 0 &&
            typeof left[0] !== typeof right[0]) {
            throw new CelTypeError(Operations.addition, left[0], right[0]);
        }
        return [...left, ...right];
    }
    throw new CelTypeError(Operations.addition, left, right);
};
const subtractionOperation = (left, right) => {
    if (isCalculable(left) && isCalculable(right)) {
        return left - right;
    }
    throw new CelTypeError(Operations.subtraction, left, right);
};
const multiplicationOperation = (left, right) => {
    if (isCalculable(left) && isCalculable(right)) {
        return left * right;
    }
    throw new CelTypeError(Operations.multiplication, left, right);
};
const divisionOperation = (left, right) => {
    if (right === 0) {
        throw new CelEvaluationError('Division by zero');
    }
    // CEL does not support float division
    if ((isInt(left) || isUint(left)) && (isInt(right) || isUint(right))) {
        return left / right;
    }
    throw new CelTypeError(Operations.division, left, right);
};
const moduloOperation = (left, right) => {
    if (right === 0) {
        throw new CelEvaluationError('Modulus by zero');
    }
    // CEL does not support float modulus
    if ((isInt(left) || isUint(left)) && (isInt(right) || isUint(right))) {
        return left % right;
    }
    throw new CelTypeError(Operations.modulo, left, right);
};
const logicalAndOperation = (left, right) => {
    if (isBoolean(left) && isBoolean(right)) {
        return left && right;
    }
    throw new CelTypeError(Operations.logicalAnd, left, right);
};
const logicalOrOperation = (left, right) => {
    if (isBoolean(left) && isBoolean(right)) {
        return left || right;
    }
    throw new CelTypeError(Operations.logicalOr, left, right);
};
const comparisonInOperation = (left, right) => {
    if (isArray(right)) {
        return right.includes(left);
    }
    if (isMap(right)) {
        return Object.keys(right).includes(left);
    }
    throw new CelTypeError(Operations.in, left, right);
};
const comparisonOperation = (operation, left, right) => {
    if ((isCalculable(left) && isCalculable(right)) ||
        (isString(left) && isString(right))) {
        switch (operation) {
            case Operations.lessThan:
                return left < right;
            case Operations.lessOrEqualThan:
                return left <= right;
            case Operations.greaterThan:
                return left > right;
            case Operations.greaterOrEqualThan:
                return left >= right;
        }
    }
    if (operation === Operations.equals) {
        return equals(left, right);
    }
    if (operation === Operations.notEquals) {
        return !equals(left, right);
    }
    if (operation === Operations.in) {
        return comparisonInOperation(left, right);
    }
    throw new CelTypeError(operation, left, right);
};
export const getResult = (operator, left, right) => {
    switch (true) {
        case tokenMatcher(operator, Plus):
            return additionOperation(left, right);
        case tokenMatcher(operator, Minus):
            return subtractionOperation(left, right);
        case tokenMatcher(operator, MultiplicationToken):
            return multiplicationOperation(left, right);
        case tokenMatcher(operator, Division):
            return divisionOperation(left, right);
        case tokenMatcher(operator, Modulo):
            return moduloOperation(left, right);
        case tokenMatcher(operator, LogicalAndOperator):
            return logicalAndOperation(left, right);
        case tokenMatcher(operator, LogicalOrOperator):
            return logicalOrOperation(left, right);
        case tokenMatcher(operator, LessThan):
            return comparisonOperation(Operations.lessThan, left, right);
        case tokenMatcher(operator, LessOrEqualThan):
            return comparisonOperation(Operations.lessOrEqualThan, left, right);
        case tokenMatcher(operator, GreaterThan):
            return comparisonOperation(Operations.greaterThan, left, right);
        case tokenMatcher(operator, GreaterOrEqualThan):
            return comparisonOperation(Operations.greaterOrEqualThan, left, right);
        case tokenMatcher(operator, Equals):
            return comparisonOperation(Operations.equals, left, right);
        case tokenMatcher(operator, NotEquals):
            return comparisonOperation(Operations.notEquals, left, right);
        case tokenMatcher(operator, In):
            return comparisonOperation(Operations.in, left, right);
        default:
            throw new Error('Operator not recognized');
    }
};
/**
 * Handles logical negation for a value.
 *
 * @param operand The value to negate
 * @param isEvenOperators Whether there's an even number of operators (affects result)
 * @returns Negated value
 */
function handleLogicalNegation(operand, isEvenOperators) {
    if (operand === null) {
        return !isEvenOperators; // Odd number gives true, even gives false
    }
    if (!isBoolean(operand)) {
        throw new CelTypeError('logical negation', operand, null);
    }
    return isEvenOperators ? operand : !operand;
}
/**
 * Handles arithmetic negation for a value.
 *
 * @param operand The value to negate
 * @param isEvenOperators Whether there's an even number of operators (affects result)
 * @returns Negated value
 */
function handleArithmeticNegation(operand, isEvenOperators) {
    if (!isCalculable(operand)) {
        throw new CelTypeError('arithmetic negation', operand, null);
    }
    // Handle -0 edge case by returning +0
    if (!isEvenOperators && operand === 0) {
        return 0;
    }
    return isEvenOperators ? operand : -operand;
}
/**
 * Applies unary operators to an operand according to CEL semantics.
 *
 * @param operators - Array of unary operator tokens to apply
 * @param operand - The value to apply the operators to
 * @returns The result of applying the operators to the operand
 * @throws CelTypeError if the operators cannot be applied to the operand type
 */
export const getUnaryResult = (operators, operand) => {
    // If no operators, return the operand unchanged
    if (operators.length === 0) {
        return operand;
    }
    const isEvenOperators = operators.length % 2 === 0;
    // Check if all operators are logical negation
    if (operators.every((op) => tokenMatcher(op, LogicalNotOperator))) {
        return handleLogicalNegation(operand, isEvenOperators);
    }
    // Check if all operators are arithmetic negation
    if (operators.every((op) => tokenMatcher(op, Minus))) {
        return handleArithmeticNegation(operand, isEvenOperators);
    }
    // Mixed or unsupported operators
    throw new CelTypeError('unary operation', operand, null);
};
export const getPosition = (ctx) => {
    if (ctx.name === 'identifierDotExpression') {
        return ctx.children.Dot[0].startOffset;
    }
    return ctx.children.OpenBracket[0].startOffset;
};
export const size = (arr) => {
    if (isString(arr) || isArray(arr)) {
        return arr.length;
    }
    if (isMap(arr)) {
        return Object.keys(arr).length;
    }
    throw new CelEvaluationError(`invalid_argument: ${arr}`);
};
/**
 * Macro definition for the CEL has() function that checks if a path exists in an object.
 *
 * @param path - The path to check for existence
 * @returns boolean - True if the path exists (is not undefined), false otherwise
 *
 * @example
 * has(obj.field) // returns true if field exists on obj
 */
export const has = (path) => {
    // If the path itself is undefined, it means the field/index doesn't exist
    return path !== undefined;
};
