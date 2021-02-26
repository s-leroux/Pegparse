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
