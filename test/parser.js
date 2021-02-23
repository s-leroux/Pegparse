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

  it("should match litterals (success)", function() {
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

  it("should accept charsets (success)", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.charset("abcd"));

    const parser = grammar.parser("r1");
    parser.accept("bc");

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.deepEqual(parser.result(), ["b"]);
    assert.equal(parser.tx, 1);
  });

  it("should accept charsets (failure)", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.charset("abcd"));

    const parser = grammar.parser("r1");
    parser.accept("efg");

    assert.equal(parser.status, "failure");
    assert.equal(parser.running, false);
    assert.equal(parser.tx, 0);
  });

  it("should match alternatives (success, 1st choice)", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.choice(
      g.litteral("a"),
      g.litteral("b"),
    ));

    const parser = grammar.parser("r1");
    parser.accept("abc");

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.equal(parser.tx, 1);
  });

  it("should match alternatives (success, 2nd choice)", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.choice(
      g.litteral("a"),
      g.litteral("b"),
    ));

    const parser = grammar.parser("r1");
    parser.accept("bc");

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.equal(parser.tx, 1);
  });

  it("should match alternatives (failure)", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.choice(
      g.litteral("a"),
      g.litteral("b"),
    ));

    const parser = grammar.parser("r1");
    parser.accept("c");

    assert.equal(parser.status, "failure");
    assert.equal(parser.running, false);
    assert.equal(parser.tx, 0);
  });

  it("should match repetitions (0 occurence)", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.concat(
      g.zeroOrMore(g.litteral("a")),
      g.litteral("b"),
    ));

    const parser = grammar.parser("r1");
    parser.accept("bc");

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.equal(parser.tx, 1);
  });

  it("should match repetitions (1 occurence)", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.concat(
      g.zeroOrMore(g.litteral("a")),
      g.litteral("b"),
    ));

    const parser = grammar.parser("r1");
    parser.accept("abc");

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.equal(parser.tx, 2);
  });

  it("should match repetitions (2 occurences)", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.concat(
      g.zeroOrMore(g.litteral("a")),
      g.litteral("b"),
    ));

    const parser = grammar.parser("r1");
    parser.accept("aabc");

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.equal(parser.tx, 3);
  });

  it("should match zero-or-one (success, matching)", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.concat(
      g.zeroOrOne(g.litteral("a")),
      g.litteral("b"),
    ));

    const parser = grammar.parser("r1");
    parser.accept("abc");

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.deepEqual(parser.result(), ["a", "b"]);
    assert.equal(parser.tx, 2);
  });

  it("should match zero-or-one (success, non-matching)", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.concat(
      g.zeroOrOne(g.litteral("a")),
      g.litteral("b"),
    ));

    const parser = grammar.parser("r1");
    parser.accept("bc");

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.deepEqual(parser.result(), [undefined, "b"]);
    assert.equal(parser.tx, 1);
  });

  it("should match zero-or-one (failure)", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.concat(
      g.zeroOrOne(g.litteral("a")),
      g.litteral("b"),
    ));

    const parser = grammar.parser("r1");
    parser.accept("aabc");

    assert.equal(parser.status, "failure");
    assert.equal(parser.running, false);
    assert.equal(parser.tx, 1);
  });

  it("should call and return from rules", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", g.rule("r2"));
    grammar.define("r2", g.litteral("a"));

    const parser = grammar.parser("r1");
    parser.accept("aabc");

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.equal(parser.tx, 1);
  });
});

