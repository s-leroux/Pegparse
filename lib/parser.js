"use strict";

const util = require("util");

class Parser {
  constructor(grammar, start) {
    this.running = true; // Is the machine running?
    this.debugging = !!process.env["PEG_DEBUG"]; // Is the machine running in debug mode?
    this.status = ""; // Current mahcine status.
    this.cc = 0; // Clock counter.

    this.grammar = grammar;
    this.start = start;
    this.code = [];
    this.pc = 0; // The program counter.

    this.tokens = ""; // The string to process
    this.tx = 0; // Index of the currently examined token

    this.stack = []; // The call stack.
    this.sx = 0; // Index of the next free cell in the stack
    this.fx = 0; // Index of the top-most stack frame

    this.bp = null; // Pointer to the top-most backtrack entry in the stack

    // this.catures = [] // list of captures. Not implemented.

    this.restart();
  }

  // ----------------------------------------------------------------------
  // Debugging
  // ----------------------------------------------------------------------

  dump() {
    function _i(object) {
      return util.inspect(object, { compact: true, breakLength: Infinity, depth: 1 });
    }

    console.log(this.cc);

    // Dump the source code
    console.log("---------------------------------------");
    console.log("         opcode        arg             ");
    console.log("---------------------------------------");
    //           01234567890123456789012345678901234567890
    for(let i = 0; i<this.code.length; i+=2) {
      const parts = [
        i.toString().padStart(6),
        (i==this.pc) ? ">" : " ",
        this.code[i].toString().padEnd(10),
        _i(this.code[i+1]).padStart(6),
      ];

      console.log(parts.join(" "));
    }

    // Dump the backtrack stack
    console.log();
    console.log("---------------------------------------");
    console.log("  backtrack                            ");
    console.log("---------------------------------------");
    //           01234567890123456789012345678901234567890

    let bp = this.bp;
    while(true) {
      const parts = [
        _i(bp),
      ];

      console.log(parts.join(" "));
      if (!bp)
        break;
      bp = bp.bp;
    }

    // Dump the call stack
    console.log();
    console.log("---------------------------------------");
    console.log("         call stack                    ");
    console.log("---------------------------------------");
    //           01234567890123456789012345678901234567890

    for(let i = 0; i<this.sx; ++i) {
      const parts = [
        i.toString().padStart(6),
        (i==this.fx) ? "F" : " ",
        _i(this.stack[i]),
      ];

      console.log(parts.join(" "));
    }

    // token ribbon
    const end = Math.min(this.tokens.length, this.tx+20);
    const start = Math.max(0, end-40);

    let ribbon1 = "";
    let ribbon2 = "";
    for(let i = start; i<end; ++i) {
      let c = ".";

      const cc = this.tokens.charCodeAt(i);
      if ((cc >= 32) && (cc !== 127)) {
        c = this.tokens[i];
      }

      ribbon1 += c;
      ribbon2 += (this.tx === i) ? "^" : " ";
    }
    console.log();
    console.log(ribbon1);
    console.log(ribbon2);

    // registers
    console.log();
    console.log(`pc=${this.pc} tx=${this.tx} sx=${this.sx}, fx=${this.fx}`);
    console.log(`running=${this.running} status=${this.status}`);

    console.log();
    console.log();
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
    Push a value onto the stack.
  */
  pushd(value) {
    this.push(value);
  }

  /*
    Test for a character. Fail if it doesn't match.
  */
  char(c) {
    const token = this.tokens[this.tx];

    if (token === c) {
      this.push(token);
      ++this.tx;
    }
    else {
      this.fail();
    }
  }

  /*
    Match any character in a string. Fail if it doesn't match.
  */
  charset(str) {
    const token = this.tokens[this.tx];

    if (str.indexOf(token) > -1) {
      this.push(token);
      ++this.tx;
    }
    else {
      this.fail();
    }
  }

  /*
    Move the tx. Fail if it would move before the first token.
  */
  move(delta) {
    const dest = this.tx + delta;
    if (dest < 0) {
      this.fail();
    }
    else {
      this.tx = dest;
    }
  }

  /*
    Test for any character except \x00
  */
  any() {
    const token = this.tokens[this.tx];
    if (token && (token !== "\x00")) {
      this.push(token);
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
      this.code = backtrace.code;
      this.tx = backtrace.tx;
      this.sx = backtrace.sx;
      this.fx = backtrace.fx;
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
    Replace the current stack frame by the result
    of an external (JavaScript) function
  */
  call(fct) {
    const data = this.stack.slice(this.fx, this.sx);
    // console.log(this.fx, this.sx, data)
    this.sx = this.fx;
    this.fx = this.pop();

    this.push(fct(...data));
  }

  /*
    Jump to subroutine (or subrule ?)

    Save the current pc and code, then jump on
    the first instruction for the given nonterminal.
  */
  jsr(nonterminal) {
    /*
      Push a new frame onto the stack:

             ---------------
            |   saved PC    | |
             ---------------  |
            |   saved CODE  | |  New stack frame
             ---------------  |
            |   saved FX    | |
             ---------------
      FX -> |               |
            |   DATA        |
            |   ...         |

    */
    // save the return address on the stack
    this.push(this.pc);
    this.push(this.code);
    this.push(this.fx);
    this.fx = this.sx;

    this.pc = 0;
    this.code = this.grammar.get(nonterminal);
  }

  /*
    Return from a call.
  */
  ret(fct) {
    // pop data
    const data = this.stack.slice(this.fx, this.sx);
    // console.log(this.fx, this.sx, data)
    this.sx = this.fx;

    this.fx = this.pop();
    this.code = this.pop();
    this.pc = this.pop();

    this.push(fct ? fct(...data) : data);
  };

  /*
    Create a backtrack entry on the stack
  */
  choice(offset) {
    this.bp = {
      bp: this.bp,
      pc: this.pc+offset,
      code: this.code,
      tx: this.tx,
      sx: this.sx,
      fx: this.fx,
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

  // ----------------------------------------------------------------------
  // API
  // ----------------------------------------------------------------------

  /*
    Excecute one cycle of the evaluation loop
  */
  step() {
    ++this.cc;

    if (this.cc === 118)
      debugger;

    if (this.debugging) {
      this.dump();
    }

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

  /*
    continue execution until the machine stops.

    Call this function when you now there will no more tokens
    to append using the 'accept()' call.
  */
  run() {
    while(this.running) {
      this.step();
    }
  }

  /*
    Restart the parser at the current tx
  */
  restart() {
    this.code = [ // bootloader
      "jsr", this.start,
      "end", undefined
    ];
    this.pc = 0;

    /* clear the stack */
    this.stack = [];
    this.sx = 0;

    /* clear the backtrack stack */
    this.bp = null;

    this.running = true;

    return (this.tx < this.tokens.length);
  }

  /*
    Skip n tokens from the input
  */
  skip(n) {
    this.tx += n; // XXX should we check boundaries here?
  }

  /*
    Return the top-most object on the stack if the machine has stopped.
    Return undefined otherwise
  */
  result() {
    if (!this.running && (this.status == "success")) {
      return this.stack[0];
    }
  }

  /*
    Return a generator for all the tokens parts matching the
    parser's grammar, possibly skipping an arbitrary number
    of input tokens.
  */
  *matchAll() {
    while(true) {
      if(this.running) { // run the parser until completion
        this.run();
      }
      if (this.status === "success") {
        yield this.stack[0];
        this.restart();
      }
      else if (this.tx < this.tokens.length) {
        this.tx += 1;
        this.restart();
      }
      else {
        return false;
      }
    }
  }
};

module.exports = {
  Parser,
};
