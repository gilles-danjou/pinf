
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("../pinf");

var command = exports["launch-program"] = new ARGS.Parser();

command.help('Launch a program package');
command.arg("PackageDirectory");
command.option("--revision").set().help("The revision to launch");
command.helpful();


command.action(function (options) {

    try {
        var directory = VALIDATOR.validate("directory", options.args[0], {
            "makeAbsolute": true,
            "return": "FILE.Path"
        });

        var revision = (options.revision)?VALIDATOR.validate("string", options.revision):false;
        
        if(!revision) {
            var workspace = PINF.getDatabase().getWorkspaceForSelector(directory);
            if(!workspace) {
                throw new Error("Could not find workspace at: " + directory);
            }
            revision = workspace.getRevisionControl().getActiveBranch();
        }

        var locator = PINF.locatorForDirectory(directory);
        locator.setRevision(revision);

        var pkg = PINF.getDatabase().getProgram(locator);

        pkg.launch({
            "args": options.args.splice(1)
        });

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }

    command.print("\0green(Done\0)");
});
