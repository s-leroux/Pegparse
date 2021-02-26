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
