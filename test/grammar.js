"use strict";

const debug = require("debug")("pegparse:test-grammar");

const assert = require("chai").assert;
const g = require("../lib/grammar.js");

describe("grammar", function() {

  describe("litterals", function() {

    it("should translate to sequence of 'char' opcodes", function() {
      const code = g.litteral("Hello");
      assert.deepEqual(code,[
        "char", "H",
        "char", "e",
        "char", "l",
        "char", "l",
        "char", "o",
      ]);
    });

    it("should generate no code for the empty string", function() {
      const code = g.litteral("");
      assert.deepEqual(code,[
      ]);
    });

  });

  describe("concat", function() {

    it("should join code fragments", function() {
      const code1 = g.concat(
        g.litteral("a"),
        g.litteral("bc"),
      );
      const code2 = g.litteral("abc");

      assert.deepEqual(code1, code2);
    });

  });


  describe("choices", function() {

    it("should leave a single alternative as-it", function() {
      const code = g.choice(
        g.litteral("abc"),
      );

      assert.deepEqual(code,[
        "char", "a",
        "char", "b",
        "char", "c",
      ]);
    });

    it("should combine two alternatives", function() {
      const code = g.choice(
        g.litteral("abc"),
        g.litteral("de"),
      );

      assert.deepEqual(code,[
        "choice", +8,
        "char", "a",
        "char", "b",
        "char", "c",
        "commit", +4,
        "char", "d",
        "char", "e",
      ]);
    });

    it("should use right associativiy to combine alternatives", function() {
      const a = g.litteral("a");
      const b = g.litteral("b");
      const c = g.litteral("c");

      const code1 = g.choice(a,b,c);
      const code2 = g.choice(a, g.choice(b,c))

      assert.deepEqual(code1, code2);
    });

  });

  describe("repetitions", function() {

    it("should produce a loop for the zero-or-more primitive", function() {
      const code = g.zeroOrMore(
        g.litteral("a"),
      );

      assert.deepEqual(code, [
        "choice", +4,
        "char", "a",
        "commit", -6,
      ]);
    });

  });

  describe("rules and the grammar object", function() {

    it("can create an empty grammar", function() {
      const grammar = new g.Grammar();

      assert.isOk(grammar);
    });

    it("should add the 'return' opcode at the end of the rules", function() {
      const grammar = new g.Grammar();
      grammar.define("r1", g.litteral("a"));

      assert.deepEqual(grammar.get("r1"), [
        "char", "a",
        "ret", undefined,
      ]);
    });

  });

});

