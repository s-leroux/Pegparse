"use strict";

const debug = require("debug")("backparse:");

module.exports = {
  ...require("./grammar"),
  ...require("./parser"),
};
