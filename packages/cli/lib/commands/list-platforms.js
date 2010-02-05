
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("pinf", "common");

var command = exports["list-platforms"] = new ARGS.Parser();

command.help('List all installed platforms');
command.helpful();

command.action(function (options) {
    try {

        var platforms = PINF.getDatabase().getPlatforms();
        platforms.forEach(function(platform) {
            command.print("\0yellow(" +platform.getName()+ "\0): " + platform.getPath());
        });

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }

    command.print("\0green(Done\0)");
});
