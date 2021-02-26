Pegparse
========

[![Build Status](https://travis-ci.org/s-leroux/Pegparse.png?branch=master)](https://travis-ci.org/s-leroux/Pegparse)

A PEG parser for node.

Usage
=====

Pegparse is a _Parsing Expression Grammar_ (PEG) implementation for JavaScript.
It will build a datastructure from an input stream and a grammar.

To work, Pegparse needs three things:

1. A formal grammar describing the syntax of the input data;
2. Some rules to convert the input data into meaningful data structures for your application;
3. The input data to process.


Defining the grammar
--------------------

You construct the grammar using the functions exported from `lib/grammar.js`.
For example, to parse a comma separated value (CSV) file, you could write the
following grammar:

```
    const grammar = new peg.Grammar();

    // CSV stands for comma separated values. Our data are
    // separated by a comma. The "data" rule is defined
    // later.
    grammar.define("S",
      [ peg.rule("data"), peg.zeroOrMore(peg.consume(","), peg.rule("data")) ]
    );

    // The "data" are either quoted strings or row values
    grammar.define("data",
      peg.choice(
        peg.rule("quoted-string"),
        peg.rule("value"),
      ),
    );

    // a value is a string of _any character_ which is _not_ the comma
    grammar.define("value",
      peg.zeroOrMore(peg.not(","), peg.any()),
    )

    // A quoted string is zero or more characters which are not a quote,
    // enclosed between quotes.
    grammar.define("quoted-string",
      [ peg.consume("\""), peg.zeroOrMore(peg.not("\""), peg.any()), peg.consume("\"") ],
    )
```

Running the parser
------------------

One you have the grammar, you can obtain a parser the will build a data structure
from your input data, according to the rules defined in the grammar. The only thing
the parser has to know, is where to start:

```
    const parser = grammar.parser("S"); // get a parser ready to start at state "S"
```

Now, we pass some data to the parser and let it _run_ until completion:

```
    parser.accept("Here,are,\"some,CSV\",data");
    parser.run();
```

Finally, here is the result:

```
    assert.equal(parser.status, "success");
    assert.deepEqual(
      parser.result(),
        [
          [ [ "H", "e", "r", "e", ], ],
          [ [ "a", "r", "e", ], ],
          [ [ "s", "o", "m", "e", ",", "C", "S", "V", ] ],
          [ [ "d", "a", "t", "a", ], ]
        ]
    );
```

As you can see, by default the parser returns the data in nested array. These nested array
forms a tree-like structure whose leaves are the indivisual characters. Each rule traversed
during the parsing has created a new node in the tree. In other words, each time some input
match a rule, the corresponding data are packed into a new array. Great. But not
very practical. In particular, we've lost the semantic informations during the
process: we can't know which sub-tree match which rule.

Custom actions
--------------

The default action when reducing a rule is to pack all the nested data into an array.
Most of the time you want something more specific than that. In particular,
we would like to create strings instead of manipulating individual characters.

You instruct Pegparse to use a custom reduction action by passing a JavaScript function
as an extra parameter to the `define()` call:

```
    // a value is a string of _any character_ which is _not_ the coma
    grammar.define("value",
      peg.zeroOrMore(peg.not(","), peg.any()),
      function(...letters) {
        return letters.join("");
      }
    )

    // A quoted string is zero or characters which are not a quote,
    // enclosed between quotes.
    grammar.define("quoted-string",
      [ peg.consume("\""), peg.zeroOrMore(peg.not("\""), peg.any()), peg.consume("\"") ],
      function(...letters) {
        return letters.join("");
      }
    )
```

Now, insteat of creating an array of characters, Pegparse will now create a string when
reducing the _value_ and _quoted-string_ rules.

The result of parsing the test string is now:

```
        [ [ 'Here' ] , [ 'are' ], [ 'some,CSV' ] , [ 'data' ] ]
```

It's much better. But we still have one extra level of nesting caused by the
_data_ rule reduction. We can fix that easily:

```

    // The "data" are either quoted strings or a row value
    grammar.define("data",
      peg.choice(
        peg.rule("quoted-string"),
        peg.rule("value"),
      ),
      function(value) { return value; }
    );
```

Which leads to:

```
        [ 'Here', 'are', 'some,CSV', 'data' ]
```

Please take a look at the examples found in the `text/examples` folder for more informations.

API Reference
=============

See [docs/api.md](./docs/api.md)

Resources
=========

* http://www.inf.puc-rio.br/%7Eroberto/docs/peg.pdf
* http://www.inf.puc-rio.br/%7Eroberto/docs/ry10-01.pdf

License
=======

Brought to you under the terms of the GPLv3.0 or later license.

Copyright (c) 2021 Sylvain Leroux

