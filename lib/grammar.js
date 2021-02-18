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


function concat(...programs) {
  const result = [];

  for(let program of programs) {
    result.push(...program);
  }

  return result;
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
  define(name, opcodes) {
    this.rules.set(name, [
      ...opcodes,
      "end", undefined,
    ]);
  }

  parser(start) {
    return new Parser(this, start);
  }
}

module.exports = {
  choice,
  concat,
  litteral,
  Grammar,
}
