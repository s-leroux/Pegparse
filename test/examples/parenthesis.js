"use strict";

const debug = require("debug")("pegparse:ex-parenthesis");

const peg = require("../../lib/grammar.js");

describe("balanced parenthesis example", function() {

  const grammar = new peg.Grammar();

  grammar.define("S",
    peg.concat(peg.rule("expr"))
  );

  grammar.define("expr",
    peg.choice(
      peg.concat("(", peg.zeroOrMore(peg.rule("expr")), ")"),
      [ peg.not(")"), peg.any() ]
    ),
    (...data) => data
  );

  it("should accept balanced expressions", function() {
    const parser = grammar.parser("S");
    parser.accept("(hello (world)).");
    parser.run();

    console.log(parser.status, parser.tx, parser.tokens[parser.tx], parser.result());
  });

});
