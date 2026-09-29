# cel-js

> [!NOTE]
> ## 🙋 This project is looking for a new maintainer!
>
> I no longer have the time to actively develop or maintain **cel-js**.
> Rather than archiving it, I'd love to hand it off to someone who can
> take it further.
>
> **Interested?** Open an issue or reach out to me directly. I'm happy
> to transfer the repository to the right person.
>
> If no maintainer is found, this project will be archived in the future.

> [!NOTE]  
> There is also [a great implementation of cel-js](https://github.com/marcbachmann/cel-js) made by @marcbachmann. It has full syntax support and better performance. You may consider it too 🙂

`cel-js` is a parser and evaluator for Google's [Common Expression Language](https://github.com/google/cel-spec) (CEL). It is a file-for-file port of the [`cel-php`](https://github.com/heyJordanParker/cel-php) fork, so an expression gives the same answer in the browser as on a PHP server.

## Features ✨

- 🌍 Isomorphic: Ready for server and browser, with no runtime dependencies
- 📦 ESM support
- 📚 The same language as `cel-php`:
  - Every literal: int, uint, double, bool, string, bytes, list, map, null
  - Every operator, including `??` and null-safe member and index access
  - Optional selection (`a.?b`, `a[?b]`) with `or` and `orValue`
  - The macros `has`, `all`, `exists`, `exists_one`, `existsOne`, `filter`, `map`, `transformList`, `transformMap`, `optMap` and `optFlatMap`
  - The Core, DateTime, String, List and Math extensions, and host functions through `Configuration`
- 🧩 `Template`, for expressions written inside text: `Hello {{ customer.firstName }}`

## Installation

To install `cel-js`, use npm:

```bash
npm i @heyjordanparker/cel-js
```

## Usage

### `evaluate`

`evaluate` parses and runs an expression, and returns its value. Every failure throws an `Exception`.

```ts
import { Configuration, evaluate } from '@heyjordanparker/cel-js'

evaluate('2 + 2 * 2').getRawValue() // => 6

evaluate('user.role == "admin"', { user: { role: 'admin' } }).getRawValue() // => true

const configuration = new Configuration({
  functions: { shout: (text: string) => text.toUpperCase() },
  timezone: 'Europe/Sofia',
  dateFormat: 'M j, Y',
})

evaluate('shout(name)', { name: 'ada' }, configuration).getRawValue() // => 'ADA'
```

### `Parser`

`Parser` reads an expression into its syntax tree, and throws on invalid syntax.

```ts
import { ExpressionKind, Parser } from '@heyjordanparker/cel-js'

new Parser().parse('2 + a').kind // => ExpressionKind.Binary
```

### `Template`

`Template` renders, splits and reads the expressions written inside text.

```ts
import { Template } from '@heyjordanparker/cel-js'

new Template().render('Hi {{ name }}!', { name: 'Ada' }) // => 'Hi Ada!'

Template.parts('Hi {{ name }}!') // => ['Hi ', { code: 'name', raw: false }, '!']

Template.references('offers.map(o, o.price)') // => [['offers'], ['offers', null, 'price']]
```

## Known Issues

Where JavaScript cannot hold what PHP holds, the two engines differ:

- An int is a JavaScript number, so an int past 2^53 loses precision.
- A whole number read from a variable is an int, so data written `4.0` reads as the int `4`. A host that means a double passes a `FloatValue`:

  ```ts
  import { evaluate, FloatValue } from '@heyjordanparker/cel-js'

  evaluate('quantity / 2', { quantity: new FloatValue(5) }).getRawValue() // => 2.5
  ```

- `matches()` runs a JavaScript `RegExp`, not PCRE.
- A span counts string characters, not bytes.
