
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("pinf", "common");

var command = exports["activate-platform"] = new ARGS.Parser();

command.help('Activate a platform for a workspace');
command.arg("Workspace", "Name");
command.option("-s", "--switch").bool().help("Switch to workspace");
command.helpful();

command.action(function (options) {
    try {

        var selector = VALIDATOR.validate("string", options.args[0]);
        var name = VALIDATOR.validate("string", options.args[1]);

        if(system.env.PINF_WORKSPACE_HOME) {
            throw new Error("Cannot activate platform from within workspace!");
        }

        var platform = PINF.getPlatformForName(name);
        if(!platform.exists()) {
            throw new Error("Platform not instaleld: " + name);
        }

        var workspace = PINF.getWorkspaceForSelector(selector);
        workspace.setPlatform(platform);

        command.print("Activated platform at: " + platform.getPath());
        command.print("for workspace at: " + workspace.getPath());

        if(options["switch"]) {
            workspace.switchTo();
        }

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }

    command.print("\0green(Done\0)");
});
