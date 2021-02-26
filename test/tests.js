"use strict";

describe("module", function() {
  it("should be loadable", function() {
    require("../index.js");
  });
});

require("./grammar");
require("./parser");

require("./examples/words");
require("./examples/parenthesis");
require("./examples/calculator");
require("./examples/csv");
