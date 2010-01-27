
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("../pinf");

var command = exports["build-program"] = new ARGS.Parser();

command.help('Build a program package');
command.arg("PackageDirectory");
command.option("--revision").set().help("The revision to build (instead of the latest tag)");
command.helpful();

command.action(function (options) {

    try {
        var directory = VALIDATOR.validate("directory", options.args[0], {
            "makeAbsolute": true,
            "return": "FILE.Path"
        });

        var locator = PINF.locatorForDirectory(directory);

        if(options.revision) {
            locator.setRevision(options.revision);
        }

        var pkg = PINF.getDatabase().getProgram(locator),
            path = PINF.getDatabase().getBuildPathForPackage(pkg);

        path = pkg.build({
            "path": path
        });

        command.print("Built program at: " + path);

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }

    command.print("\0green(Done\0)");
});
