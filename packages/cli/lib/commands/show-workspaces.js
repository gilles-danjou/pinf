
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var URI = require("uri");
var ARGS = require("args");
var ARGS_UTIL = require("args-util", "util");
var VALIDATOR = require("validator", "util");
var PINF = require("pinf", "common");
var LOCATOR = require("package/locator", "common");

var command = exports["show-workspaces"] = new ARGS.Parser();

command.help('Show information about all workspaces');
command.helpful();

command.action(function (options) {
    try {

        var workspaces = PINF.getDatabase().getWorkspaces(),
            catalogs = PINF.getDatabase().getCatalogs(),
            catalog,
            workspaceRevison,
            locator,
            descriptor;

        workspaces.forEach(function(workspace) {
            
            command.print("\0yellow(" +workspace.getName()+ "\0): " + workspace.getPath());
            
            var rc = workspace.getRevisionControl();
            if(rc.initialized()) {
                var status = rc.getStatus();
                if(status.dirty) {
                    // dirty working copy
                    command.print("    Git: \0red(" + status.branch + " : dirty working copy\0)");
                } else
                if(status.ahead) {
                    // all committed, need to push
                    command.print("    Git: \0magenta(" + status.branch + " : pending push\0)");
                } else {
                    // all good
                    descriptor = null;
                    if(workspace.hasUid()) {
                        // get published revision from catalog
                        locator = locatorForUid(workspace.getUid(), status.branch);
                        catalog = catalogs.get(locator.getUrl());
                        var revisions = catalog.getRevisionsForPackage(locator.getName());
                        if(UTIL.has(revisions, status.branch)) {
                            descriptor = catalog.getDescriptor(locator);
                        }
                    }
                    workspaceRevison = rc.getLatestRevisionForBranch(status.branch);
                    command.print("    Git: \0green(" + status.branch + " : " + workspaceRevison + "\0)" +
                        ((descriptor)?(
                            " \0"+(("0.0.0rev-"+workspaceRevison==descriptor.getVersion())?"green":"red")+"(" +
                            locator.getUrl() + 
                            "\0)"
                        ):""));
    
                    var str = ["Packages:"];
                    workspace.forEachPackage(function(pkg) {
                        if(pkg.hasUid() && pkg.getName()!=workspace.getName()) {
                            locator = locatorForUid(pkg.getUid(), status.branch);
                            catalog = catalogs.get(locator.getUrl());
                            var revisions = catalog.getRevisionsForPackage(locator.getName());
                            if(UTIL.has(revisions, status.branch)) {
                                descriptor = catalog.getDescriptor(locator);
    
                                str.push("\0"+(("0.0.0rev-"+workspaceRevison==descriptor.getVersion())?"green":"red")+"(" +
                                    pkg.getName() + 
                                    "\0)");
    
                            } else {
                                str.push(pkg.getName());
                            }
                        }
                    });
                    if(str.length>1) {
                        command.print("    " + str.join(" "));
                    }
                }
            }
        });

    } catch(e) {
        ARGS_UTIL.printError(e);
        return;
    }

    command.print("\0green(Done\0)");
});


function locatorForUid(uid, revision) {
    var parts = uid.split("/");                    
    parts.pop();
    return LOCATOR.PackageLocator({
        "name": parts.pop(),
        "catalog": parts.join("/") + "/catalog.json",
        "revision": revision
    });
}
