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
const f = require("../lib/func.js");

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

  it("should match optional values (success, matching)", function() {
    const grammar = new g.Grammar();
    const sentinel = Symbol();

    grammar.define("r1", g.concat(
      g.optional(g.litteral("a"), sentinel),
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
    const sentinel = Symbol();

    grammar.define("r1", g.concat(
      g.optional(g.litteral("a"), sentinel),
      g.litteral("b"),
    ));

    const parser = grammar.parser("r1");
    parser.accept("bc");

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.deepEqual(parser.result(), [sentinel, "b"]);
    assert.equal(parser.tx, 1);
  });

  it("can join tokens", function() {
    const grammar = new g.Grammar();

    grammar.define("r1", g.join(g.oneOrMore("a"), g.oneOrMore("b")) );

    const parser = grammar.parser("r1");
    parser.accept("aaabb");
    parser.run();

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.deepEqual(parser.result(), ["aaabb"]);
  });

  it("can build strings of tokens", function() {
    const grammar = new g.Grammar();

    grammar.define("r1", g.string(g.not("c"), g.any()) );

    const parser = grammar.parser("r1");
    parser.accept("aaabbc");
    parser.run();

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.deepEqual(parser.result(), ["aaabb"]);
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

  it("should return a valid 'rule' at definition-time", function() {
    const grammar = new g.Grammar();
    const A = grammar.define("a", g.zeroOrMore("a"), f.JOIN);
    const B = grammar.define("b", g.zeroOrMore("b"), f.JOIN);

    grammar.define("r1", [ A, B ]);

    const parser = grammar.parser("r1");
    parser.accept("aaabb");
    parser.run();

    assert.equal(parser.status, "success");
    assert.equal(parser.running, false);
    assert.deepEqual(parser.result(), ["aaa", "bb"]);
  });

  describe("the \"and\" predicate", function() {
    const grammar = new g.Grammar();
    grammar.define("r1", [ g.and("ab"), "a" ]);

    it("should not consume any input", function() {
      const parser = grammar.parser("r1");
      parser.accept("ab");
      parser.run();

      assert.equal(parser.status, "success");
      assert.equal(parser.running, false);
      assert.deepEqual(parser.result(), ["a"]);
      assert.equal(parser.tx, 1);
    });

    it("should reject pattern not matching the look-ahead", function() {
      const parser = grammar.parser("r1");
      parser.accept("ac");
      parser.run();

      assert.equal(parser.status, "failure");
      assert.equal(parser.running, false);
      assert.equal(parser.tx, 0);
    });

  });

  describe("negative lookarround", function() {
    const grammar = new g.Grammar();
    const LETTER = g.charset("ab");
    const WORD_BOUNDARY = g.nat(-1, LETTER);

    grammar.define("r1",
      [ WORD_BOUNDARY, g.oneOrMore(LETTER) ],
      (...letters) => letters.join("")
    );

    it("should detect word boundaries", function() {
      const parser = grammar.parser("r1");
      const result = [];

      parser.accept("aa bba   bbb");

      result.push(...parser.matchAll());

      assert.deepEqual(result, ["aa", "bba", "bbb"]);
    });

  });

  describe("consume/capture", function() {
    const grammar = new g.Grammar();
    const LETTER = g.charset("ab");
    const WORD = g.capture(g.oneOrMore(LETTER));

    grammar.define("r1",
      [ WORD, g.zeroOrMore(g.consume(","), WORD) ],
    );

    it("should discard data from the input", function() {
      const parser = grammar.parser("r1");
      parser.accept("aa,bb,bbb");
      parser.run();

      assert.equal(parser.status, "success");
      assert.deepEqual(parser.result(), [["a","a"],["b","b"],["b","b","b" ]]);

    });

  });

  describe("external function", function() {

    it("should be called when a rule is reduced", function() {
      const grammar = new g.Grammar();
      let result;

      grammar.define("r1",
        g.oneOrMore("a"),
        (...content) => {
          result = content;
        }
      );

      const parser = grammar.parser("r1");
      parser.accept("aaa");
      parser.run();

      assert.equal(parser.status, "success");
      assert.deepEqual(result, ["a","a", "a"]);
    });

    it("should receive the user-supplied context bound to `this`", function() {
      const grammar = new g.Grammar();
      const context = Symbol();
      let result;

      grammar.define("r1",
        g.oneOrMore("a"),
        function(...content) {
          assert.equal(this, context);
          result = content;
        }
      );

      const parser = grammar.parser("r1", context);
      parser.accept("aaa");
      parser.run();

      assert.equal(parser.status, "success");
      assert.deepEqual(result, ["a","a", "a"]);
    });

  });
});

