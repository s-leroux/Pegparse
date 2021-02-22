"use strict";

const debug = require("debug")("pegparse:tests");

const assert = require("chai").assert;

describe("module", function() {
  it("should be loadable", function() {
    const pp = require("../index.js");
  });
});

require("./grammar");
require("./parser");

require("./examples/words");
require("./examples/parenthesis");
