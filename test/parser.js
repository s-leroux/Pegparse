"use strict";

const debug = require("debug")("pegparse:test-parser");

const assert = require("chai").assert;
const g = require("../lib/grammar.js");

describe("parser", function() {
  it("should start and terminate on empty code", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", []);

    const parser = grammar.parser("r1", g.litteral("a"));
    parser.accept("abc");

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
  });
});

