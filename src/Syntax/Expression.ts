import type { ListExpression } from './Aggregate/ListExpression.js'
import type { MapExpression } from './Aggregate/MapExpression.js'
import type { MessageExpression } from './Aggregate/MessageExpression.js'
import type { BinaryExpression } from './Binary/BinaryExpression.js'
import type { ConditionalExpression } from './ConditionalExpression.js'
import type { BoolLiteralExpression } from './Literal/BoolLiteralExpression.js'
import type { BytesLiteralExpression } from './Literal/BytesLiteralExpression.js'
import type { FloatLiteralExpression } from './Literal/FloatLiteralExpression.js'
import type { IntegerLiteralExpression } from './Literal/IntegerLiteralExpression.js'
import type { NullLiteralExpression } from './Literal/NullLiteralExpression.js'
import type { StringLiteralExpression } from './Literal/StringLiteralExpression.js'
import type { UnsignedIntegerLiteralExpression } from './Literal/UnsignedIntegerLiteralExpression.js'
import type { CallExpression } from './Member/CallExpression.js'
import type { IdentifierExpression } from './Member/IdentifierExpression.js'
import type { IndexExpression } from './Member/IndexExpression.js'
import type { MemberAccessExpression } from './Member/MemberAccessExpression.js'
import type { ParenthesizedExpression } from './ParenthesizedExpression.js'
import type { UnaryExpression } from './Unary/UnaryExpression.js'

export type LiteralExpression =
  | BoolLiteralExpression
  | BytesLiteralExpression
  | FloatLiteralExpression
  | IntegerLiteralExpression
  | NullLiteralExpression
  | StringLiteralExpression
  | UnsignedIntegerLiteralExpression

export type Expression =
  | LiteralExpression
  | BinaryExpression
  | CallExpression
  | ConditionalExpression
  | IdentifierExpression
  | IndexExpression
  | ListExpression
  | MapExpression
  | MemberAccessExpression
  | MessageExpression
  | ParenthesizedExpression
  | UnaryExpression
