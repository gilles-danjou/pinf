

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var LOCATOR = require("./package/locator");
var PINF = require("./pinf");


var Builder = exports.Builder = function(pkg, options) {
    if (!(this instanceof exports.Builder))
        return new exports.Builder(pkg, options);
    
    if(this.construct===Builder.prototype.construct) {
        this.construct(pkg, options);
    }
}

Builder.prototype.construct = function(pkg, options) {
    this.pkg = pkg;
    this.options = options;
}

Builder.prototype.getLocatorForSpec = function(locator) {
    return LOCATOR.PackageLocator(locator);
}

Builder.prototype.getPackageForLocator = function(locator) {
    return this.options.packageStore.get(locator);
}

Builder.prototype.triggerBuild = function(program, buildOptions) {

    var descriptor = this.pkg.getDescriptor(),
        spec = descriptor.getPinfSpec(),
        self = this;

    // install/build all dependent platforms first
    descriptor.everyPlatform(function(name, locator) {
        var platform = PINF.getPlatformForLocator(locator);
        if(!platform.exists()) {
            platform.init(locator);
        }
    });

    // build all dependencies
    descriptor.everyUsing(function(name, locator) {
        var pkg = self.getPackageForLocator(locator);
        var builder = pkg.getBuilder(self.options);
        builder.triggerBuild(program, buildOptions);        
    });

    // copy all declared commands
    if(spec.commands) {
        var sourcePath,
            targetPath;
        UTIL.every(spec.commands, function(command) {
            var info;
            if(typeof command[1] != "object") {
                throw new Error("Command definition must be an object!");
            }
            if(!command[1].path) {
                throw new Error("Command definition contains no 'path' property!");
            }

            sourcePath = self.pkg.getPath().join(command[1].path);
            if(!sourcePath.exists()) {
                throw new Error("Command declared at 'pinf.commands['"+command[0]+"'] not found at: " + sourcePath);
            }
            targetPath = buildOptions.path.join("bin", command[0]);
            targetPath.dirname().mkdirs();
            var contents = sourcePath.read();
            if(command[1].platform) {
                contents = PINF.getPlatformForLocator(descriptor.getPlatformLocatorForName(command[1].platform)).
                    expandMacros(self.pkg, contents);
            }
            targetPath.write(contents);
            targetPath.chmod(0755);
        });
    }

    this.build(program, buildOptions);
}

Builder.prototype.build = function(program, options) {
    // to be overwritten
}

