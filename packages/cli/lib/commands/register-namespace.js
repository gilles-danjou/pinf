
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var CLIENT = require("../client");

var command = exports["register-namespace"] = new ARGS.Parser();

command.help('Register a namespace on a registry server');
command.arg("URL");
command.option("-i", "--ignore").bool().help("Ignore and overwrite existing local namespace registry");
command.option("--user").set().help("Email address for registry user");
command.option("--authkey").set().help("Authorization key for registry user");
command.helpful();

command.action(function (options) {

    try {
        var uri = VALIDATOR.validate("url", UTIL.trim(options.args[0]), {
            "require": [
                ["path", {"trailingSlash": true}]
            ],
            "return": "uri"
        });
        var user = (options.user)?VALIDATOR.validate("email", UTIL.trim(options.user)):null;
        var authkey = (options.authkey)?UTIL.trim(options.authkey):null;

        var client = CLIENT.Client(uri);    
        client.registerNamespace({
            "ignore": options.ignore,
            "user": user,
            "print": command.print,
            "authkey": authkey
        });

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }
    
    command.print("\0green(Done\0)");
});
