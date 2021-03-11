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

describe("calculator example", function() {

  const grammar = new peg.Grammar();
  grammar.define("S",
    peg.rule("sum"),
    (data) => data
  );

  grammar.define("sum",
    [ peg.rule("product"), peg.zeroOrOne([ "+", peg.rule("sum") ])],
    (prod, op, sum) => (op) ? prod+sum : prod
  );

  grammar.define("product",
    [ peg.rule("term"), peg.zeroOrOne([ "*", peg.rule("product") ])],
    (term, op, prod) => (op) ? term*prod : term
  );

  grammar.define("term",
    peg.oneOrMore(peg.charset("0123456789")),
    (...digits) => parseInt(digits.join("")),
  );


  it("should calculate", function() {
    const parser = grammar.parser("S");
    parser.accept("1+23+4*15"),
    parser.run();

    assert.equal(parser.status, "success");
    assert.equal(parser.result(), 84);
  });


});
