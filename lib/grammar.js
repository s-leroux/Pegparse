"use strict";

const { Parser } = require("./parser");

// ========================================================================
//  Basic constructions
// ========================================================================
function litteral(str) {
  const result = [];
  for(let c of str) {
    result.push("char", c);
  }

  return result;
}

function rule(name) {
  return [
    "jsr", name,
  ];
}

function concat(...programs) {
  const result = [];

  for(let program of programs) {
    result.push(...program);
  }

  return result;
}

function zeroOrMore(program) {
  return [
    "choice", program.length+2,
    ...program,
    "commit", -program.length-4
  ];
}

function oneOrMore(program) {
  return [
    ...program,
    ...zeroOrMore(program),
  ];
}

function choice(...alternatives) {
  // For code's performances, it's better to use right
  // association to combines alternatives. Hence the
  // loop going downward
  let i = alternatives.length;
  let result = alternatives[--i];

  while(i) {
    const head = alternatives[--i];

    result = [
      "choice", head.length+2,
      ...head,
      "commit", result.length,
      ...result,
    ];
  }
  
  return result;
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
  define(name, opcodes, action) {
    this.rules.set(name, [
      ...opcodes,
      "ret", action,
    ]);
  }

  parser(start) {
    return new Parser(this, start);
  }
}

module.exports = {
  // primitives
  choice,
  concat,
  litteral,
  rule,

  // quantifiers
  oneOrMore,
  zeroOrMore,

  // the grammar class
  Grammar,
};
