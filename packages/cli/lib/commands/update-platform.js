
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("pinf", "common");
var FILE = require("file");

var command = exports["update-platform"] = new ARGS.Parser();

command.help('Update a platform');
command.arg("ID");
command.helpful();

command.action(function (options) {
    try {
        var id = VALIDATOR.validate("string", options.args[0]);
        
        // if we are in a workspace we update the platform with the given name as declared
        // in the package descriptor
        var workspace = PINF.getDatabase().getWorkspaceForSelector(FILE.Path(FILE.cwd()));
        var platform;
        if(workspace) {
            var locator = workspace.getDescriptor().getPlatformLocatorForName(id);
            if(locator) {
                platform = PINF.getPlatformForSelector(locator);
            }
        }
        
        // check global platforms if ID is not declared in workspace
        if(!platform) {
            platform = PINF.getPlatformForName(id);
        }

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
