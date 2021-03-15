/* Pegparse - A PEG engine for Node.js
 * Copyright (c) 2021 Sylvain Leroux
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

const assert = require("chai").assert;
const g = require("../lib/grammar.js");
const func = require("../lib/func.js");

describe("grammar", function() {

  describe("litterals", function() {

    it("should translate an individual character to a 'char' opcode", function() {
      const code = g.litteral("H").instructions;
      assert.deepEqual(code,[
        "char", "H",
      ]);
    });

    it("should translate to packed sequence of 'char' opcodes", function() {
      const code = g.litteral("Hello").instructions;
      assert.deepEqual(code,[
        "frame", undefined,
        "char", "H",
        "char", "e",
        "char", "l",
        "char", "l",
        "char", "o",
        "reduce", func.JOIN,
      ]);
    });

    it("should generate no code for the empty string", function() {
      const code = g.litteral("").instructions;
      assert.deepEqual(code,[
      ]);
    });

  });

  describe("charset", function() {

    it("should accept litterals", function() {
      const cs = g.charset("abcdefghijklmnopqrstuvwxyz");
      const set = cs._set;

      for(let c of "abcdefghijklmnopqrstuvwxyz") {
        assert.isTrue(c.charCodeAt(0) in set, `${c} should be in set`);
      }

      for(let c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
        assert.isFalse(c.charCodeAt(0) in set);
      }
    });

    it("should accept ranges", function() {
      const cs = g.charset("a-z", "A-Z");
      const set = cs._set;

      for(let c of "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") {
        assert.isTrue(c.charCodeAt(0) in set, `${c} should be in set`);
      }

      for(let c of ")(*&^%$#@!") {
        assert.isFalse(c.charCodeAt(0) in set);
      }
    });

    it("can be extended", function() {
      const cs1 = g.charset("0-5");
      const cs2 = cs1.union("6-9");

      for(let c of "012345") {
        assert.isTrue(c.charCodeAt(0) in cs1._set, `${c} should be in set`);
        assert.isTrue(c.charCodeAt(0) in cs2._set, `${c} should be in set`);
      }

      // Initial charset should remain unchanged!
      for(let c of "6789") {
        assert.isFalse(c.charCodeAt(0) in cs1._set, `${c} should be in set`);
        assert.isTrue(c.charCodeAt(0) in cs2._set, `${c} should be in set`);
      }
    });

    it("can be restricted", function() {
      const cs1 = g.charset("0-9");
      const cs2 = cs1.difference("3","6","78", "abcd");

      for(let c of "012459") {
        assert.isTrue(c.charCodeAt(0) in cs1._set, `${c} should be in set`);
        assert.isTrue(c.charCodeAt(0) in cs2._set, `${c} should be in set`);
      }

      // Initial charset should remain unchanged!
      for(let c of "3678") {
        assert.isTrue(c.charCodeAt(0) in cs1._set, `${c} should be in set`);
        assert.isFalse(c.charCodeAt(0) in cs2._set, `${c} should be in set`);
      }
    });

    it("can be merged", function() {
      const cs1 = g.charset("0-5");
      const cs2 = g.charset("6-9");
      const cs3 = g.charset("0-9");

      assert.deepEqual(cs1.union(cs2), cs3);
    });

  });


  describe("concat", function() {

    it("should join code fragments", function() {
      const code1 = g.concat(
        g.litteral("a"),
        g.litteral("bc"),
      );
      const code2 = [
        ...g.litteral("a").instructions,
        ...g.litteral("bc").instructions,

      ];

      assert.deepEqual(code1.instructions, code2);
    });

  });


  describe("choices", function() {

    it("should leave a single alternative as-it", function() {
      const code = g.choice(
        g.litteral("abc"),
      );

      assert.deepEqual(code.instructions,g.litteral("abc").instructions);
    });

    it("should combine two alternatives", function() {
      const code = g.choice(
        g.litteral("abc"),
        g.litteral("de"),
      );

      assert.deepEqual(code.instructions,[
        "choice", +12,
        ...g.litteral("abc").instructions,
        "commit", +8,
        ...g.litteral("de").instructions,
      ]);
    });

    it("should use right associativiy to combine alternatives", function() {
      const a = g.litteral("a");
      const b = g.litteral("b");
      const c = g.litteral("c");

      const code1 = g.choice(a,b,c);
      const code2 = g.choice(a, g.choice(b,c));

      assert.deepEqual(code1, code2);
    });

  });

  describe("quantifiers", function() {

    it("should produce a loop for the zero-or-more quantifier", function() {
      const code = g.zeroOrMore(
        g.litteral("a"),
      );

      assert.deepEqual(code.instructions, [
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

