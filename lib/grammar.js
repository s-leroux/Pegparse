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

/**
  @module grammar
*/

const { Parser } = require("./parser");
const func = require("./func");

// ========================================================================
//  Code class
// ========================================================================
class Code {}

class Asm extends Code {
  constructor(instructions) {
    super();
    this.instructions = instructions ?? [];
  }
}

class Charset extends Code {
  constructor(set) {
    super();
    this._set = set;
  }

  get instructions() {
    return [ "charset", this._set, ];
  }

  [Symbol.iterator]() {
    return this.set[Symbol.iterator]();
  }

  /**
    Return the charset as a string.
  */
  get set() {
    const entries = [];
    this._set.forEach((value, index) => entries.push(index));

    return String.fromCharCode(...entries);
  }

  /**
    Return the union of this charset and the charset defined by `specs`.
  */
  union(...specs) {
    const set = this._set.slice();

    for(let i of _charset(...specs)) {
      set[i] = 1;
    }

    return new Charset(set);
  }

  /**
    Return the difference between this charset and the charset defined by `specs`.
  */
  difference(...specs) {
    const set = this._set.slice();

    for(let i of _charset(...specs)) {
      delete set[i];
    }

    return new Charset(set);
  }
}

// ========================================================================
//  Utilities
// ========================================================================
/**
  Wrap a string, array or code objects into
  one single Code instance.

  * strings will be treated as litterals
  * array will be converted to a sequence -- eventually
    leading to a recursive call to the `asCode` function
  * Code objects are returned as-it

  @private
*/
function asCode(object) {
  if (object instanceof Code) {
    return object;
  }
  else if (Array.isArray(object)) {
    const result = [];
    for(let item of object) {
      result.push(...asCode(item).instructions);
    }
    return new Asm(result);
  }
  else {
    // fallback to litteral
    return litteral(object);
  }
}

// ========================================================================
//  Charsets
// ========================================================================
/**
  Generator over charset specs.

  See `charset()` for details.

  @private
*/
function *_charset(...specs) {
  for(let spec of specs) {
    if ((spec.length === 3) && (spec.charAt(1) === "-")) {
      // this is a range
      for(let i = spec.charCodeAt(0); i <= spec.charCodeAt(2); ++i) {
        yield i;
      }
    }
    else {
      // assume a string-iterable
      for(let i of spec) {
        yield i.charCodeAt(0);
      }
    }
  }
}

/**
  Match one character if present in the given charset.

  Charset may be specified either:
  - as a range ("0-9");
  - as string containing the individual charaters of the set ("0123456789");
  - as any iterable over a string (including another Charset object).
*/
function charset(...specs) {
  const set = []; // Use holey array which seems to be an order of magnitude fatest than sets.
  for(let i of _charset(...specs)) {
    set[i] = 1;
  }

  return new Charset(set);
}

// ========================================================================
//  Basic constructions
// ========================================================================
/**
  Match a string of characters.

  Capture the entire string
*/
function litteral(str) {
  const result = [];
  if (str.length > 1) {
    result.push("frame", undefined);
  }

  for(let c of str) {
    result.push("char", c);
  }

  if (str.length > 1) {
    result.push("reduce", func.JOIN);
  }

  return new Asm(result);
}

/**
  Negative lookarround.

  Move the token pointer relative to the current position and
  check the given program do _not_ match. Can be used as a negative
  lookbehind (delta < 0) or lookafter (delta >= 0). In all cases,
  restore the input to its previous position on exit.

  Capture nothing.
*/
function nat(delta, ...programs) {
  const program = asCode(programs).instructions;

  return not(new Asm([
    "move", delta,
    ...program,
  ]));
}

/**
  The _not_ predicate.

  Succeed if the given program fails with the current input.
  Do not consume any character.

  Capture nothing.
*/
function not(...programs) {
  const program = asCode(programs).instructions;

  return new Asm([
    "choice", program.length+4,
    ...program,
    "commit", 0,
    "fail", undefined,
  ]);
}

/**
  The _and_ predicate

  Succeed if the given program succeed, but without consuming any character.
  Can be used as a positive lookahead.

  Capture nothing.
*/
function and(...programs) {
  return not(not(...programs));
}

/**
  Match any character. Fail only if there is no more token to process.

  Capture the matched character.
*/
function any() {
  return new Asm([
    "any", undefined,
  ]);
}

/**
  Match a rule of the grammar.

  @param {string} name - The name of the rule to match. The rule does not have
    already exist. It might be defined later.
*/
function rule(name) {
  return new Asm([
    "jsr", name,
  ]);
}

// ------------------------------------------------------------------------
//  Quantifiers
// ------------------------------------------------------------------------

/**
  Concatenation of several programs.

  Will match the sequence:
  programs[0],programs[1],programs[2]..programs[n]
*/
function concat(...programs) {
  return asCode(programs);
}

/**
  Ordered choice.

  Try to match each alternative in its own turn. Stop trying
   once there is a match. Fail if there is no match.
*/
function choice(...alternatives) {
  // For code's performances, it's better to use right
  // association to combines alternatives. Hence the
  // loop going downward
  let i = alternatives.length;
  let result = asCode(alternatives[--i]).instructions;

  while(i) {
    const head = asCode(alternatives[--i]).instructions;

    result = [
      "choice", head.length+2,
      ...head,
      "commit", result.length,
      ...result,
    ];
  }

  return new Asm(result);
}

// ------------------------------------------------------------------------
//  Quantifiers
// ------------------------------------------------------------------------

/**
  The zero-or-one quantifier.

  Match 0 or 1 repetition of a program.


  If there is no match, capture the _undefined_ special value.
*/
function zeroOrOne(...programs) {
  return optional(programs, undefined);
}

/**
  A variation of tThe zero-or-one quantifier.

  This form takes only one program as an argument, but
  it allows specifying the default value to substitute
  if there is no match.
*/
function optional(program, defaultValue) {
  program = asCode(program).instructions;

  return new Asm([
    "choice", program.length+2,
    ...program,
    "commit", +2,
    "pushd", defaultValue,
  ]);
}

/**
  The zero-or-more quantifier.

  Match 0, 1 or several repetitions of the same program.
*/
function zeroOrMore(...programs) {
  const program = asCode(programs).instructions;

  return new Asm([
    "choice", program.length+2,
    ...program,
    "commit", -program.length-4,
  ]);
}

/**
  The one-or-more quantifier.

  Match 1 or several repetitions of the same program.
*/
function oneOrMore(...programs) {
  const program = asCode(programs);
  return new Asm([
    ...program.instructions,
    ...zeroOrMore(program).instructions,
  ]);
}

// ------------------------------------------------------------------------
//  Captures
// ------------------------------------------------------------------------

/*
  Consume (discard) all data matching the program. As opposite to
  _and()_, advance the cursor.
*/
function consume(...programs) {
  const program = asCode(programs).instructions;

  return new Asm([
    "frame", undefined,
    ...program,
    "drop", undefined,
  ]);
}

/**
  Capture the data from a sub-program into an array.

  This allow data capture without requiring to define
  a new rule specifically for that.
*/
function capture(...programs) {
  const program = asCode(programs).instructions;

  return new Asm([
    "frame", undefined,
    ...program,
    "reduce", undefined,
  ]);
}

/**
  Capture the data from a sub-program into a string

  This allow data capture without requiring to define
  a new rule specifically for that.
*/
function join(...programs) {
  const program = asCode(programs).instructions;

  return new Asm([
    "frame", undefined,
    ...program,
    "reduce", (...content) => content.join(""),
  ]);
}

// ------------------------------------------------------------------------
//  Macro/High-level functions
//
//  All functions in that section are expressed as a combination
//  of the core operations.
// ------------------------------------------------------------------------

/**
  Macro equivalent to `join(oneOrMore(...))`.

  Match 1 or several repetition of a pattern and convert the
  capture into a string.
*/
function string(...programs) {
  return join(oneOrMore(programs));
}

/**
  Match any pattern except if ay of the `rest` PEG match.

  Macro equivalent to `not(tail[0]), not(tail[1]), ... not(tail[n]), head());
*/
function except(head, ...tail) {
  const result = [];
  for(let t of tail) {
    result.push(...not(t).instructions);
  }
  result.push(...asCode(head).instructions);

  return new Asm(result);
}

/**
  Match any character except if ay of the `rest` PEG match.

  Macro equivalent to `not(rest[0]), not(rest[1]), ... not(rest[n]), any());
*/
function anyExcept(...rest) {
  return except(any(), ...rest);
}

// ========================================================================
//  The grammar class
// ========================================================================

/**
  The Grammar class.

  @example
  // Create a new grammar
  const grammar = new peg.Grammar();
*/
class Grammar {
  constructor() {
    this.rules = new Map();
  }

  get(nonterminal) {
    const rule = this.rules.get(nonterminal);
    if (!rule) {
      throw new TypeError(`Rule not found: ${nonterminal}`);
    }

    return rule;
  }

  /**
    Define a new rule.

    @param{string} name - The name of the rule
    @param{} program - The program associated with that rule
    @param{) action - An optionable callable to invoke if a match is found.
      The default action is to pack all program's capture in a possible empty
      array.
  */
  define(name, program, action) {
    const opcodes = asCode(program).instructions;
    this.rules.set(name, [
      ...opcodes,
      "ret", action,
    ]);

    return rule(name);
  }

  /**
    Return a new {@link Parser} for the grammar.

    @param{string} start - The name of the rule to match.
    @param{} context - User-supplied context
  */
  parser(start, context) {
    return new Parser(this, start, context);
  }
}

module.exports = {
  // primitives
  any,
  choice,
  concat,
  litteral,
  rule,

  // predicates
  and,
  nat,
  not,

  // quantifiers
  oneOrMore,
  zeroOrMore,
  zeroOrOne,

  // utils
  anyExcept,
  capture,
  consume,
  except,
  join,
  optional,
  string,

  // charsets
  charset,

  // the grammar class
  Grammar,
};
