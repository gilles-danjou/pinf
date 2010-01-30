
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var PINF = require("pinf", "common");

var command = exports["map-sources"] = new ARGS.Parser();

command.help('Map packages and catalogs to workspaces');
command.helpful();

command.action(function (options) {
    try {
        
        PINF.mapSources();

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }

    command.print("\0green(Done\0)");

});
