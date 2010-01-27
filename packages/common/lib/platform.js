

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var PACKAGE = require("./package");
var PINF = require("./pinf");
var OS = require("os");


var Platform = exports.Platform = function(path) {
    if (!(this instanceof exports.Platform))
        return new exports.Platform(path);
    this.path = path;
}

Platform.prototype = PACKAGE.Package();


Platform.prototype.init = function(locator) {
    if(this.exists()) {
        throw new Error("Platform already exists at: " + this.getPath());
    }
    try {
        var pkg = PINF.getPackageForLocator(locator);
        if(!pkg) {
            throw new Error("Could not locate platform package");
        }

        var path = this.getPath();
        path.mkdirs();

        var builder = pkg.getBuilder({
            "packageStore": PINF.getPackageStore()
        });

        builder.triggerBuild(pkg, {
            "path": path
        });

    } catch(e) {
        this.destroy();
        throw e;
    }
    return true;
}

Platform.prototype.destroy = function() {
    // NOTE: This removes all local traces of the platform.
    OS.command("rm -Rf " + this.getPath());
}
