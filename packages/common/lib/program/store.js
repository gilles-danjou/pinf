

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var PROGRAM = require("../program");
var PINF = require("../pinf");


var ProgramStore = exports.ProgramStore = function(path) {
    if (!(this instanceof exports.ProgramStore))
        return new exports.ProgramStore(path);

    this.path = path;
}

ProgramStore.prototype.exists = function() {
    return this.path.exists();
}

ProgramStore.prototype.setPackageStore = function(store) {
    this.packageStore = store;
}

ProgramStore.prototype.getBasePath = function() {
    return this.path.join("programs");
}

ProgramStore.prototype.get = function(locator) {

    var pkg = this.packageStore.get(locator);

    if(!pkg.getPath().join("program.json").exists()) {
        throw new Error("Package not a program at path: " + pkg.getPath());
    }

    var programPath = this.getBasePath().join(locator.getTopLevelId());
    if(!programPath.exists()) {

        programPath.mkdirs();

        [
            "package.json",
            "program.json"
        ].forEach(function(basename) {
            if(pkg.getPath().join(basename).exists()) {
                // if package has a version it is a release we do not want to modify.
                // if it does not have a version it is likely linked to a workspace in which
                // case we do want to modify program.json
                if(pkg.getVersion()) {
                    pkg.getPath().join(basename).copy(programPath.join(basename));
                } else {
                    pkg.getPath().join(basename).symlink(programPath.join(basename));
                }
            }
        });

        // if there are *.local.* files in the workspace for this program we link them
        var workspace = PINF.getWorkspaceForSelector(pkg.getUid());
        if(workspace) {
            var repoInfo = pkg.getDescriptor().getRepositoryInfo(),
                basePath = workspace.getPath();
            if(repoInfo.path) {
                basePath = basePath.join(repoInfo.path);
            }
            [
                "package.local.json",
                "program.local.json"
            ].forEach(function(basename) {
                if(basePath.join(basename).exists() && !programPath.join(basename).exists()) {
                    basePath.join(basename).symlink(programPath.join(basename));
                }
            });
        }
    }

/*    
    if(pkg.getVersion() && !programPath.exists()) {
        FILE.copyTree(pkg.getPath(), programPath);

        // if there are *.local.* files in the workspace for this program we link them
        var workspace = PINF.getWorkspaceForSelector(pkg.getUid());
        if(workspace) {
            var repoInfo = pkg.getDescriptor().getRepositoryInfo(),
                basePath = workspace.getPath();
            if(repoInfo.path) {
                basePath = basePath.join(repoInfo.path);
            }
            [
                "package.local.json"
            ].forEach(function(basename) {
                if(basePath.join(basename).exists() && !programPath.join(basename).exists()) {
                    basePath.join(basename).symlink(programPath.join(basename));
                }
            });
        }
    } else
    if(!programPath.exists()) {
        pkg.getPath().symlink(programPath);
    }
*/

    var program = PROGRAM.Program(programPath, locator);
    program.setPackageStore(this.packageStore);
    return program;
}

