"use strict";

const debug = require("debug")("pegparse:test-parser");

const assert = require("chai").assert;
const g = require("../lib/grammar.js");

describe("parser", function() {
  it("should start and end on empty grammar", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", []);

    const parser = grammar.parser("r1");
    parser.accept("abc");

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
  });

  it("should match litterals (cuccess)", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.litteral("a"));

    const parser = grammar.parser("r1");
    parser.accept("abc");

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.equal(parser.tx, 1);
  });

  it("should match litterals (failure)", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.litteral("a"));

    const parser = grammar.parser("r1");
    parser.accept("bc");

    assert.equal(parser.status, "failure");
    assert.equal(parser.running, false);
    assert.equal(parser.tx, 0);
  });
});

