"use strict";

/**
  @module grammar
*/

const { Parser } = require("./parser");

// ========================================================================
//  Code class
// ========================================================================
class Code {
  constructor(instructions) {
    this.instructions = instructions ?? [];
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
    return new Code(result);
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
  Match one character if present in the given charset.

  Charsets may be specified either as a string containing all the chars
  in the set ("0123456789"), or a range ("0-9").
*/
function charset(...specs) {
  const set = []; // Use holey array which seems to be an order of magnitude fatest than sets.

  for(let spec of specs) {
    if ((spec.length === 3) && (spec.charAt(1) === "-")) {
      // this is a range
      for(let i = spec.charCodeAt(0); i <= spec.charCodeAt(2); ++i) {
        set[i] = 1;
      }
    }
    else {
      // plain o' set
      for(let i of spec) {
        set[i.charCodeAt(0)] = 1;
      }
    }
  }

  return new Code([
    "charset", set,
  ]);
}

// ========================================================================
//  Basic constructions
// ========================================================================

/**
  Match a string of characters.

  Capture each character individually.
*/
function litteral(str) {
  const result = [];
  for(let c of str) {
    result.push("char", c);
  }

  return new Code(result);
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

  return not(new Code([
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

  return new Code([
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
  return new Code([
    "any", undefined,
  ]);
}

/**
  Match a rule of the grammar.

  @param {string} name - The name of the rule to match. The rule does not have
    already exist. It might be defined later.
*/
function rule(name) {
  return new Code([
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

  return new Code(result);
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
  const program = asCode(programs).instructions;

  return new Code([
    "choice", program.length+2,
    ...program,
    "commit", +2,
    "pushd", undefined,
  ]);
}

/**
  The zero-or-more quantifier.

  Match 0, 1 or several repetitions of the same program.
*/
function zeroOrMore(...programs) {
  const program = asCode(programs).instructions;

  return new Code([
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
  return new Code([
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

  return new Code([
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

  return new Code([
    "frame", undefined,
    ...program,
    "reduce", undefined,
  ]);
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
  */
  parser(start) {
    return new Parser(this, start);
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
  capture,
  consume,
  nat,
  not,

  // quantifiers
  oneOrMore,
  zeroOrMore,
  zeroOrOne,

  // charsets
  charset,

  // the grammar class
  Grammar,
};
