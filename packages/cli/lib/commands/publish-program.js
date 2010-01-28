
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("../pinf");

var command = exports["publish-program"] = new ARGS.Parser();

command.help('Publish a program package');
command.arg("PackageDirectory");
command.option("--revision").set().help("The revision to publish");
command.helpful();


command.action(function (options) {

    try {
        var directory = VALIDATOR.validate("directory", options.args[0], {
            "makeAbsolute": true,
            "return": "FILE.Path"
        });

        var revision = VALIDATOR.validate("string", options.revision);


        var locator = PINF.locatorForDirectory(directory);
        locator.setRevision(revision);

        var pkg = PINF.getDatabase().getProgram(locator),
            path = PINF.getDatabase().getBuildPathForPackage(pkg);

        path = pkg.publish({
            "path": path
        });

        command.print("Published program from: " + path);

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }

    command.print("\0green(Done\0)");
});
