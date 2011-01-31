
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("pinf", "common");

var command = exports["create-workspace"] = new ARGS.Parser();

command.help('Create a new workspace');
command.arg("URL");
command.option("-s", "--switch").bool().help("Switch to workspace");
command.option("--skip-create-remote-repo").bool().help("Skip creation of remote repository");
command.helpful();

command.action(function (options) {
    try {
        var uri = VALIDATOR.validate("url", options.args[0], {
            "dropTrailingSlash": true,
            "return": "uri"
        });

        var workspace = PINF.getWorkspaceForSelector(uri);

        workspace.init(options);

        command.print("Created workspace at: " + workspace.getPath());
        
        if(options["switch"]) {
            workspace.switchTo();
        }

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }

    command.print("\0green(Done\0)");
});
