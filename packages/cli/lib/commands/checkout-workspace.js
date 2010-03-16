
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("pinf", "common");

var command = exports["checkout-workspace"] = new ARGS.Parser();

command.help('Checkout an existing workspace');
command.arg("URL");
command.option("-s", "--switch").bool().help("Switch to workspace");
command.option("--branch").set().help("The branch to checkout");
command.helpful();

command.action(function (options) {
    try {
        var uri = VALIDATOR.validate("url", options.args[0], {
            "dropTrailingSlash": true,
            "completeScheme": "http",
            "return": "uri"
        });

        var workspace = PINF.getWorkspaceForSelector(uri);
        
        if(options.branch) {
            // if workspace is not already branched we branch it
            if(!workspace.isBranched()) {
                workspace.migrateToBranched();
            }
            workspace = workspace.getBranchWorkspace(options.branch);
        } else
        if(workspace.isBranched()) {
            // if no branch specified and workspace is already branched assuming master
            workspace = workspace.getBranchWorkspace("master");
        }

        workspace.checkout();

        command.print("Checked out workspace at: " + workspace.getPath());

        if(options["switch"]) {
            workspace.switchTo();
        }

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }

    command.print("\0green(Done\0)");
});
