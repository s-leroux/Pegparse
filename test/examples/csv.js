/* Pegparse - A PEG engine for Node.js
 * Copyright (c) 2021 Sylvain Leroux
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

const peg = require("../../lib/grammar.js");
const assert = require("chai").assert;

describe("CSV example for README file", function() {

  it("should parse CSV data", function() {
    //
    // defining the grammar
    //
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
    );

    // A quoted string is zero or more characters which are not a quote,
    // enclosed between quotes.
    grammar.define("quoted-string",
      [ peg.consume("\""), peg.zeroOrMore(peg.not("\""), peg.any()), peg.consume("\"") ],
    );

    //
    // Using the parser
    //
    const parser = grammar.parser("S"); // get a parser ready to start at state "S"
    parser.accept("Here,are,\"some,CSV\",data");
    parser.run();

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
  });

  it("should parse CSV data", function() {
    const grammar = new peg.Grammar();

    grammar.define("S",
      [ peg.rule("data"), peg.zeroOrMore(peg.consume(","), peg.rule("data")) ]
    );

    // The "data" are either quoted strings or a row value
    grammar.define("data",
      peg.choice(
        peg.rule("quoted-string"),
        peg.rule("value"),
      ),
      function(value) { return value; }
    );

    // a value is a string of _any character_ which is _not_ the coma
    grammar.define("value",
      peg.zeroOrMore(peg.not(","), peg.any()),
      function(...letters) {
        return letters.join("");
      }
    );

    // A quoted string is zero or characters which are not a quote,
    // enclosed between quotes.
    grammar.define("quoted-string",
      [ peg.consume("\""), peg.zeroOrMore(peg.not("\""), peg.any()), peg.consume("\"") ],
      function(...letters) {
        return letters.join("");
      }
    );

    const parser = grammar.parser("S"); // get a parser ready to start at state "S"
    parser.accept("Here,are,\"some,CSV\",data");
    parser.run();

    assert.equal(parser.status, "success");
    assert.deepEqual(
      parser.result(),
      [ "Here", "are", "some,CSV", "data" ]
    );
  });
});
