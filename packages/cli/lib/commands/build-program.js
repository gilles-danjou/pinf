
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("../pinf");
var GIT = require("git", "util");

var command = exports["build-program"] = new ARGS.Parser();

command.help('Build a program package');
command.arg("PackageDirectory");
command.option("--rdep").bool().help("Build using remote dependencies instead of local copy");
command.option("--remote").bool().help("Build using all remote releases instead of local copy");
command.option("--revision").set().help("The revision to build (instead of the latest tag)");
command.option("--diff").bool().help("NYI - Display packages that will be used vs packages recorded in program.json");
command.helpful();


/**
 * pinf build-program .                                 local program + check local dependencies
 * pinf build-program --rdep .                          local program + force remote dependencies
 * pinf build-program --remote --revision <Revision> .  force remote program + force remote dependencies
 */
command.action(function (options) {

    try {
        var directory = VALIDATOR.validate("directory", options.args[0], {
            "makeAbsolute": true,
            "return": "FILE.Path"
        });

        var locator = PINF.locatorForDirectory(directory);
        
        var remoteProgram = false,
            remoteDependencies = false;
        
        if(options.remote) {
            if(options.rdep) {
                throw new Error("--rdep cannot be used with --remote");
            }
            if(options.revision) {
                locator.setRevision(options.revision);
            }
            // force remote program + force remote dependencies
            locator.setForceRemote(true);
            remoteProgram = true;
            remoteDependencies = true;
        } else
        if(options.revision) {
            throw new Error("--revision can only be used with --remote");
        } else {
            if(options.rdep) {
                // local program + force remote dependencies
                remoteDependencies = true;
            }
            // local program + check local dependencies

            var workspace = PINF.getDatabase().getWorkspaceForSelector(directory),
                revisionControl;
            // if we have a workspace try and consult git to get the branch
            if(workspace.exists()) {
                revisionControl = workspace.getRevisionControl();
                if(!revisionControl.initialized()) {
                    revisionControl = null;
                }
            }
            // if not workspace or git repository try and consult git for directory directly
            if(!revisionControl) {
                revisionControl = GIT.Git(directory);
            }
            if(revisionControl && revisionControl.initialized()) {
                locator.setRevision(revisionControl.getActiveBranch());
            }
        }

        var pkg = PINF.getDatabase().getProgram(locator);

        path = pkg.build({
            "remoteProgram": remoteProgram,
            "remoteDependencies": remoteDependencies,
            "args": options.args.slice(1)
        });

        command.print("Built program at: " + path);

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }

    command.print("\0green(Done\0)");
});
