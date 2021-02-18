"use strict";

const { Parser } = require("./parser");

function litteral(str) {
  const result = [];
  for(let c of str) {
    result.push("char", c);
  }

  return result;
}

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
  litteral,
  Grammar,
}
