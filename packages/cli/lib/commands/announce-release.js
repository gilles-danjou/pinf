
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("../pinf");
var CLIENT = require("../client/registry-server");

var command = exports["announce-release"] = new ARGS.Parser();

command.help('Announce a new release of a package');
command.arg("PackageDirectory");
command.option("--branch").set().help("The branch to announce (instead of the latest tag)");
command.option("--major").set().help("The major version to search for the latest tag");
command.helpful();

command.action(function (options) {

    try {
        var directory = VALIDATOR.validate("directory", UTIL.trim(options.args[0]), {
            "return": "FILE.Path"
        });
        
        var client = CLIENT.Client(PINF.getDatabase().getRegistryUriForPackage(directory));
        client.announceRelease({
            "directory": directory,
            "branch": options.branch || null,
            "major": options.major || null,
            "print": command.print
        });

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }
    
    command.print("\0green(Done\0)");
});
