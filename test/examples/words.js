"use strict";

const debug = require("debug")("pegparse:ex-words");

const peg = require("../../lib/grammar.js");

describe("word parser example", function() {

  const grammar = new peg.Grammar();
  grammar.define("S", 
    peg.choice(
      peg.rule("space"),
      peg.rule("word")
    )
  );

  grammar.define("space", peg.oneOrMore(peg.litteral(" ")));
  grammar.define("word", peg.oneOrMore(peg.litteral("a")));

  const parser = grammar.parser("S");
  parser.accept("aaaa    a aaa  a");

  it("should parse a string", function() {
    let from = 0 
    while(true) {
      console.log(parser.status, parser.tx, parser.tokens.substring(from, parser.tx));
      from = parser.tx;
      if (!parser.tokens[parser.tx])
        break;

      parser.restart();
    }
  });


});
