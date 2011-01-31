

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var LOCATOR = require("../package/locator");
var PACKAGE = require("../package");
var PINF = require("../pinf");
var TERM = require("term");
var JSON = require("json");
var UTIL = require("util");


var PackageBuilder = exports.PackageBuilder = function() {
    if (!(this instanceof exports.PackageBuilder))
        return new exports.PackageBuilder();
}

PackageBuilder.prototype.setSourcePackage = function(pkg) {
    this.sourcePackage = pkg;
}

PackageBuilder.prototype.setTargetPackage = function(pkg) {
    this.targetPackage = pkg;
}

PackageBuilder.prototype.setTarget = function(target) {
    this.target = target;
}

PackageBuilder.prototype.getTarget = function() {
    return this.target;
}

PackageBuilder.prototype.triggerBuild = function(options) {
    
    var self = this;
    options = options || {};
    
    TERM.stream.print("\0magenta(*** Building Package ***\0)");
    TERM.stream.print("\0magenta(    source: "+this.sourcePackage.getPath()+"\0)");
    TERM.stream.print("\0magenta(    target: "+this.targetPackage.getPath()+"\0)");

    
    var sourceBasePath = this.sourcePackage.getPath(),
        targetBasePath = this.targetPackage.getPath();

//    targetBasePath.mkdirs();


    // copy package.json
//    sourceBasePath.join("package.json").copy(targetBasePath.join("package.json"));
/*
    // link primary assets
    // TODO: option to include extra directories such as docs
    [
        "meta",
        "packages",
        "lib",
        "resources"
    ].forEach(function(item) {
        if(sourceBasePath.join(item).exists()) {
            sourceBasePath.join(item).symlink(targetBasePath.join(item));
        }
    });
*/
    
    var implUri = "http://registry.pinf.org/cadorn.org/github/pinf/@meta/package/0.1.0",
        impl = this.sourcePackage.getDescriptor().getImplementsForUri(implUri);

    if(impl) {

        // Build all declared programs
        if(UTIL.has(impl, "programs")) {
            UTIL.every(impl["programs"], function(item) {
                var locator = LOCATOR.PackageLocator(item[1]);
                if(!PINF.getDatabase().hasProgram(locator)) {
                    PINF.getDatabase().buildProgram(locator, options);
                }
            });
        }

        // Build all declared commands
        if(UTIL.has(impl, "commands")) {
            UTIL.every(impl["commands"], function(item) {

                if(typeof item[1] != "object") {
                    throw new Error("Command definition must be an object!");
                }
                if(!UTIL.has(item[1], "path")) {
                    throw new Error("Command definition contains no 'path' property!");
                }

                var sourcePath = sourceBasePath.join(item[1]["path"]);
                if(!sourcePath.exists()) {
                    throw new Error("Command declared at 'commands['"+item[0]+"'] not found at: " + sourcePath);
                }
                var targetPath = targetBasePath.join("bin", item[0]);
                targetPath.dirname().mkdirs();

                var contents = sourcePath.read();
                if(UTIL.has(item[1], "program")) {

                    var locator = LOCATOR.PackageLocator(impl["programs"][item[1]["program"]]);
                    var program = PINF.getDatabase().getProgram(locator);

/*                    
                    var variations = platform.getVariations({
                            "pkg": self.pkg
                        });
                    // write a binary file for each variation if applicable
                    if(UTIL.len(variations)>0) {
                        variations.forEach(function(variantPlatform) {
                            var name = variantPlatform.getName();
                            if(!/^[A-Za-z0-9_-]*$/.test(name)) {
                                throw new Error("Platform name '" + name + "' not a valid variation string ([A-Za-z0-9_-]) ... from platform: " + variantPlatform.getPath());
                            }
                            var variantContents = variantPlatform.expandMacros({
                                    "pkg": self.pkg,
                                    "targetPackage": targetPackage,
                                    "testPackage": buildOptions.testPackage
                                }, contents),
                                variantTargetPath = targetPath.dirname().join(targetPath.basename() + "-" + name);
    
                            variantTargetPath.write(variantContents);
                            variantTargetPath.chmod(0755);
                        });
                        return;
                    } else {
*/
                        contents = program.expandMacros(self, contents);
//                    }
                }
                
                targetPath.write(contents);
                targetPath.chmod(0755);
            });
        }
        
        // build all targets
        if(UTIL.has(impl, "builders")) {
            UTIL.every(impl["builders"], function(item) {

                var targetPackagePath = self.sourcePackage.getBuildPath().join(item[0]);
                
                if(targetPackagePath.exists() && item[0]!="raw") {
                    return;
                }
    
                var locator = LOCATOR.PackageLocator(item[1]),
                    pkg = self.sourcePackage;
    
                if(!locator.getModule()) {
                    throw new Error("'builders."+item[0]+"' locator does not specify a 'module' property");
                }
                if(locator.isCatalog() || locator.isDirect()) {
                    // the module is located in an external package
                    pkg = PINF.getPackageForLocator(locator);
                } else {
                    // the module is in our own package
                    var newLocator = self.sourcePackage.getLocator().clone();
                    newLocator.setModule(locator.getModule());
                    locator = newLocator;
                }
        
                pkg.makeCallable();
        
                // load actual module now that package and dependencies are registered

                var builder;

                try {
                    builder = require(locator.getModule(), pkg.getTopLevelId()).PackageBuilder();
                } catch(e) {
                    print(pkg.getTopLevelId() + " -> " + locator.getModule());
                    throw e;
                }
    
                builder.setTarget(item[0]);
    
                builder.setSourcePackage(self.sourcePackage);
    
                builder.setTargetPackage(PACKAGE.Package(targetPackagePath, self.sourcePackage.getLocator()));
    
                builder.build(options);
            });
        }
    }
}
