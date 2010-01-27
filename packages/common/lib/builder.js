

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");
var LOCATOR = require("./package/locator");

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

Builder.prototype.triggerBuild = function(program, options) {

    var descriptor = this.pkg.getDescriptor(),
        spec = descriptor.getPinfSpec(),
        self = this;
    
    // build all dependencies first
    descriptor.everyUsing(function(name, locator) {
        var pkg = self.getPackageForLocator(locator);
        var builder = pkg.getBuilder(self.options);
        builder.triggerBuild(program, options);        
    });
    
    // copy all declared commands
    if(spec.commands) {
        var sourcePath,
            targetPath;
        UTIL.every(spec.commands, function(command) {
            sourcePath = self.pkg.getPath().join("bin", command[1]);
            if(!sourcePath.exists()) {
                throw new Error("Command declared at 'pinf.commands['"+command[0]+"'] not found at: " + sourcePath);
            }
            targetPath = options.path.join("bin", command[0]);
            targetPath.dirname().mkdirs();
            targetPath.write(self.expandMacros(program, options, sourcePath.read()));
            targetPath.chmod(0755);
        });
    }

    this.build(program, options);
}

Builder.prototype.build = function(program, options) {
    // to be overwritten
}

Builder.prototype.expandMacros = function(program, options, code) {

    code = code.replace(/\/\*PINF_MACRO\[LoadCommandEnvironment\]\*\//g, [
        "//<PINF_MACRO[LoadCommandEnvironment]>",
        "system.sea = require(\"file\").Path(module.path).dirname().join(\"../\").valueOf();",
        "require(\"packages\").main();",
        "//</PINF_MACRO>"
    ].join("\n"));

    return code;
}
