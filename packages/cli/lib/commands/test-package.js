
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("pinf", "common");

var command = exports["test-package"] = new ARGS.Parser();

command.help('Test a package');
command.arg("PackageDirectory");
command.option("--platform").set().help("A platform to test against");
command.helpful();



command.action(function (options) {

    try {
        var directory = VALIDATOR.validate("directory", options.args[0], {
            "makeAbsolute": true,
            "return": "FILE.Path"
        });
        
        var platform = false;
        if(options.platform) {
            platform = PINF.getPlatformForSelector(options.platform);
            if(!platform.exists()) {
                throw new Error("Platform not found");
            }
        }

        var locator = PINF.locatorForDirectory(directory);

        var workspace = PINF.getDatabase().getWorkspaceForSelector(directory);
        locator.setRevision(workspace.getRevisionControlBranch());

        var pkg = PINF.getPackageForLocator(locator);   

        pkg.getTester().triggerTest(pkg, {
            "platform": platform,
            "args": options.args.slice(1)
        });

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }

    command.print("\0green(Done\0)");
});
