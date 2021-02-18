"use strict";

const debug = require("debug")("pegparse:test-grammar");

const assert = require("chai").assert;
const g = require("../lib/grammar.js");

describe("grammar", function() {

  describe("litteral", function() {

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

  describe("rules and the grammar object", function() {

    it("can create an empty grammar", function() {
      const grammar = new g.Grammar();

      assert.isOk(grammar);
    });

    it("should add the 'end' opcode to rules", function() {
      const grammar = new g.Grammar();
      grammar.define("r1", g.litteral("a"));

      assert.deepEqual(grammar.get("r1"), [
        "char", "a",
        "end", undefined,
      ]);
    });

  });

});

