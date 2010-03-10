

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var PACKAGES = require("packages");
var PACKAGE = require("./package");
var LOCATOR = require("./package/locator");
var PINF = require("./pinf");
var OS = require("os");


var Platform = exports.Platform = function(path, locator) {
    if (!(this instanceof exports.Platform))
        return new exports.Platform(path, locator);
    this.path = path;
    this.locator = locator;
}

Platform.prototype = PACKAGE.Package();


Platform.prototype.init = function(locator, name) {
    if(this.exists()) {
        throw new Error("Platform already exists at: " + this.getPath());
    }
    var self = this;
    name = name || locator.getTopLevelId();
    try {
        var pkg = PINF.getPackageForLocator(locator);
        if(!pkg) {
            throw new Error("Could not locate platform package");
        }

        var path = this.getPath();
        path.mkdirs();

        // write package.json file for platform
        var file = path.join("package.json");
        if(file.exists()) {
            throw new Error("Platform package may not install a package descriptor at: " + file);
        }
        file.write(JSON.encode({
            "name": name,
            "using": {
                "platform": locator.getSpec()
            }
        }, null, "    "));


        var builder = pkg.getBuilder({
            "packageStore": this.getPackageStore()
        });


        // TODO: Deprecate 'path' property below
        builder.triggerBuild(this, {
            "path": path,
            "platformName": name
        });

        // write empty bin/activate.bash if it does not exist
        file = path.join("bin", "activate.bash");
        file.dirname().mkdirs();
        if(!file.exists()) {
            file.write("export PATH="+file.dirname()+":\"$PATH\"");
        }
        
        // link all binaries from built programs to platform
        pkg.getDescriptor().everyProgram(function(name, locator) {
            var programPkg = PINF.getDatabase().getProgram(locator),
                binPath = programPkg.getPath().join("bin");
            binPath.listPaths().forEach(function(item) {
                item.symlink(self.getPath().join("bin", item.basename()));
            });
        });

    } catch(e) {
        this.destroy();
        throw e;
    }
    return true;
}

Platform.prototype.update = function() {

    var file = this.getPath().join("package.json");
    if(!file.exists()) {
        throw new Error("No platform descriptor found at: " + file);
    }

    var spec = JSON.decode(file.read().toString());
    if(!spec || !spec.name || !spec.using || !spec.using.platform) {
        throw new Error("Malformed platform descriptor at: " + file);
    }

    try {

        // TODO: We need to compile the platform in a new directory and
        //       only replace the existing one once we know the new one works.        
        this.destroy();
        this.init(LOCATOR.PackageLocator(spec.using.platform), spec.name);

    } catch(e) {
        // The init failed which means we now have a broken or rather missing platform.
        // To allow re-running of "pinf update-platform <ID>" we keep the package.json file
        file.dirname().mkdirs();
        file.write(JSON.encode(spec, null, "    "));
        throw e;
    }
}

Platform.prototype.destroy = function() {
    // NOTE: This removes all local traces of the platform.
    OS.command("rm -Rf " + this.getPath());
}

Platform.prototype.isAliased = function() {
    return (this.getName().split("/").length==1);
}

Platform.prototype.getPackageStore = function() {
    return PINF.getPackageStore();
}

Platform.prototype.getControlPackage = function() {
    var pkg = PINF.getPackageForLocator(this.getDescriptor().getUsingLocatorForName("platform"));
    PACKAGES.registerUsingPackage(pkg.getLocator().getSpec(true), pkg.getPath().valueOf());
    return pkg;
}

Platform.prototype.expandMacros = function(context, contents) {
    return this.callService(context, "expandMacros", [contents]);
}

Platform.prototype.getVariations = function(context) {
    return this.callService(context, "getVariations", []);
}


Platform.prototype.callService = function(context, name, args) {
    var contract_uri = "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/@meta/platform/services/0.1.0",
        pkg = this.getControlPackage(),
        info = pkg.getImplementsForUri(contract_uri);
    if(!info) {
        return false;
    }
    if(!info.module) {
        throw new Error("Implements definition for uri '"+contract_uri+"' does not specify 'module' property.");
    }

    var macros = require(info.module, pkg.getTopLevelId());
    if(!macros[name]) {
        return false;
    }

    return macros[name].apply(null, [
        {
            "platform": this,
            "builder": context.pkg.getBuilder(),
            "targetPackage": context.targetPackage,
            "testPackage": context.testPackage
        }
    ].concat(args));
}
