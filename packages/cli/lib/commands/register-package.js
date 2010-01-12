
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("../pinf");
var CLIENT = require("../client/registry-server");

var command = exports["register-package"] = new ARGS.Parser();

command.help('Register a package to a namespace');
command.arg("Namespace", "PackageDirectory");
command.helpful();

command.action(function (options) {

    try {
        var namespace = VALIDATOR.validate("path", UTIL.trim(options.args[0]), {
            "dropTrailingSlash": true
        });
        var directory = VALIDATOR.validate("directory", UTIL.trim(options.args[1]), {
            "makeAbsolute": true,
            "return": "FILE.Path"
        });
        
        var client = CLIENT.Client(PINF.getDatabase().getRegistryUriForNamespace(namespace));
        client.registerPackage({
            "directory": directory,
            "print": command.print
        });

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }
    
    command.print("\0green(Done\0)");
});
