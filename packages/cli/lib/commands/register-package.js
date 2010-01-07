
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("../pinf");
var CLIENT = require("../client");

var command = exports["register-package"] = new ARGS.Parser();

command.help('Register a package to a namespace');
command.arg("Namespace", "PackageDirectory");
command.option("-i", "--ignore").bool().help("Ignore and overwrite existing local package registry");
command.helpful();

command.action(function (options) {

    try {
        var namespace = VALIDATOR.validate("path", UTIL.trim(options.args[0]), {
            "dropTrailingSlash": true
        });
        var directory = VALIDATOR.validate("directory", UTIL.trim(options.args[1]), {
            "return": "FILE.Path"
        });
        
        var client = CLIENT.Client(PINF.getDatabase().getRegistryUriForNamespace(namespace));
        client.registerPackage({
            "ignore": options.ignore,
            "directory": directory,
            "print": command.print
        });

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }
    
    command.print("\0green(Done\0)");
});
