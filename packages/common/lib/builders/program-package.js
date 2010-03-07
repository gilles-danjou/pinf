

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var LOCATOR = require("package/locator", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var BUILDER = require("builder", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var PINF = require("pinf", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");
var JSON = require("json");
var UTIL = require("util");


var Builder = exports.Builder = function(pkg, options) {
    if (!(this instanceof exports.Builder))
        return new exports.Builder(pkg, options);
    this.construct(pkg, options);
}

Builder.prototype = BUILDER.Builder();



Builder.prototype.build = function(targetPackage, buildOptions) {
    var self = this;
    
    var sourceBasePath = targetPackage.getPath(),
        rawBasePath = targetPackage.getBuildPath().join("raw"),
        targetBasePath = targetPackage.getBuildPath().join("program"),
        sourcePath,
        targetPath;

    targetBasePath.mkdirs();
    
    // copy package.json
    sourcePath = rawBasePath.join("package.json");
    targetPath = targetBasePath.join("package.json");
    sourcePath.copy(targetPath);


    // link raw packages
    [
        rawBasePath
    ].forEach(function(sourcePath) {
        sourcePath = sourcePath.join("packages");
        if(!sourcePath.exists()) return;
        targetPath = targetBasePath.join("packages");
        targetPath.mkdirs();
        sourcePath.listPaths().forEach(function(item) {
            if(item.join("package.json").exists()) {
                item.symlink(targetPath.join(item.basename()));
            }
        });
    });

    // link using packages
    sourcePath = rawBasePath.join("using");
    if(sourcePath.exists()) {
        targetPath = targetBasePath.join("using");
        sourcePath.symlink(targetPath);
    }
    
    // link program directories
    [
        "lib",
        "resources"
    ].forEach(function(path) {
        sourcePath = sourceBasePath.join(path);
        if(sourcePath.exists()) {
            targetPath = targetBasePath.join(path);
            targetPath.dirname().mkdirs();
            sourcePath.symlink(targetPath);
        }
    });


    var descriptor = targetPackage.getDescriptor();

    // build all using packages
    descriptor.everyUsing(function(name, locator) {
        var pkg = self.getPackageForLocator(locator);
        var builder = pkg.getBuilder(self.options);
        builder.triggerBuild(targetPackage, buildOptions);        
    });

}
