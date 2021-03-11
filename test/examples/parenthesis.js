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

const assert = require("chai").assert;

const peg = require("../../lib/grammar.js");

describe("balanced parenthesis example", function() {

  const grammar = new peg.Grammar();

  grammar.define("S",
    peg.concat(peg.rule("expr"))
  );

  grammar.define("expr",
    peg.choice(
      peg.concat("(", peg.zeroOrMore(peg.rule("expr")), ")"),
      [ peg.not("("), peg.not(")"), peg.any() ]
    ),
    (...data) => "".concat(...data)
  );

  it("should accept balanced expressions", function() {
    const parser = grammar.parser("S");
    parser.accept("(hello (world))");
    parser.run();

    assert.equal(parser.status, "success");
    assert.isFalse(parser.running);
    assert.equal(parser.result(), "(hello (world))");
  });

  it("should fail gracefully", function() {
    const parser = grammar.parser("S");
    parser.accept("(hello ((world))");
    parser.run();

    assert.equal(parser.status, "failure");
    assert.isFalse(parser.running);
  });

});
