import { IToken } from 'chevrotain';
import { IdentifierDotExpressionCstNode, IndexExpressionCstNode } from './cst-definitions.js';
export declare enum CelType {
    int = "int",
    uint = "uint",
    float = "float",
    string = "string",
    bool = "bool",
    null = "null",
    list = "list",
    map = "map"
}
export declare const isCalculable: (value: unknown) => value is number;
export declare const getCelType: (value: unknown) => CelType;
export declare enum Operations {
    addition = "addition",
    subtraction = "subtraction",
    multiplication = "multiplication",
    division = "division",
    modulo = "modulo",
    logicalAnd = "logicalAnd",
    logicalOr = "logicalOr",
    lessThan = "lessThan",
    lessOrEqualThan = "lessOrEqualThan",
    greaterThan = "greaterThan",
    greaterOrEqualThan = "greaterOrEqualThan",
    equals = "equals",
    notEquals = "notEquals",
    in = "in"
}
export declare const getResult: (operator: IToken, left: unknown, right: unknown) => string | number | boolean | unknown[];
/**
 * Applies unary operators to an operand according to CEL semantics.
 *
 * @param operators - Array of unary operator tokens to apply
 * @param operand - The value to apply the operators to
 * @returns The result of applying the operators to the operand
 * @throws CelTypeError if the operators cannot be applied to the operand type
 */
export declare const getUnaryResult: (operators: IToken[], operand: unknown) => unknown;
export declare const getPosition: (ctx: IdentifierDotExpressionCstNode | IndexExpressionCstNode) => number;
export declare const size: (arr: unknown) => number;
/**
 * Macro definition for the CEL has() function that checks if a path exists in an object.
 *
 * @param path - The path to check for existence
 * @returns boolean - True if the path exists (is not undefined), false otherwise
 *
 * @example
 * has(obj.field) // returns true if field exists on obj
 */
export declare const has: (path: unknown) => boolean;
