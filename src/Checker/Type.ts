export enum TypeKind {
  /** Any value. A read through it is never refused, CEL's gradual typing. */
  Dyn = 'Dyn',
  /** A value with no members and no items, such as a string or a number. */
  Scalar = 'Scalar',
  /** Items in order, read by position. */
  List = 'List',
  /** Values by key, read by any key. */
  Map = 'Map',
  /** Fields by name, read only by a name its TypeProvider declares. */
  Object = 'Object',
  /** One of several types. A read passes when any of them admits it. */
  Union = 'Union',
}

/**
 * The type a variable is declared as, or a part of an expression produces.
 *
 * An object type is a name. Its fields come from the TypeProvider the checker
 * is given, so a type that refers to itself, such as an order whose customer
 * holds orders, stays finite.
 */
export class Type {
  private constructor(
    readonly kind: TypeKind,
    readonly name: string = '',
    readonly element: Type | null = null,
    readonly members: Type[] = [],
  ) {}

  static dyn(): Type {
    return new Type(TypeKind.Dyn)
  }

  static scalar(name: string): Type {
    return new Type(TypeKind.Scalar, name)
  }

  static list(element: Type): Type {
    return new Type(TypeKind.List, '', element)
  }

  static map(value: Type): Type {
    return new Type(TypeKind.Map, '', value)
  }

  static object(name: string): Type {
    return new Type(TypeKind.Object, name)
  }

  /**
   * One of several types. A single member is that member, and a dyn member
   * makes the whole union dyn, because dyn already admits every read.
   */
  static union(members: [Type, ...Type[]]): Type {
    const dyn = members.find((member) => member.kind === TypeKind.Dyn)
    if (dyn !== undefined) {
      return dyn
    }

    return members.length === 1
      ? members[0]
      : new Type(TypeKind.Union, '', null, members)
  }
}
