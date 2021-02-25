"use strict";

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
/*
  Wrap a string, array or code objects into
  one single Code instance.

  * strings will be treated as litterals
  * array will be converted to a sequence -- eventually
    leading to a recursive call to the `asCode` function
  * Code objects are returned as-it
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
/*
  Match one character if present in the given string.
*/
function charset(str) {
  return new Code([
    "charset", str,
  ]);
}

// ========================================================================
//  Basic constructions
// ========================================================================

/*
  A string of characters to match entirely
*/
function litteral(str) {
  const result = [];
  for(let c of str) {
    result.push("char", c);
  }

  return new Code(result);
}

/*
  Negative lookarround
*/
function nat(delta, ...programs) {
  const program = asCode(programs).instructions;

  return not(new Code([
    "move", delta,
    ...program,
  ]));
}

/*
  The not predicate.

  Succeed if the given program fails with the current input.
  Do not consume any character.
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

/*
  The not operator

  Succeed if the given program succeed, but without consuming any character.
*/
function and(...programs) {
  return not(not(...programs));
}

/*
  Match any character
*/
function any() {
  return new Code([
    "any", undefined,
  ]);
}

/*
  Branch to another rule
*/
function rule(name) {
  return new Code([
    "jsr", name,
  ]);
}

/*
  Concatenation of several programs.

  Will match the sequence:
  programs[0],programs[1],programs[2]..programs[n]
*/
function concat(...programs) {
  return asCode(programs);
}

/*
  The zero-or-one quantifier.

  Match 0 or 1 repetitionof a pattern. If there is no match,
  the pattern value is replaced by the _undefined_ special
  value.
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

/*
  The zero-or-more quantifier.

  Match 0, 1 or several repetitions of the same pattern.
*/
function zeroOrMore(...programs) {
  const program = asCode(programs).instructions;

  return new Code([
    "choice", program.length+2,
    ...program,
    "commit", -program.length-4,
  ]);
}

function oneOrMore(...programs) {
  const program = asCode(programs);
  return new Code([
    ...program.instructions,
    ...zeroOrMore(program).instructions,
  ]);
}

/*
  Ordered choice.

  Try to match each alternative in its own turn. Stop trying
  more alternatives once there is a match.
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

// ========================================================================
//  The grammar class
// ========================================================================
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

  /*
    Define a new rule.
  */
  define(name, program, action) {
    const opcodes = asCode(program).instructions;
    this.rules.set(name, [
      ...opcodes,
      "ret", action,
    ]);

    return rule(name);
  }

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
  nat,

  // predicates
  and,
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
