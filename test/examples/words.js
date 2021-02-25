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

    let from = 0
    while(true) {
      from = parser.tx;
      if (parser.status === "failure")
        parser.skip(1);

      if (!parser.restart()) {
        break;
      }
      parser.run();
    }
  });


});
