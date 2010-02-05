
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("pinf", "common");

var command = exports["update-platform"] = new ARGS.Parser();

command.help('Update a platform');
command.arg("ID");
command.helpful();

command.action(function (options) {
    try {
        var id = VALIDATOR.validate("string", options.args[0]);

        var platform = PINF.getPlatformForName(id);
        if(!platform.exists()) {
            command.print("No platform found for ID: " + id);
            return;
        }
        
        platform.update();

        command.print("Updated platform at: " + platform.getPath());

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }

    command.print("\0green(Done\0)");
});
