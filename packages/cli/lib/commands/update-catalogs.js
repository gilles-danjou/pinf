
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var PINF = require("pinf", "common");

var command = exports["update-catalogs"] = new ARGS.Parser();

command.help('Update all catalogs');
command.helpful();

command.action(function (options) {
    try {

        PINF.getDatabase().getCatalogs().update();

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }
});
