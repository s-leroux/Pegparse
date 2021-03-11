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

describe("word parser example", function() {

  const grammar = new peg.Grammar();
  grammar.define("S",
    peg.choice(
      peg.rule("space"),
      peg.rule("word")
    ),
    (data) => data
  );

  grammar.define("space",
    peg.oneOrMore(" "),
    (...chars) => ({space:"".concat(...chars)})
  );
  grammar.define("word",
    peg.oneOrMore("a"),
    (...chars) => ({word:"".concat(...chars)})
  );

  it("should parse a string", function() {
    const parser = grammar.parser("S");
    parser.accept("aaaa    a aaa  a");

    let result = [];

    result.push(...parser.matchAll());

    assert.deepEqual(result, [
      { "word": "aaaa" },
      { "space": "    " },
      { "word": "a" },
      { "space": " " },
      { "word": "aaa" },
      { "space": "  " },
      { "word": "a" },
    ]);
  });

  it("should fail elegantly", function() {
    const parser = grammar.parser("S");
    parser.accept("aaaa  aaabaa");

    while(true) {
      if (parser.status === "failure")
        parser.skip(1);

      if (!parser.restart()) {
        break;
      }
      parser.run();
    }
  });


});
