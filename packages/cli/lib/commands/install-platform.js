
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("pinf", "common");
var LOCATOR = require("package/locator", "common");

var command = exports["install-platform"] = new ARGS.Parser();

command.help('Install a platform');
command.arg("URL", "Name", "Revision");
command.option("--name").set().help("Alternate local platform name");
command.helpful();

command.action(function (options) {
    try {
        var catalogUrl = VALIDATOR.validate("url", options.args[0], {
            "dropTrailingSlash": true
        });
        var catalogName = VALIDATOR.validate("string", options.args[1]);
        var revision = (options.args[2])?VALIDATOR.validate("string", options.args[2]):null;
        
        // TODO: Only allow [A-Za-z0-9_-]
        var name = (options.name)?VALIDATOR.validate("string", options.name):null;

        var locator = LOCATOR.PackageLocator({
            "catalog": catalogUrl,
            "name": catalogName
        });
        
        if(revision) {
            locator.setRevision(revision);
        }

        name = name || catalogName;

        var platform = PINF.getPlatformForName(name);
        
        platform.init(locator, name);

        command.print("Installed platform at: " + platform.getPath());

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }

    command.print("\0green(Done\0)");
});
