
var ARGS = require("args");
var parser = exports["test"] = new ARGS.Parser();

parser.help('Execute a test suite');
parser.helpful();
parser.action(function (options) {

    // TODO: With no path specified it executes the PINF command-line test suite

    parser.print("\0red(Not yet implemented\0)");

});
