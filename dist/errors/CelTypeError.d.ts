import { Operations } from '../helper.js';
export declare class CelTypeError extends Error {
    /**
     * Creates a new CelTypeError for type incompatibilities in operations.
     *
     * @param operation - The operation being performed
     * @param left - The left operand value
     * @param right - The right operand value or null for unary operations
     * @param customMessage - Optional custom error message to use instead of the default
     */
    constructor(operation: Operations | string, left: unknown, right: unknown);
}
