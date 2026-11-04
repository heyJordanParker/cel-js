export enum IssueKind {
  /** The expression reads a variable nothing declares. */
  UndeclaredReference = 'UndeclaredReference',
  /** The expression reads a field its value does not have. */
  UndefinedField = 'UndefinedField',
  /** The expression reads an item of a value that holds no items. */
  NotIndexable = 'NotIndexable',
}

/**
 * One read the checker refused.
 *
 * `path` is the read up to the refusal, written the way the author wrote it,
 * and an item a comprehension walks reads as its collection: `offers.map(o,
 * o.nope)` is refused at `offers`. `name` is the variable or the field that is
 * missing, and is empty for NotIndexable.
 */
export class Issue {
  constructor(
    readonly kind: IssueKind,
    readonly path: string,
    readonly name: string,
  ) {}
}
