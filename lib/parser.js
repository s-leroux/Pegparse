"use strict";

const FAIL = -1;

class Parser {
  constructor(grammar, start) {
    this.running = true; // Is the machine running?
    this.status = ""; // Current mahcine status.
    this.cc = 0; // Clock counter.

    this.grammar = grammar;
    this.code = [ // the program to execute
      "call", start,
      "end", undefined
    ];
    this.pc = 0; // The program counter. Takes the special value FAIL to backtrack

    this.tokens = ""; // The string to process
    this.tx = 0; // Index of the currently examined token

    this.stack = []; // The call stack.
    this.sx = 0; // Index of the next free cell in the stack

    this.bp = null; // Pointer to the top-most backtrack entry in the stack

    // this.catures = [] // list of captures. Not implemented.
  }

  // ----------------------------------------------------------------------
  // Low-level functions
  // ----------------------------------------------------------------------

  /*
    Push a value onto the stack
  */
  push(value) {
    this.stack[this.sx++] = value;
  }

  /*
    Pop a value from the stack;
  */
  pop(value) {
    return this.stack[--this.sx];
  }

  // ----------------------------------------------------------------------
  // Assembler
  // ----------------------------------------------------------------------

  /*
    Test for a character. Fail if it doesn't match.
  */
  char(c) {
    if (this.tokens[this.tx] === c) {
      ++this.tx;
    }
    else {
      this.fail();
    }
  }

  /*
    Force a failure. Return to the last saved backtrack point
    or stop the machine.
  */
  fail() {
    const backtrace = this.bp;
    if (backtrace) {
      this.bp = backtrace.bp;
      this.pc = backtrace.pc;
      this.tx = backtrace.tx;
      this.sx = backtrace.sx;
    }
    else {
      this.running = false;
      this.status = "failure";
    }
  }

  /*
    Stop the machine. Signal success.
  */
  end() {
    this.running = false;
    this.status = "success";
  }

  /*
    Save the current pc and code, then jump on
    the first instruction for the given nonterminal.
  */
  call(nonterminal) {
    // save the return address on the stack
    this.push(this.pc);
    this.push(this.code);

    this.pc = 0;
    this.code = this.grammar.get(nonterminal);
  }

  /*
    Create a backtrack entry on the stack
  */
  choice(offset) {
    this.bp = {
      bp: this.bp,
      pc: this.pc+offset,
      tx: this.tx,
      sx: this.sx,
    };
  }

  /*
    Commit a choice. Discard the topmost backtrack and jump
    to instruction.
  */
  commit(offset) {
    this.bp = this.bp.bp;
    this.pc += offset;
  }

  /*
    Return from a call.
  */
  ret() {
    this.code = this.pop();
    this.pc = this.pop();
  };

  // ----------------------------------------------------------------------
  // API
  // ----------------------------------------------------------------------

  /*
    Excecute one cycle of the evaluation loop
  */
  step() {
    ++this.cc;
    // if (this.debugging) {
    //   this.dump();
    // }

    const opcode = this.code[this.pc++];
    const operand = this.code[this.pc++];

    // console.log(opcode, operand);
    this[opcode](operand);
  }
  /*
    accept one or more characters. Run the machine as long as we have token to process.
  */
  accept(tokens) {
    this.tokens += tokens;

    while(this.running && this.tx < this.tokens.length) {
      this.step();
    }
  }
};

module.exports = {
  Parser,
};
