
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("pinf", "common");

var command = exports["switch-workspace"] = new ARGS.Parser();

command.help('Enter a workspace');
command.arg("Selector");
command.option("--branch").set().help("The branch to switch to");
command.helpful();

command.action(function (options) {
    try {

        var selector = VALIDATOR.validate("string", options.args[0]);

        var workspace = PINF.getWorkspaceForSelector(selector);

        if(workspace.isBranched()) {
            workspace = workspace.getBranchWorkspace(options.branch || "master");
        }

        workspace.switchTo();

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }
});
