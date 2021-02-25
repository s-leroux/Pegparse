"use strict";

const debug = require("debug")("pegparse:ex-words");

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

    let from = 0;
    let result = [];
    while(true) {
      assert.equal(parser.status, "success");
      result.push(parser.result());
      from = parser.tx;
      if (parser.tx >= parser.tokens.length)
        break;

      parser.restart();
      parser.run();
    }
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
    parser.accept("aaaa  aaabaa\0");

    let from = 0
    while(true) {
      from = parser.tx;
      if (parser.status === "failure")
        parser.skip(1);
      if (parser.tokens[parser.tx] === '\0')
        break;

      parser.restart();
      parser.run();
    }
  });


});
