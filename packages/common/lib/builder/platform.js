

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var LOCATOR = require("../package/locator");
var PINF = require("../pinf");
var TERM = require("term");
var JSON = require("json");
var UTIL = require("util");


var PlatformBuilder = exports.PlatformBuilder = function() {
    if (!(this instanceof exports.PlatformBuilder))
        return new exports.PlatformBuilder();
}

PlatformBuilder.prototype.setSourcePackage = function(pkg) {
    this.sourcePackage = pkg;
}

PlatformBuilder.prototype.setTargetPackage = function(pkg) {
    this.targetPackage = pkg;
}

PlatformBuilder.prototype.triggerBuild = function(options) {
    
    TERM.stream.print("\0yellow(*** Building PLATFORM Package ***\0)");
    TERM.stream.print("\0yellow(    source: "+this.sourcePackage.getPath()+"\0)");
    TERM.stream.print("\0yellow(    target: "+this.targetPackage.getPath()+"\0)");

    var targetBasePath = this.targetPackage.getPath();
    targetBasePath.join("bin").mkdirs();

    var sourcePackageImplements = this.sourcePackage.getDescriptor().
            getImplementsForUri("http://registry.pinf.org/cadorn.org/github/pinf/@meta/platform/package/0.1.0");

    // write package.json file for platform
    targetBasePath.join("package.json").write(JSON.encode({
        "name": options.targetPackageName,
        "using": {
            "platform": this.sourcePackage.getLocator().getSpec()
        }
    }, null, "    "));

    // a platform may declare programs it depends on.
    // we need to link all binaries from built programs to the platform bin directory.
    // calling PINF.getDatabase().getProgram() will build the program if not already built.
    if(UTIL.has(sourcePackageImplements, "programs")) {
        UTIL.every(sourcePackageImplements["programs"], function(item) {
            
            var locator = LOCATOR.PackageLocator(item[1]);
            
            if(!PINF.getDatabase().hasProgram(locator)) {
                PINF.getDatabase().buildProgram(locator, options);
            }

            var binPath = PINF.getDatabase().getProgram(locator).getPath().join("bin");

            if(binPath.exists()) {
                binPath.listPaths().forEach(function(item) {
                    
print(" ... LINK BIN from "+item+" to " +targetBasePath.join("bin", item.basename()));                    
                    
//                    item.symlink(targetBasePath.join("bin", item.basename()));
                });
            }
        });
    }
    
/*
TODO: Call custom platform builders!!

        var builder = pkg.getBuilder({
            "packageStore": this.getPackageStore()
        });

        // TODO: Deprecate 'path' property below
        builder.triggerBuild(this, {
            "path": path,
            "platformName": name
        });
*/

    // write bin/activate.bash if it does not exist (i.e. was not created by custom builder)
    var file = targetBasePath.join("bin", "activate.bash");
    if(!file.exists()) {
        file.write("export PATH="+file.dirname()+":\"$PATH\"");
    }

throw "stop in PlatformBuilder";
    
}
